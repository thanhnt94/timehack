import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Category, TimeEntry, PomodoroSettings, DailyGoal, AppSetting, TodoItem, SmartHabit
from app.models.tag import Tag

app = create_app()

def seed_category_tree(user_id):
    """Tạo cấu trúc cây danh mục mẫu và các Tag liên quan."""
    
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
        db.session.flush()
        root_map[name] = cat.id

    # --- LEVEL 2: Con ---
    work_children = [('Công ty', '🏢'), ('Phát triển phần mềm', '💻')]
    for name, icon in work_children:
        db.session.add(Category(name=name, icon=icon, parent_id=root_map['Công việc'], color_bg='bg-sky-50', color_text='text-sky-600', user_id=user_id))

    edu_children = [('Tiếng Nhật', '🇯🇵'), ('Tiếng Anh', '🇬🇧'), ('Lập trình', '⌨️')]
    edu_map = {}
    for name, icon in edu_children:
        cat = Category(name=name, icon=icon, parent_id=root_map['Học tập'], color_bg='bg-violet-50', color_text='text-violet-600', user_id=user_id)
        db.session.add(cat)
        db.session.flush()
        edu_map[name] = cat.id

    # --- TAGS ---
    tags_data = [
        ('Podcast', ['Tiếng Nhật', 'Tiếng Anh']),
        ('Ngữ pháp', ['Tiếng Nhật', 'Tiếng Anh']),
        ('Từ vựng', ['Tiếng Nhật', 'Tiếng Anh']),
        ('Review', ['Công ty', 'Phát triển phần mềm', 'Lập trình']),
        ('Fix Bug', ['Phát triển phần mềm', 'Lập trình']),
        ('Netflix', ['Giải trí']),
        ('Giao lưu', ['Giải trí', 'Công ty'])
    ]

    # Map để tìm category nhanh
    all_cats = Category.query.filter_by(user_id=user_id).all()
    cat_lookup = {c.name: c for c in all_cats}

    for tag_name, cat_names in tags_data:
        tag = Tag(name=tag_name, user_id=user_id)
        for c_name in cat_names:
            if c_name in cat_lookup:
                tag.categories.append(cat_lookup[c_name])
        db.session.add(tag)

    db.session.commit()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    
    print("Seeding admin...")
    admin = User(username='admin', email='admin@timehack.local', is_admin=True)
    admin.set_password('admin')
    db.session.add(admin)
    db.session.commit()

    print("Seeding category tree and tags...")
    seed_category_tree(admin.id)
    
    PomodoroSettings.get_or_create(admin.id)
    print("Database reset successfully.")
