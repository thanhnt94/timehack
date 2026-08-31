from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
import logging
import time
import asyncio
import os

from app.core.database import get_db
from app.core.config import settings
from app.modules.sso_module.service import SSOService
from app.modules.sso_module.cookie_signer import sign_cookie
from app.modules.auth.models import User
from app.modules.tasks.models import Category

logger = logging.getLogger(__name__)

router = APIRouter(tags=["SSO Integration"])

_HEALTH_CACHE = {"status": False, "ts": 0}

def _check_host(host: str, port: int) -> bool:
    import socket
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except Exception:
        return False

@router.get("/api/v1/auth/config")
async def get_auth_config(db: AsyncSession = Depends(get_db)):
    """Public authentication configuration endpoint for client auto-redirect."""
    config = await SSOService.get_config(db)
    sso_active = config.is_enabled
    server_url = config.server_url or settings.CENTRAL_AUTH_URL
    client_id = config.client_id or settings.CLIENT_ID
    
    if sso_active and server_url:
        now = time.time()
        if now - _HEALTH_CACHE["ts"] < 30:
            sso_active = _HEALTH_CACHE["status"]
        else:
            import urllib.parse
            try:
                parsed = urllib.parse.urlparse(server_url)
                host = parsed.hostname
                port = parsed.port or (443 if parsed.scheme == "https" else 80)
                if not host:
                    sso_active = False
                else:
                    sso_active = await asyncio.to_thread(_check_host, host, port)
            except Exception:
                sso_active = False
            _HEALTH_CACHE["status"] = sso_active
            _HEALTH_CACHE["ts"] = now

    return {
        "auth_provider": "central" if sso_active else "local",
        "sso_enabled": sso_active,
        "jump_url": f"{server_url.rstrip('/')}/api/auth/jump/{client_id}" if sso_active else None
    }

@router.get("/auth-center/callback")
async def sso_callback(request: Request, code: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Standardized callback for CentralAuth SSO."""
    if not code:
        logger.error("SSO callback called without code parameter. Redirecting to /login.")
        return RedirectResponse(url="/login", status_code=303)
    
    try:
        user_data, error = await SSOService.verify_sso_code(db, code)
    except Exception as e:
        logger.error(f"SSO verification exception: {e}")
        return RedirectResponse(url="/login?backdoor=1&error=SSO+service+error", status_code=303)
    
    if error or not user_data:
        logger.error(f"SSO verification error: {error}")
        return RedirectResponse(url=f"/login?backdoor=1&error={error or 'No user data'}", status_code=303)
    
    # Sync or Find user in local DB
    central_id = user_data.get("id")
    email = user_data.get("email")
    username = user_data.get("username") or (email.split("@")[0] if email else f"user_{central_id}")
    full_name = user_data.get("full_name") or username
    avatar_url = user_data.get("avatar_url")
    role = user_data.get("role", "user")

    result = await db.execute(select(User).where((User.central_auth_id == central_id) | (User.email == email)))
    user = result.scalar_one_or_none()

    if not user:
        # Check if username collision
        u_res = await db.execute(select(User).where(User.username == username))
        if u_res.scalar_one_or_none():
            username = f"{username}_{central_id}"
            
        user = User(
            central_auth_id=central_id,
            username=username,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role=role
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Seed default categories
        default_categories = [
            Category(user_id=user.id, name="Công việc", color="#8B5CF6", icon="briefcase", is_default=True),
            Category(user_id=user.id, name="Học tập", color="#3B82F6", icon="book", is_default=True),
            Category(user_id=user.id, name="Sức khỏe & Thể thao", color="#10B981", icon="activity", is_default=True),
            Category(user_id=user.id, name="Cá nhân", color="#F59E0B", icon="user", is_default=True)
        ]
        db.add_all(default_categories)
        await db.commit()
    else:
        user.central_auth_id = central_id
        if full_name: user.full_name = full_name
        if avatar_url: user.avatar_url = avatar_url
        if role: user.role = role
        await db.commit()
        await db.refresh(user)
    
    logger.info(f"SSO login success for user: {user.username} (id={user.id})")
    
    res = RedirectResponse(url="/", status_code=303)
    signed_id = sign_cookie(str(user.id), settings.SECRET_KEY)
    res.set_cookie(key="user_id", value=signed_id, httponly=True, path="/", samesite="lax", max_age=2592000)
    return res

class HandshakeRequest(BaseModel):
    client_id: str
    client_secret: str

@router.post("/api/admin/sso/handshake")
async def sso_handshake(req: HandshakeRequest, db: AsyncSession = Depends(get_db)):
    """Dynamic DB discovery endpoint for CentralAuth Hub."""
    config = await SSOService.get_config(db)
    
    expected_client_id = config.client_id or settings.CLIENT_ID
    expected_client_secret = config.client_secret or settings.CLIENT_SECRET
    
    if expected_client_id != req.client_id:
        raise HTTPException(status_code=401, detail="Client ID mismatch")
        
    if expected_client_secret != req.client_secret:
        raise HTTPException(status_code=401, detail="Client Secret mismatch")
        
    db_url = settings.DATABASE_URL
    db_path = db_url.split("///")[-1] if "///" in db_url else db_url
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.abspath(os.path.join(project_root, db_path))
        
    return {
        "success": True,
        "db_path": db_path
    }
