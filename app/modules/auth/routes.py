from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import User, Category, UserSettings

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.get("/me")
async def get_me(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create default user if not exists
        user = User(
            id=user_id,
            username=f"user_{user_id}",
            email=f"user_{user_id}@timehack.local",
            full_name=f"User {user_id}"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Seed default categories for new user
        default_categories = [
            Category(user_id=user.id, name="Công việc", color="#8B5CF6", icon="briefcase", is_default=True),
            Category(user_id=user.id, name="Học tập", color="#3B82F6", icon="book", is_default=True),
            Category(user_id=user.id, name="Sức khỏe & Thể thao", color="#10B981", icon="activity", is_default=True),
            Category(user_id=user.id, name="Cá nhân", color="#F59E0B", icon="user", is_default=True)
        ]
        db.add_all(default_categories)
        await db.commit()

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
        "settings": settings_dict
    }

@router.post("/settings")
async def update_user_settings(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = sett_res.scalar_one_or_none()

    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings=payload)
        db.add(user_sett)
    else:
        existing = dict(user_sett.settings) if user_sett.settings else {}
        existing.update(payload)
        user_sett.settings = existing

    await db.commit()
    return {"status": "ok", "settings": user_sett.settings}
