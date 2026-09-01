"""add_category_parent_and_type

Revision ID: 0007_add_category_parent_and_type
Revises: 0006_add_performance_indexes
Create Date: 2026-09-01 16:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0007_add_category_parent_and_type'
down_revision: Union[str, None] = '0006_add_performance_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'categories' in inspector.get_table_names():
        c_cols = [c['name'] for c in inspector.get_columns('categories')]
        
        with op.batch_alter_table('categories', schema=None) as batch_op:
            if 'parent_id' not in c_cols:
                batch_op.add_column(sa.Column('parent_id', sa.Integer(), nullable=True))
                batch_op.create_foreign_key('fk_categories_parent_id', 'categories', ['parent_id'], ['id'], ondelete='CASCADE')
                batch_op.create_index('ix_categories_parent_id', ['parent_id'], unique=False)

            if 'category_type' not in c_cols:
                batch_op.add_column(sa.Column('category_type', sa.String(length=30), server_default='productive', nullable=True))

            existing_indices = [idx['name'] for idx in inspector.get_indexes('categories')]
            if 'ix_categories_user_parent' not in existing_indices:
                batch_op.create_index('ix_categories_user_parent', ['user_id', 'parent_id'], unique=False)

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'categories' in inspector.get_table_names():
        c_cols = [c['name'] for c in inspector.get_columns('categories')]
        existing_indices = [idx['name'] for idx in inspector.get_indexes('categories')]
        
        with op.batch_alter_table('categories', schema=None) as batch_op:
            if 'ix_categories_user_parent' in existing_indices:
                batch_op.drop_index('ix_categories_user_parent')
            if 'ix_categories_parent_id' in existing_indices:
                batch_op.drop_index('ix_categories_parent_id')
            if 'category_type' in c_cols:
                batch_op.drop_column('category_type')
            if 'parent_id' in c_cols:
                batch_op.drop_column('parent_id')
