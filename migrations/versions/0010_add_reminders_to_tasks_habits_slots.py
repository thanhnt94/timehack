"""add_reminders_to_tasks_habits_slots

Revision ID: 0010_add_reminders_to_tasks_habits_slots
Revises: 0009_add_telegram_bot_settings_to_sso_config
Create Date: 2026-09-02 10:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0010_add_reminders_to_tasks_habits_slots'
down_revision: Union[str, None] = '0009_add_telegram_bot_settings_to_sso_config'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Update tasks table
    if 'tasks' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('tasks')]
        if 'reminder_enabled' not in columns:
            op.add_column('tasks', sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        if 'remind_at' not in columns:
            op.add_column('tasks', sa.Column('remind_at', sa.DateTime(), nullable=True))
        if 'remind_before_mins' not in columns:
            op.add_column('tasks', sa.Column('remind_before_mins', sa.Integer(), nullable=True, server_default=sa.text('30')))

    # 2. Update habits table
    if 'habits' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('habits')]
        if 'reminder_enabled' not in columns:
            op.add_column('habits', sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        if 'remind_before_mins' not in columns:
            op.add_column('habits', sa.Column('remind_before_mins', sa.Integer(), nullable=True, server_default=sa.text('30')))

    # 3. Update schedule_slots table
    if 'schedule_slots' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('schedule_slots')]
        if 'reminder_enabled' not in columns:
            op.add_column('schedule_slots', sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        if 'remind_at' not in columns:
            op.add_column('schedule_slots', sa.Column('remind_at', sa.DateTime(), nullable=True))
        if 'remind_before_mins' not in columns:
            op.add_column('schedule_slots', sa.Column('remind_before_mins', sa.Integer(), nullable=True, server_default=sa.text('30')))

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'tasks' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('tasks')]
        if 'remind_before_mins' in columns:
            op.drop_column('tasks', 'remind_before_mins')
        if 'remind_at' in columns:
            op.drop_column('tasks', 'remind_at')
        if 'reminder_enabled' in columns:
            op.drop_column('tasks', 'reminder_enabled')

    if 'habits' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('habits')]
        if 'remind_before_mins' in columns:
            op.drop_column('habits', 'remind_before_mins')
        if 'reminder_enabled' in columns:
            op.drop_column('habits', 'reminder_enabled')

    if 'schedule_slots' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('schedule_slots')]
        if 'remind_before_mins' in columns:
            op.drop_column('schedule_slots', 'remind_before_mins')
        if 'remind_at' in columns:
            op.drop_column('schedule_slots', 'remind_at')
        if 'reminder_enabled' in columns:
            op.drop_column('schedule_slots', 'reminder_enabled')
