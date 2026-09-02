import secrets
import httpx
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models import UserNotification, UserSettings, User
from app.modules.notifications.telegram_service import TelegramService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(
        select(UserNotification)
        .where(UserNotification.user_id == user_id)
        .order_by(UserNotification.created_at.desc())
        .limit(30)
    )
    notifs = res.scalars().all()
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifs]

@router.patch("/{notif_id}/read")
async def mark_read(notif_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(UserNotification).where(UserNotification.id == notif_id, UserNotification.user_id == user_id))
    n = res.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"status": "ok"}

@router.get("/telegram/config")
async def get_telegram_config(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    # 1. Load User and UserSettings
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    
    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()
    
    existing_settings = dict(user_sett.settings) if user_sett and user_sett.settings else {}
    
    # 2. Check CentralAuth proxy if CentralAuth ID exists
    if settings.CENTRAL_AUTH_URL and user and user.central_auth_id:
        try:
            queue_token = getattr(settings, "QUEUE_API_SECRET", "super-secret-token-123")
            async with httpx.AsyncClient(timeout=6.0) as client:
                ca_url = f"{settings.CENTRAL_AUTH_URL.rstrip('/')}/api/queue/telegram/config/{user.central_auth_id}"
                ca_res = await client.get(ca_url, headers={"X-Queue-Token": queue_token, "X-Queue-Secret": queue_token})
                if ca_res.status_code == 200:
                    ca_data = ca_res.json()
                    # If CentralAuth has linked chat_id, sync locally
                    if ca_data.get("is_linked") and ca_data.get("telegram_chat_id"):
                        if existing_settings.get("telegram_chat_id") != ca_data.get("telegram_chat_id"):
                            existing_settings["telegram_chat_id"] = ca_data.get("telegram_chat_id")
                            if not user_sett:
                                user_sett = UserSettings(user_id=user_id, settings=existing_settings)
                                db.add(user_sett)
                            else:
                                user_sett.settings = existing_settings
                            await db.commit()
                    return {
                        "is_linked": ca_data.get("is_linked", False),
                        "telegram_chat_id": ca_data.get("telegram_chat_id") or existing_settings.get("telegram_chat_id"),
                        "connect_token": ca_data.get("connect_token"),
                        "bot_username": ca_data.get("bot_username", "InMindBot"),
                        "reminder_time": existing_settings.get("reminder_time", ca_data.get("reminder_time", "20:00")),
                        "is_active": existing_settings.get("telegram_is_active", True),
                        "morning_briefing_enabled": existing_settings.get("morning_briefing_enabled", True),
                        "morning_briefing_time": existing_settings.get("morning_briefing_time", "07:30"),
                        "evening_reflection_enabled": existing_settings.get("evening_reflection_enabled", True),
                        "evening_reflection_time": existing_settings.get("evening_reflection_time", "21:30"),
                        "inactivity_reminder_enabled": existing_settings.get("inactivity_reminder_enabled", True),
                        "inactivity_reminder_interval_hours": existing_settings.get("inactivity_reminder_interval_hours", 2),
                        "notify_task": existing_settings.get("notify_task", True),
                        "notify_habit": existing_settings.get("notify_habit", True),
                        "notify_task_deadline": existing_settings.get("notify_task_deadline", True),
                        "notify_habit_reminder": existing_settings.get("notify_habit_reminder", True),
                        "notify_daily_report": existing_settings.get("notify_daily_report", True)
                    }
        except Exception as e:
            logger.warning(f"CentralAuth Telegram config proxy error: {e}")

    # 3. Fallback to local settings & token
    if not existing_settings.get("telegram_connect_token"):
        existing_settings["telegram_connect_token"] = f"TH_{secrets.token_hex(4).upper()}"
        if not user_sett:
            user_sett = UserSettings(user_id=user_id, settings=existing_settings)
            db.add(user_sett)
        else:
            user_sett.settings = existing_settings
        await db.commit()

    return {
        "is_linked": bool(existing_settings.get("telegram_chat_id")),
        "telegram_chat_id": existing_settings.get("telegram_chat_id"),
        "connect_token": existing_settings.get("telegram_connect_token"),
        "bot_username": "InMindBot",
        "reminder_time": existing_settings.get("reminder_time", "20:00"),
        "is_active": existing_settings.get("telegram_is_active", True),
        "morning_briefing_enabled": existing_settings.get("morning_briefing_enabled", True),
        "morning_briefing_time": existing_settings.get("morning_briefing_time", "07:30"),
        "evening_reflection_enabled": existing_settings.get("evening_reflection_enabled", True),
        "evening_reflection_time": existing_settings.get("evening_reflection_time", "21:30"),
        "inactivity_reminder_enabled": existing_settings.get("inactivity_reminder_enabled", True),
        "inactivity_reminder_interval_hours": existing_settings.get("inactivity_reminder_interval_hours", 2),
        "notify_task": existing_settings.get("notify_task", True),
        "notify_habit": existing_settings.get("notify_habit", True),
        "notify_task_deadline": existing_settings.get("notify_task_deadline", True),
        "notify_habit_reminder": existing_settings.get("notify_habit_reminder", True),
        "notify_daily_report": existing_settings.get("notify_daily_report", True)
    }

@router.post("/telegram/config")
async def update_telegram_config(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    
    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()
    existing_settings = dict(user_sett.settings) if user_sett and user_sett.settings else {}

    # Check CentralAuth proxy update
    if settings.CENTRAL_AUTH_URL and user and user.central_auth_id:
        try:
            queue_token = getattr(settings, "QUEUE_API_SECRET", "super-secret-token-123")
            async with httpx.AsyncClient(timeout=6.0) as client:
                ca_url = f"{settings.CENTRAL_AUTH_URL.rstrip('/')}/api/queue/telegram/config/{user.central_auth_id}"
                await client.post(ca_url, json=payload, headers={"X-Queue-Token": queue_token, "X-Queue-Secret": queue_token})
        except Exception as e:
            logger.warning(f"CentralAuth Telegram config update proxy error: {e}")

    # Handle unlink
    if payload.get("unlink") is True:
        existing_settings["telegram_chat_id"] = None
        existing_settings["telegram_connect_token"] = f"TH_{secrets.token_hex(4).upper()}"
    else:
        for k in [
            "reminder_time", "notify_task", "notify_habit", "notify_daily_report",
            "telegram_is_active", "telegram_chat_id",
            "morning_briefing_enabled", "morning_briefing_time",
            "evening_reflection_enabled", "evening_reflection_time",
            "inactivity_reminder_enabled", "inactivity_reminder_interval_hours",
            "notify_task_deadline", "notify_habit_reminder"
        ]:
            if k in payload:
                existing_settings[k] = payload[k]

    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings=existing_settings)
        db.add(user_sett)
    else:
        user_sett.settings = existing_settings

    await db.commit()
    return {"status": "ok", "settings": existing_settings}

@router.post("/telegram/link")
async def link_telegram_chat(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    chat_id = payload.get("telegram_chat_id")
    if not chat_id:
        raise HTTPException(status_code=400, detail="telegram_chat_id is required")

    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()
    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings={"telegram_chat_id": chat_id})
        db.add(user_sett)
    else:
        existing = dict(user_sett.settings) if user_sett.settings else {}
        existing["telegram_chat_id"] = chat_id
        user_sett.settings = existing

    await db.commit()
    return {"status": "ok", "telegram_chat_id": chat_id}

@router.post("/telegram/test")
async def send_test_telegram(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()
    chat_id = user_sett.settings.get("telegram_chat_id") if user_sett and user_sett.settings else None
    
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chưa liên kết Telegram Bot trong Cài đặt")
        
    sent = await TelegramService.send_message(
        chat_id=str(chat_id),
        text="<b>🔔 [TimeHack] Thông báo thử nghiệm</b>\n\n🎉 Kết nối Telegram Bot với TimeHack thành công! Bạn sẽ nhận được các thông báo nhắc việc & thói quen tại đây.",
        user_id=user_id
    )
    return {"status": "ok" if sent else "failed", "sent": sent}
