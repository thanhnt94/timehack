"""add_habit_mood_and_completed_time

Revision ID: 0003_add_habit_mood_and_completed_time
Revises: 0002_add_user_timezone
Create Date: 2026-09-01 04:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_add_habit_mood_and_completed_time'
down_revision: Union[str, None] = '0002_add_user_timezone'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'habit_logs' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('habit_logs')]
        if 'mood' not in columns:
            op.add_column(
                'habit_logs',
                sa.Column('mood', sa.String(length=50), nullable=True)
            )
        if 'completed_time' not in columns:
            op.add_column(
                'habit_logs',
                sa.Column('completed_time', sa.String(length=10), nullable=True)
            )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'habit_logs' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('habit_logs')]
        if 'mood' in columns:
            op.drop_column('habit_logs', 'mood')
        if 'completed_time' in columns:
            op.drop_column('habit_logs', 'completed_time')
