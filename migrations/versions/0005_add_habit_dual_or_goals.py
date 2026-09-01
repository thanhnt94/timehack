"""add_habit_dual_or_goals

Revision ID: 0005_add_habit_dual_or_goals
Revises: 0004_add_habit_routines_streak_freeze_and_strength
Create Date: 2026-09-01 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005_add_habit_dual_or_goals'
down_revision: Union[str, None] = '0004_add_habit_routines_streak_freeze_and_strength'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Habits Table - add target_count_secondary and unit_secondary for Either/OR Goals
    if 'habits' in inspector.get_table_names():
        h_cols = [c['name'] for c in inspector.get_columns('habits')]
        if 'target_count_secondary' not in h_cols:
            op.add_column(
                'habits',
                sa.Column('target_count_secondary', sa.Integer(), nullable=True)
            )
        if 'unit_secondary' not in h_cols:
            op.add_column(
                'habits',
                sa.Column('unit_secondary', sa.String(length=50), nullable=True)
            )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'habits' in inspector.get_table_names():
        h_cols = [c['name'] for c in inspector.get_columns('habits')]
        if 'target_count_secondary' in h_cols:
            op.drop_column('habits', 'target_count_secondary')
        if 'unit_secondary' in h_cols:
            op.drop_column('habits', 'unit_secondary')
