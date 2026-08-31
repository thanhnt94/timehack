import asyncio
import os
import sys

# Ensure app is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import engine, Base, AsyncSessionLocal
from app.modules.auth.models import User
from app.modules.tasks.models import Category, Task, Subtask
from app.modules.habits.models import Habit, HabitLog
from app.modules.schedule.models import ScheduleSlot
from app.modules.time_tracking.models import TimeLog
from app.modules.notifications.models import UserNotification
from app.modules.settings.models import UserSettings
from app.modules.sso_module.models import SSOConfig
from app.core.config import settings
from sqlalchemy import select

async def init_db():
    print("[+] Ensuring all database tables exist in TimeHack.db...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed or find default Admin User
        user_res = await db.execute(select(User).where(User.id == 1))
        admin_user = user_res.scalar_one_or_none()

        if not admin_user:
            print("[+] Creating default admin user (ID=1)...")
            admin_user = User(
                id=1,
                username="admin",
                email="admin@inmind.site",
                full_name="Administrator",
                role="admin"
            )
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
        else:
            print(f"[+] Admin user exists: {admin_user.username} (ID={admin_user.id})")

        # 2. Seed default Categories for User 1
        cat_res = await db.execute(select(Category).where(Category.user_id == admin_user.id))
        existing_cats = cat_res.scalars().all()

        if not existing_cats:
            print("[+] Seeding default categories for user 1...")
            default_categories = [
                Category(user_id=admin_user.id, name="Công việc", color="#8B5CF6", icon="briefcase", is_default=True),
                Category(user_id=admin_user.id, name="Học tập", color="#3B82F6", icon="book", is_default=True),
                Category(user_id=admin_user.id, name="Sức khỏe & Thể thao", color="#10B981", icon="activity", is_default=True),
                Category(user_id=admin_user.id, name="Cá nhân", color="#F59E0B", icon="user", is_default=True)
            ]
            db.add_all(default_categories)
            await db.commit()

        # 3. Seed default UserSettings for User 1
        sett_res = await db.execute(select(UserSettings).where(UserSettings.user_id == admin_user.id))
        user_sett = sett_res.scalar_one_or_none()

        if not user_sett:
            print("[+] Seeding default UserSettings...")
            user_sett = UserSettings(
                user_id=admin_user.id,
                settings={
                    "theme": "light",
                    "pomodoro_duration": 25,
                    "short_break_duration": 5,
                    "long_break_duration": 15,
                    "auto_start_breaks": False,
                    "sound_enabled": True
                }
            )
            db.add(user_sett)
            await db.commit()

        # 4. Seed default SSOConfig
        sso_res = await db.execute(select(SSOConfig))
        sso_conf = sso_res.scalar_one_or_none()

        if not sso_conf:
            print("[+] Seeding default SSOConfig...")
            sso_conf = SSOConfig(
                is_enabled=True,
                server_url=settings.CENTRAL_AUTH_URL,
                client_id=settings.CLIENT_ID,
                client_secret=settings.CLIENT_SECRET,
                redirect_uri="https://time.inmind.site/auth-center/callback"
            )
            db.add(sso_conf)
            await db.commit()

        print("[+] TimeHack Database initialized successfully with all tables and seeds!")

if __name__ == "__main__":
    asyncio.run(init_db())
