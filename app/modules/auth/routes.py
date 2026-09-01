from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user_id
from app.modules.sso_module.cookie_signer import sign_cookie
from app.modules.auth.models import User
from app.modules.tasks.models import Category
from app.modules.settings.models import UserSettings

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None

class BackdoorLoginRequest(BaseModel):
    username: str = "admin"
    password: Optional[str] = None

@router.get("/me")
async def get_me(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Get user settings
    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    user_sett = sett_res.scalar_one_or_none()
    settings_dict = user_sett.settings if user_sett and user_sett.settings else {}

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "timezone": user.timezone or settings_dict.get("timezone", "Asia/Ho_Chi_Minh"),
        "role": user.role or "user",
        "settings": settings_dict
    }

@router.post("/login")
async def local_login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Local account login endpoint."""
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Vui lòng nhập tên đăng nhập")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        # Create user for local login
        user = User(
            username=username,
            email=f"{username}@timehack.local",
            full_name=username.capitalize(),
            role="admin" if username.lower() in ["admin", "root"] else "user"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Seed rich preset hierarchical categories
        from app.modules.tasks.routes import seed_user_presets
        await seed_user_presets(user.id, db)

    signed_id = sign_cookie(str(user.id), settings.SECRET_KEY)
    response.set_cookie(key="user_id", value=signed_id, httponly=True, path="/", samesite="lax", max_age=2592000)
    
    return {
        "status": "ok",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/backdoor-login")
async def backdoor_login(payload: BackdoorLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Admin backdoor login for local management."""
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            username=payload.username,
            email=f"{payload.username}@inmind.site",
            full_name="Administrator" if payload.username == "admin" else payload.username,
            role="admin"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    signed_id = sign_cookie(str(user.id), settings.SECRET_KEY)
    response.set_cookie(key="user_id", value=signed_id, httponly=True, path="/", samesite="lax", max_age=2592000)
    return {
        "status": "ok",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="user_id", path="/")
    return {"status": "ok", "message": "Logged out successfully"}

@router.post("/settings")
@router.post("/user/settings")
async def update_user_settings(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()

    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings=payload)
        db.add(user_sett)
    else:
        existing = dict(user_sett.settings) if user_sett.settings else {}
        existing.update(payload)
        user_sett.settings = existing

    # Synchronize User.timezone directly if present
    if "timezone" in payload and payload["timezone"]:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()
        if user:
            user.timezone = str(payload["timezone"]).strip()

    await db.commit()
    return {"status": "ok", "settings": user_sett.settings, "timezone": payload.get("timezone")}
