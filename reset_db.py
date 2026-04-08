import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Category, TimeEntry, PomodoroSettings, DailyGoal, AppSetting

app = create_app()

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

    Category.seed_defaults(admin.id)
    PomodoroSettings.get_or_create(admin.id)
    print("Database recreated and seeded successfully.")
