from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user_id
from app.modules.auth.models import User
from app.modules.tasks.models import Task, Category
from app.modules.habits.models import Habit, HabitLog
from app.modules.time_tracking.models import TimeLog
from app.modules.sso_module.models import SSOConfig
from app.modules.sso_module.service import SSOService
from app.modules.notifications.telegram_service import TelegramService

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

async def verify_admin_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Quản trị viên (Admin)")
    return user

# --- Pydantic Schemas ---
class UpdateSSORequest(BaseModel):
    is_enabled: bool
    server_url: str
    client_id: str
    client_secret: str
    redirect_uri: str

class UpdateLocalTelegramRequest(BaseModel):
    telegram_bot_token: Optional[str] = None
    telegram_bot_username: Optional[str] = None
    telegram_bot_enabled: Optional[bool] = False

class TestTelegramRequest(BaseModel):
    chat_id: str
    message: Optional[str] = "🔔 [TimeHack Admin] Kiểm tra kết nối Telegram Bot thành công!"

class UpdateUserRoleRequest(BaseModel):
    role: str # 'admin' or 'user'

# --- Endpoints ---
@router.get("/overview")
async def get_admin_overview(
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns high level system stats for Admin Dashboard."""
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    tasks_count = (await db.execute(select(func.count(Task.id)))).scalar() or 0
    habits_count = (await db.execute(select(func.count(Habit.id)))).scalar() or 0
    
    focus_seconds = (await db.execute(select(func.sum(TimeLog.duration_seconds)))).scalar() or 0
    focus_minutes = round(focus_seconds / 60, 1)

    sso_config = await SSOService.get_config(db)

    # Check SQLite DB file size
    db_url = settings.DATABASE_URL
    db_path = db_url.split("///")[-1] if "///" in db_url else db_url
    db_size_kb = 0
    if os.path.exists(db_path):
        db_size_kb = round(os.path.getsize(db_path) / 1024, 1)

    return {
        "stats": {
            "total_users": users_count,
            "total_tasks": tasks_count,
            "total_habits": habits_count,
            "total_focus_minutes": focus_minutes,
            "db_size_kb": db_size_kb,
            "db_path": db_path
        },
        "sso": sso_config.to_dict()
    }

@router.get("/sso")
async def get_sso_settings(
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    config = await SSOService.get_config(db)
    return config.to_dict()

@router.post("/sso")
async def update_sso_settings(
    payload: UpdateSSORequest,
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    config = await SSOService.get_config(db)
    config.is_enabled = payload.is_enabled
    config.server_url = payload.server_url.strip()
    config.client_id = payload.client_id.strip()
    config.client_secret = payload.client_secret.strip()
    config.redirect_uri = payload.redirect_uri.strip()
    
    await db.commit()
    await db.refresh(config)
    return {"status": "ok", "sso": config.to_dict()}

@router.post("/sso/test-connection")
async def test_sso_connection(
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    config = await SSOService.get_config(db)
    server_url = config.server_url or settings.CENTRAL_AUTH_URL
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{server_url.rstrip('/')}/api/auth/verify-token")
            return {
                "status": "ok",
                "message": "Kết nối máy chủ CentralAuth thành công!",
                "server_url": server_url,
                "reachable": True
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Không thể kết nối đến CentralAuth: {str(e)}",
            "server_url": server_url,
            "reachable": False
        }

# --- Local Telegram Bot Configuration Endpoints ---
@router.get("/telegram")
async def get_admin_telegram_config(
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    config = await SSOService.get_config(db)
    return {
        "is_sso_managed": bool(config.is_enabled),
        "telegram_bot_token": config.telegram_bot_token or "",
        "telegram_bot_username": config.telegram_bot_username or "",
        "telegram_bot_enabled": bool(config.telegram_bot_enabled)
    }

@router.post("/telegram")
async def update_admin_telegram_config(
    payload: UpdateLocalTelegramRequest,
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    config = await SSOService.get_config(db)
    if payload.telegram_bot_token is not None:
        config.telegram_bot_token = payload.telegram_bot_token.strip()
    if payload.telegram_bot_username is not None:
        config.telegram_bot_username = payload.telegram_bot_username.strip()
    if payload.telegram_bot_enabled is not None:
        config.telegram_bot_enabled = payload.telegram_bot_enabled

    await db.commit()
    await db.refresh(config)
    return {
        "status": "ok",
        "telegram_bot_token": config.telegram_bot_token,
        "telegram_bot_username": config.telegram_bot_username,
        "telegram_bot_enabled": config.telegram_bot_enabled
    }

@router.post("/telegram/test-bot")
async def test_telegram_bot_token(
    payload: Dict[str, Any],
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    token = payload.get("token")
    if not token:
        config = await SSOService.get_config(db)
        token = config.telegram_bot_token

    if not token:
        raise HTTPException(status_code=400, detail="Chưa cung cấp Telegram Bot Token")

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(f"https://api.telegram.org/bot{token.strip()}/getMe")
            data = res.json()
            if data.get("ok"):
                bot_info = data.get("result", {})
                return {
                    "status": "ok",
                    "message": f"Bot @{bot_info.get('username')} ({bot_info.get('first_name')}) hoạt động bình thường!",
                    "bot_username": bot_info.get("username"),
                    "bot_name": bot_info.get("first_name")
                }
            else:
                return {
                    "status": "error",
                    "message": f"Lỗi Telegram API: {data.get('description', 'Token không hợp lệ')}"
                }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Không thể kết nối Telegram API: {str(e)}"
        }

@router.post("/telegram/test")
async def test_telegram_broadcast(
    payload: TestTelegramRequest,
    admin: User = Depends(verify_admin_user)
):
    sent = await TelegramService.send_message(
        chat_id=payload.chat_id.strip(),
        text=payload.message or "🔔 [TimeHack Admin] Test Notification",
        user_id=admin.id
    )
    return {
        "status": "ok" if sent else "failed",
        "sent": sent,
        "chat_id": payload.chat_id
    }

@router.get("/users")
async def list_users(
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).order_by(User.id.asc()))
    users = res.scalars().all()

    # 1. Batch task counts
    t_counts_res = await db.execute(select(Task.user_id, func.count(Task.id)).group_by(Task.user_id))
    task_count_map = dict(t_counts_res.all())

    # 2. Batch habit counts
    h_counts_res = await db.execute(select(Habit.user_id, func.count(Habit.id)).group_by(Habit.user_id))
    habit_count_map = dict(h_counts_res.all())
    
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role or "user",
            "central_auth_id": u.central_auth_id,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "tasks_count": task_count_map.get(u.id, 0),
            "habits_count": habit_count_map.get(u.id, 0)
        })
    return result

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    admin: User = Depends(verify_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Vai trò không hợp lệ (chỉ chấp nhận 'admin' hoặc 'user')")
        
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    user.role = payload.role
    await db.commit()
    return {"status": "ok", "user_id": user.id, "new_role": user.role}
