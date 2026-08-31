"""initial_timehack_schema

Revision ID: 0001_initial_timehack_schema
Revises: 
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_timehack_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. users
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('central_auth_id', sa.Integer(), nullable=True),
            sa.Column('username', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=True),
            sa.Column('avatar_url', sa.Text(), nullable=True),
            sa.Column('role', sa.String(length=50), server_default='user', nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_central_auth_id'), 'users', ['central_auth_id'], unique=True)

    # 2. categories
    if 'categories' not in existing_tables:
        op.create_table(
            'categories',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('color', sa.String(length=50), server_default='#8B5CF6', nullable=True),
            sa.Column('icon', sa.String(length=50), server_default='folder', nullable=True),
            sa.Column('is_default', sa.Boolean(), server_default=sa.text('0'), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
        op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)

    # 3. tasks
    if 'tasks' not in existing_tables:
        op.create_table(
            'tasks',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('priority', sa.String(length=20), server_default='medium', nullable=True),
            sa.Column('status', sa.String(length=20), server_default='todo', nullable=True),
            sa.Column('eisenhower', sa.String(length=20), server_default='schedule', nullable=True),
            sa.Column('estimated_minutes', sa.Integer(), server_default='30', nullable=True),
            sa.Column('spent_seconds', sa.Integer(), server_default='0', nullable=True),
            sa.Column('due_date', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('order_index', sa.Integer(), server_default='0', nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
        op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)

    # 4. subtasks
    if 'subtasks' not in existing_tables:
        op.create_table(
            'subtasks',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('task_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('is_completed', sa.Boolean(), server_default=sa.text('0'), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_subtasks_id'), 'subtasks', ['id'], unique=False)
        op.create_index(op.f('ix_subtasks_task_id'), 'subtasks', ['task_id'], unique=False)

    # 5. habits
    if 'habits' not in existing_tables:
        op.create_table(
            'habits',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('frequency_type', sa.String(length=20), server_default='daily', nullable=True),
            sa.Column('weekly_days', sa.JSON(), nullable=True),
            sa.Column('target_count', sa.Integer(), server_default='1', nullable=True),
            sa.Column('unit', sa.String(length=50), server_default='lần', nullable=True),
            sa.Column('reminder_time', sa.String(length=10), nullable=True),
            sa.Column('icon', sa.String(length=50), server_default='zap', nullable=True),
            sa.Column('color', sa.String(length=50), server_default='#10B981', nullable=True),
            sa.Column('archived', sa.Boolean(), server_default=sa.text('0'), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_habits_id'), 'habits', ['id'], unique=False)
        op.create_index(op.f('ix_habits_user_id'), 'habits', ['user_id'], unique=False)

    # 6. habit_logs
    if 'habit_logs' not in existing_tables:
        op.create_table(
            'habit_logs',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('habit_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('logged_date', sa.Date(), nullable=False),
            sa.Column('count', sa.Integer(), server_default='1', nullable=True),
            sa.Column('completed', sa.Boolean(), server_default=sa.text('1'), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('habit_id', 'logged_date', name='uq_habit_date')
        )
        op.create_index(op.f('ix_habit_logs_id'), 'habit_logs', ['id'], unique=False)
        op.create_index(op.f('ix_habit_logs_habit_id'), 'habit_logs', ['habit_id'], unique=False)
        op.create_index(op.f('ix_habit_logs_user_id'), 'habit_logs', ['user_id'], unique=False)

    # 7. schedule_slots
    if 'schedule_slots' not in existing_tables:
        op.create_table(
            'schedule_slots',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('start_time', sa.String(length=10), nullable=False),
            sa.Column('end_time', sa.String(length=10), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('task_id', sa.Integer(), nullable=True),
            sa.Column('habit_id', sa.Integer(), nullable=True),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('is_done', sa.Boolean(), server_default=sa.text('0'), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_schedule_slots_id'), 'schedule_slots', ['id'], unique=False)
        op.create_index(op.f('ix_schedule_slots_date'), 'schedule_slots', ['date'], unique=False)
        op.create_index(op.f('ix_schedule_slots_user_id'), 'schedule_slots', ['user_id'], unique=False)

    # 8. time_logs
    if 'time_logs' not in existing_tables:
        op.create_table(
            'time_logs',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('task_id', sa.Integer(), nullable=True),
            sa.Column('habit_id', sa.Integer(), nullable=True),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('start_time', sa.DateTime(), nullable=False),
            sa.Column('end_time', sa.DateTime(), nullable=False),
            sa.Column('duration_seconds', sa.Integer(), server_default='0', nullable=True),
            sa.Column('timer_type', sa.String(length=20), server_default='pomodoro', nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_time_logs_id'), 'time_logs', ['id'], unique=False)
        op.create_index(op.f('ix_time_logs_user_id'), 'time_logs', ['user_id'], unique=False)

    # 9. user_notifications
    if 'user_notifications' not in existing_tables:
        op.create_table(
            'user_notifications',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('type', sa.String(length=50), server_default='system', nullable=True),
            sa.Column('is_read', sa.Boolean(), server_default=sa.text('0'), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_user_notifications_id'), 'user_notifications', ['id'], unique=False)
        op.create_index(op.f('ix_user_notifications_user_id'), 'user_notifications', ['user_id'], unique=False)

    # 10. user_settings
    if 'user_settings' not in existing_tables:
        op.create_table(
            'user_settings',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('settings', sa.JSON(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id')
        )
        op.create_index(op.f('ix_user_settings_id'), 'user_settings', ['id'], unique=False)
        op.create_index(op.f('ix_user_settings_user_id'), 'user_settings', ['user_id'], unique=True)

    # 11. sso_settings
    if 'sso_settings' not in existing_tables:
        op.create_table(
            'sso_settings',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('is_enabled', sa.Boolean(), server_default=sa.text('1'), nullable=False),
            sa.Column('server_url', sa.String(length=255), server_default='https://inmind.site', nullable=False),
            sa.Column('client_id', sa.String(length=100), server_default='timehack-v1', nullable=False),
            sa.Column('client_secret', sa.String(length=255), server_default='timehack_secret_123', nullable=False),
            sa.Column('redirect_uri', sa.String(length=255), server_default='https://time.inmind.site/auth-center/callback', nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

    # 12. system_configs
    if 'system_configs' not in existing_tables:
        op.create_table(
            'system_configs',
            sa.Column('id', sa.String(length=50), nullable=False, primary_key=True),
            sa.Column('value', sa.JSON(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

    # 13. admin_logs
    if 'admin_logs' not in existing_tables:
        op.create_table(
            'admin_logs',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('admin_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=100), nullable=True),
            sa.Column('details', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_admin_logs_id'), 'admin_logs', ['id'], unique=False)
        op.create_index(op.f('ix_admin_logs_admin_id'), 'admin_logs', ['admin_id'], unique=False)


def downgrade() -> None:
    op.drop_table('admin_logs')
    op.drop_table('system_configs')
    op.drop_table('sso_settings')
    op.drop_table('user_settings')
    op.drop_table('user_notifications')
    op.drop_table('time_logs')
    op.drop_table('schedule_slots')
    op.drop_table('habit_logs')
    op.drop_table('habits')
    op.drop_table('subtasks')
    op.drop_table('tasks')
    op.drop_table('categories')
    op.drop_table('users')
