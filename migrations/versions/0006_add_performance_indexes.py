"""add_performance_indexes

Revision ID: 0006_add_performance_indexes
Revises: 0005_add_habit_dual_or_goals
Create Date: 2026-09-01 15:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0006_add_performance_indexes'
down_revision: Union[str, None] = '0005_add_habit_dual_or_goals'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Habit Logs Table Indexes
    if 'habit_logs' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('habit_logs')]
        if 'ix_habit_logs_logged_date' not in existing_indices:
            try:
                op.create_index('ix_habit_logs_logged_date', 'habit_logs', ['logged_date'], unique=False)
            except Exception:
                pass
        if 'ix_habit_logs_user_logged_date' not in existing_indices:
            try:
                op.create_index('ix_habit_logs_user_logged_date', 'habit_logs', ['user_id', 'logged_date'], unique=False)
            except Exception:
                pass

    # 2. Time Logs Table Indexes
    if 'time_logs' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('time_logs')]
        if 'ix_time_logs_start_time' not in existing_indices:
            try:
                op.create_index('ix_time_logs_start_time', 'time_logs', ['start_time'], unique=False)
            except Exception:
                pass
        if 'ix_time_logs_user_start_time' not in existing_indices:
            try:
                op.create_index('ix_time_logs_user_start_time', 'time_logs', ['user_id', 'start_time'], unique=False)
            except Exception:
                pass

    # 3. Tasks Table Indexes
    if 'tasks' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('tasks')]
        if 'ix_tasks_user_status' not in existing_indices:
            try:
                op.create_index('ix_tasks_user_status', 'tasks', ['user_id', 'status'], unique=False)
            except Exception:
                pass

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'habit_logs' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('habit_logs')]
        if 'ix_habit_logs_logged_date' in existing_indices:
            op.drop_index('ix_habit_logs_logged_date', table_name='habit_logs')
        if 'ix_habit_logs_user_logged_date' in existing_indices:
            op.drop_index('ix_habit_logs_user_logged_date', table_name='habit_logs')

    if 'time_logs' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('time_logs')]
        if 'ix_time_logs_start_time' in existing_indices:
            op.drop_index('ix_time_logs_start_time', table_name='time_logs')
        if 'ix_time_logs_user_start_time' in existing_indices:
            op.drop_index('ix_time_logs_user_start_time', table_name='time_logs')

    if 'tasks' in inspector.get_table_names():
        existing_indices = [idx['name'] for idx in inspector.get_indexes('tasks')]
        if 'ix_tasks_user_status' in existing_indices:
            op.drop_index('ix_tasks_user_status', table_name='tasks')
