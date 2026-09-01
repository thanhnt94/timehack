from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.modules.auth.models import User
from app.modules.settings.models import UserSettings

router = APIRouter(prefix="/api/v1/user/settings", tags=["UserSettings"])

DEFAULT_POMODORO_SETTINGS = {
    "work_duration": 25,
    "short_break": 5,
    "long_break": 15,
    "sessions_before_long_break": 4,
    "auto_start_breaks": False,
    "auto_start_pomodoros": False,
    "sound_enabled": True,
    "ambient_sound": "none",
    "theme": "dark"
}

@router.get("")
async def get_user_settings(request: Request, db: AsyncSession = Depends(get_db)):
    """Fetch user settings (Pomodoro, audio, theme, notifications)."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = res.scalar_one_or_none()

    settings_dict = dict(DEFAULT_POMODORO_SETTINGS)
    if user_sett and user_sett.settings:
        settings_dict.update(user_sett.settings)

    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    if user and user.timezone:
        settings_dict["timezone"] = user.timezone

    return {
        "status": "ok",
        "settings": settings_dict
    }

@router.post("")
async def save_user_settings(payload: Dict[str, Any], request: Request, db: AsyncSession = Depends(get_db)):
    """Save/update user settings (persisted in DB, zero localStorage)."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = res.scalar_one_or_none()

    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings=payload)
        db.add(user_sett)
    else:
        existing = dict(user_sett.settings) if user_sett.settings else {}
        existing.update(payload)
        user_sett.settings = existing

    # Synchronize User.timezone if present
    if "timezone" in payload and payload["timezone"]:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()
        if user:
            user.timezone = str(payload["timezone"]).strip()

    await db.commit()
    await db.refresh(user_sett)

    return {
        "status": "ok",
        "settings": user_sett.settings
    }
