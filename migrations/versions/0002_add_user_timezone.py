"""add_user_timezone

Revision ID: 0002_add_user_timezone
Revises: 0001_initial_timehack_schema
Create Date: 2026-09-01 02:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_add_user_timezone'
down_revision: Union[str, None] = '0001_initial_timehack_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists and if timezone column already exists
    if 'users' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'timezone' not in columns:
            op.add_column(
                'users',
                sa.Column('timezone', sa.String(length=50), server_default='Asia/Ho_Chi_Minh', nullable=True)
            )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'users' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'timezone' in columns:
            op.drop_column('users', 'timezone')
