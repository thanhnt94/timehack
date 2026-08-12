from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import UserNotification, UserSettings

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
