"""add_habit_routines_streak_freeze_and_strength

Revision ID: 0004_add_habit_routines_streak_freeze_and_strength
Revises: 0003_add_habit_mood_and_completed_time
Create Date: 2026-09-01 04:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_add_habit_routines_streak_freeze_and_strength'
down_revision: Union[str, None] = '0003_add_habit_mood_and_completed_time'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Habits Table
    if 'habits' in inspector.get_table_names():
        h_cols = [c['name'] for c in inspector.get_columns('habits')]
        if 'time_of_day' not in h_cols:
            op.add_column(
                'habits',
                sa.Column('time_of_day', sa.String(length=20), server_default='anytime', nullable=True)
            )
        if 'streak_freeze_count' not in h_cols:
            op.add_column(
                'habits',
                sa.Column('streak_freeze_count', sa.Integer(), server_default='2', nullable=True)
            )

    # 2. HabitLogs Table
    if 'habit_logs' in inspector.get_table_names():
        hl_cols = [c['name'] for c in inspector.get_columns('habit_logs')]
        if 'is_frozen_day' not in hl_cols:
            op.add_column(
                'habit_logs',
                sa.Column('is_frozen_day', sa.Boolean(), server_default=sa.text('false'), nullable=True)
            )
        if 'time_spent' not in hl_cols:
            op.add_column(
                'habit_logs',
                sa.Column('time_spent', sa.Integer(), server_default='0', nullable=True)
            )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'habits' in inspector.get_table_names():
        h_cols = [c['name'] for c in inspector.get_columns('habits')]
        if 'time_of_day' in h_cols:
            op.drop_column('habits', 'time_of_day')
        if 'streak_freeze_count' in h_cols:
            op.drop_column('habits', 'streak_freeze_count')

    if 'habit_logs' in inspector.get_table_names():
        hl_cols = [c['name'] for c in inspector.get_columns('habit_logs')]
        if 'is_frozen_day' in hl_cols:
            op.drop_column('habit_logs', 'is_frozen_day')
        if 'time_spent' in hl_cols:
            op.drop_column('habit_logs', 'time_spent')
