from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import User, Category
from .auth import get_password_hash
import logging

logger = logging.getLogger(__name__)

async def seed_db(db: AsyncSession):
    """Seed the database with initial data (Admin user and default categories)."""
    
    # 1. Check if Admin exists
    result = await db.execute(select(User).where((User.username == 'admin') | (User.email == 'admin@timehack.local')))
    admin = result.scalar_one_or_none()
    
    if not admin:
        logger.info("Seeding default admin user (admin/admin)...")
        admin = User(
            username='admin',
            email='admin@timehack.local',
            password_hash=get_password_hash('admin'),
            is_admin=True,
            full_name="Administrator"
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        logger.info(f"Admin user created (ID: {admin.id})")
        
        # 2. Seed default categories for admin
        # Ported from legacy Category.seed_defaults
        default_categories = [
            {"name": "Công việc", "icon": "💼", "color": "#3B82F6", "color_bg": "bg-blue-50", "color_text": "text-blue-600"},
            {"name": "Học tập", "icon": "📚", "color": "#8B5CF6", "color_bg": "bg-purple-50", "color_text": "text-purple-600"},
            {"name": "Sức khỏe", "icon": "🧘", "color": "#10B981", "color_bg": "bg-emerald-50", "color_text": "text-emerald-600"},
            {"name": "Giải trí", "icon": "🎮", "color": "#F59E0B", "color_bg": "bg-amber-50", "color_text": "text-amber-600"},
            {"name": "Cá nhân", "icon": "👤", "color": "#6366F1", "color_bg": "bg-indigo-50", "color_text": "text-indigo-600"},
            {"name": "Khác", "icon": "✨", "color": "#64748B", "color_bg": "bg-slate-50", "color_text": "text-slate-600"},
        ]
        
        for cat_data in default_categories:
            cat = Category(
                user_id=admin.id,
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                color_bg=cat_data["color_bg"],
                color_text=cat_data["color_text"],
                is_default=True
            )
            db.add(cat)
        
        await db.commit()
        logger.info("Default categories seeded.")
    else:
        logger.info(f"Admin user already exists ({admin.username}).")
