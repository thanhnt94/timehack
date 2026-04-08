"""TimeHack entry point."""

from app import create_app

app = create_app()

# Ensure all database tables are created and seed default admin
with app.app_context():
    from app.extensions import db
    from app.models import User, Category, TimeEntry, PomodoroSettings, DailyGoal
    import os

    # 1. Create database directory if it doesn't exist
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if db_uri.startswith('sqlite:///'):
        db_path_str = db_uri.replace('sqlite:///', '')
        db_dir = os.path.dirname(db_path_str)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
            print(f"Created database directory: {db_dir}")

    # 2. Create tables
    db.create_all()

    # 3. Seed Admin if not exists
    admin_by_user = User.query.filter_by(username='admin').first()
    admin_by_email = User.query.filter_by(email='admin@timehack.local').first()

    target_admin = admin_by_user or admin_by_email

    if not target_admin:
        print("Seeding default admin user (admin/admin)...")
        admin = User(
            username='admin',
            email='admin@timehack.local',
            is_admin=True,
        )
        admin.set_password('admin')
        db.session.add(admin)
        db.session.commit()

        # Seed default categories for admin
        Category.seed_defaults(admin.id)
        # Seed default pomodoro settings
        PomodoroSettings.get_or_create(admin.id)

        print("Admin user created successfully.")
    else:
        if not target_admin.is_admin:
            target_admin.is_admin = True
            db.session.commit()
            print(f"Existing user '{target_admin.username}' promoted to Admin.")
        else:
            print(f"Admin user already exists ({target_admin.username}).")

    print("Database ready.")

if __name__ == '__main__':
    app.run(debug=True, port=5050)
