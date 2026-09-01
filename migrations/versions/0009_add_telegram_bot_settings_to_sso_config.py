"""add_telegram_bot_settings_to_sso_config

Revision ID: 0009_add_telegram_bot_settings_to_sso_config
Revises: 0008_add_active_tracks_table
Create Date: 2026-09-01 22:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0009_add_telegram_bot_settings_to_sso_config'
down_revision: Union[str, None] = '0008_add_active_tracks_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'sso_settings' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('sso_settings')]
        if 'telegram_bot_token' not in columns:
            op.add_column('sso_settings', sa.Column('telegram_bot_token', sa.String(length=255), nullable=True))
        if 'telegram_bot_username' not in columns:
            op.add_column('sso_settings', sa.Column('telegram_bot_username', sa.String(length=100), nullable=True))
        if 'telegram_bot_enabled' not in columns:
            op.add_column('sso_settings', sa.Column('telegram_bot_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')))

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'sso_settings' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('sso_settings')]
        if 'telegram_bot_enabled' in columns:
            op.drop_column('sso_settings', 'telegram_bot_enabled')
        if 'telegram_bot_username' in columns:
            op.drop_column('sso_settings', 'telegram_bot_username')
        if 'telegram_bot_token' in columns:
            op.drop_column('sso_settings', 'telegram_bot_token')
