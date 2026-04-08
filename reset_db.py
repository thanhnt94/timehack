import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Category, TimeEntry, PomodoroSettings, DailyGoal, AppSetting, TodoItem

app = create_app()

def seed_category_tree(user_id):
    """Tạo cấu trúc cây danh mục mẫu."""
    
    # --- LEVEL 1: Gốc ---
    roots = [
        ('Công việc', '💼', '#0ea5e9', 'bg-sky-50', 'text-sky-600'),
        ('Học tập', '📚', '#8b5cf6', 'bg-violet-50', 'text-violet-600'),
        ('Giải trí', '🎮', '#ec4899', 'bg-pink-50', 'text-pink-600'),
        ('Sinh hoạt', '🏠', '#64748b', 'bg-slate-50', 'text-slate-600')
    ]
    
    root_map = {}
    for name, icon, hex_color, bg, text in roots:
        cat = Category(name=name, icon=icon, color=hex_color, color_bg=bg, color_text=text, user_id=user_id)
        db.session.add(cat)
        db.session.flush() # Để lấy ID ngay lập tức
        root_map[name] = cat.id

    # --- LEVEL 2: Con ---
    # Con của Công việc
    work_children = [
        ('Công ty', '🏢'),
        ('Phát triển phần mềm', '💻')
    ]
    for name, icon in work_children:
        db.session.add(Category(name=name, icon=icon, parent_id=root_map['Công việc'], 
                                color_bg='bg-sky-50', color_text='text-sky-600', user_id=user_id))

    # Con của Học tập
    edu_children = [
        ('Tiếng Nhật', '🇯🇵'),
        ('Tiếng Anh', '🇬🇧'),
        ('Lập trình', '⌨️')
    ]
    edu_map = {}
    for name, icon in edu_children:
        cat = Category(name=name, icon=icon, parent_id=root_map['Học tập'], 
                       color_bg='bg-violet-50', color_text='text-violet-600', user_id=user_id)
        db.session.add(cat)
        db.session.flush()
        edu_map[name] = cat.id

    # Con của Giải trí
    ent_children = [
        ('Chơi game/Xem phim', '🎬'),
        ('Chơi với thú cưng', '🐕'),
        ('Không gian riêng', '🧘')
    ]
    for name, icon in ent_children:
        db.session.add(Category(name=name, icon=icon, parent_id=root_map['Giải trí'], 
                                color_bg='bg-pink-50', color_text='text-pink-600', user_id=user_id))

    # Con của Sinh hoạt
    life_children = [
        ('Ăn uống', '🍲'),
        ('Di chuyển', '🚗'),
        ('Vệ sinh cá nhân', '🚿')
    ]
    for name, icon in life_children:
        db.session.add(Category(name=name, icon=icon, parent_id=root_map['Sinh hoạt'], 
                                color_bg='bg-slate-50', color_text='text-slate-600', user_id=user_id))

    # --- LEVEL 3: Cháu ---
    # Cháu của Học tập (Dưới Tiếng Nhật và Tiếng Anh)
    lang_grandchildren = [
        ('Học từ vựng', '📝'),
        ('Nghe Podcast', '🎧')
    ]
    for parent_name in ['Tiếng Nhật', 'Tiếng Anh']:
        for name, icon in lang_grandchildren:
            db.session.add(Category(name=name, icon=icon, parent_id=edu_map[parent_name], 
                                    color_bg='bg-violet-50', color_text='text-violet-600', user_id=user_id))

    db.session.commit()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    
    print("Seeding admin...")
    admin = User(
        username='admin',
        email='admin@timehack.local',
        is_admin=True,
    )
    admin.set_password('admin')
    db.session.add(admin)
    db.session.commit()

    print("Seeding category tree...")
    seed_category_tree(admin.id)
    
    PomodoroSettings.get_or_create(admin.id)
    print("Database recreated and hierarchy tree seeded successfully.")
