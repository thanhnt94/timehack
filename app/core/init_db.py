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
from app.modules.admin.models import SystemConfig, AdminLog
from app.core.config import settings
from sqlalchemy import select, text

def run_sqlite_column_migrations(connection):
    """Ensure all required columns exist in SQLite tables."""
    # 1. users table migration
    try:
        res = connection.execute(text("PRAGMA table_info(users);"))
        user_cols = {row[1] for row in res.fetchall()}
        
        user_new_cols = [
            ("central_auth_id", "INTEGER NULL"),
            ("role", "VARCHAR(50) DEFAULT 'user'"),
            ("avatar_url", "TEXT NULL"),
            ("full_name", "VARCHAR(255) NULL"),
            ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
        ]
        for col, col_type in user_new_cols:
            if col not in user_cols:
                print(f"[MIGRATE] Adding missing column {col} ({col_type}) to users table...")
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type};"))
    except Exception as e:
        print(f"[MIGRATE WARNING] Error inspecting users table: {e}")

    # 2. tasks table migration
    try:
        res = connection.execute(text("PRAGMA table_info(tasks);"))
        task_cols = {row[1] for row in res.fetchall()}
        
        task_new_cols = [
            ("category_id", "INTEGER NULL"),
            ("priority", "VARCHAR(20) DEFAULT 'medium'"),
            ("status", "VARCHAR(20) DEFAULT 'todo'"),
            ("eisenhower", "VARCHAR(20) DEFAULT 'schedule'"),
            ("estimated_minutes", "INTEGER DEFAULT 30"),
            ("spent_seconds", "INTEGER DEFAULT 0"),
            ("due_date", "DATETIME NULL"),
            ("completed_at", "DATETIME NULL"),
            ("order_index", "INTEGER DEFAULT 0"),
            ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
        ]
        for col, col_type in task_new_cols:
            if col not in task_cols:
                print(f"[MIGRATE] Adding missing column {col} ({col_type}) to tasks table...")
                connection.execute(text(f"ALTER TABLE tasks ADD COLUMN {col} {col_type};"))
    except Exception as e:
        print(f"[MIGRATE WARNING] Error inspecting tasks table: {e}")

    # 3. habits table migration
    try:
        res = connection.execute(text("PRAGMA table_info(habits);"))
        habit_cols = {row[1] for row in res.fetchall()}
        
        habit_new_cols = [
            ("category_id", "INTEGER NULL"),
            ("frequency_type", "VARCHAR(20) DEFAULT 'daily'"),
            ("weekly_days", "JSON NULL"),
            ("target_count", "INTEGER DEFAULT 1"),
            ("unit", "VARCHAR(50) DEFAULT 'lần'"),
            ("reminder_time", "VARCHAR(10) NULL"),
            ("icon", "VARCHAR(50) DEFAULT 'zap'"),
            ("color", "VARCHAR(50) DEFAULT '#10B981'"),
            ("archived", "BOOLEAN DEFAULT 0")
        ]
        for col, col_type in habit_new_cols:
            if col not in habit_cols:
                print(f"[MIGRATE] Adding missing column {col} ({col_type}) to habits table...")
                connection.execute(text(f"ALTER TABLE habits ADD COLUMN {col} {col_type};"))
    except Exception as e:
        print(f"[MIGRATE WARNING] Error inspecting habits table: {e}")

    # 4. categories table migration
    try:
        res = connection.execute(text("PRAGMA table_info(categories);"))
        cat_cols = {row[1] for row in res.fetchall()}
        
        cat_new_cols = [
            ("color", "VARCHAR(50) DEFAULT '#8B5CF6'"),
            ("icon", "VARCHAR(50) DEFAULT 'folder'"),
            ("is_default", "BOOLEAN DEFAULT 0")
        ]
        for col, col_type in cat_new_cols:
            if col not in cat_cols:
                print(f"[MIGRATE] Adding missing column {col} ({col_type}) to categories table...")
                connection.execute(text(f"ALTER TABLE categories ADD COLUMN {col} {col_type};"))
    except Exception as e:
        print(f"[MIGRATE WARNING] Error inspecting categories table: {e}")

async def init_db():
    print("[+] Ensuring all database tables exist in TimeHack.db...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(run_sqlite_column_migrations)

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
            if not admin_user.role:
                admin_user.role = "admin"
                await db.commit()
            print(f"[+] Admin user exists: {admin_user.username} (ID={admin_user.id}, Role={admin_user.role})")

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
                server_url=settings.CENTRAL_AUTH_URL or "https://inmind.site",
                client_id=settings.CLIENT_ID,
                client_secret=settings.CLIENT_SECRET,
                redirect_uri="https://time.inmind.site/auth-center/callback"
            )
            db.add(sso_conf)
            await db.commit()
        else:
            if "centralauth.inmind.site" in sso_conf.server_url or not sso_conf.server_url:
                print("[+] Correcting SSO server_url to https://inmind.site...")
                sso_conf.server_url = "https://inmind.site"
                await db.commit()

        print("[+] TimeHack Database initialized successfully with all tables, columns and seeds!")

if __name__ == "__main__":
    asyncio.run(init_db())
