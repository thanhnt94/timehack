"""add_active_tracks_table

Revision ID: 0008_add_active_tracks_table
Revises: 0007_add_category_parent_and_type
Create Date: 2026-09-01 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0008_add_active_tracks_table'
down_revision: Union[str, None] = '0007_add_category_parent_and_type'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'active_tracks' not in inspector.get_table_names():
        op.create_table(
            'active_tracks',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('task_id', sa.Integer(), sa.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True),
            sa.Column('habit_id', sa.Integer(), sa.ForeignKey('habits.id', ondelete='SET NULL'), nullable=True),
            sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False, server_default='Hoạt động thực tế'),
            sa.Column('start_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('timer_type', sa.String(length=20), nullable=False, server_default='stopwatch'),
            sa.Column('is_paused', sa.Boolean(), nullable=False, server_default=sa.text('false')),
            sa.Column('accumulated_seconds', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_resumed_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
        )
        op.create_index('ix_active_tracks_user_id', 'active_tracks', ['user_id'], unique=False)

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'active_tracks' in inspector.get_table_names():
        op.drop_index('ix_active_tracks_user_id', table_name='active_tracks')
        op.drop_table('active_tracks')
