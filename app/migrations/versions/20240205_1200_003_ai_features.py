"""Add AI policies and insights tables

Revision ID: 003
Revises: 002
Create Date: 2024-02-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ai_policies table
    op.create_table(
        'ai_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('policy_type', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('translated_dsl', sa.Text(), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for ai_policies
    op.create_index('ix_ai_policies_id', 'ai_policies', ['id'])
    op.create_index('ix_ai_policies_name', 'ai_policies', ['name'])
    op.create_index('ix_ai_policies_policy_type', 'ai_policies', ['policy_type'])
    op.create_index('ix_ai_policies_category', 'ai_policies', ['category'])
    op.create_index('ix_ai_policies_priority', 'ai_policies', ['priority'])
    op.create_index('ix_ai_policies_is_active', 'ai_policies', ['is_active'])
    
    # Create ai_insights table
    op.create_table(
        'ai_insights',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('suggested_actions', sa.Text(), nullable=False),  # JSON array
        sa.Column('impact_estimate', sa.String(200), nullable=True),
        sa.Column('data_source', sa.String(100), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('viewed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('dismissed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('dismissed_by', sa.Integer(), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['dismissed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for ai_insights
    op.create_index('ix_ai_insights_id', 'ai_insights', ['id'])
    op.create_index('ix_ai_insights_severity', 'ai_insights', ['severity'])
    op.create_index('ix_ai_insights_category', 'ai_insights', ['category'])
    op.create_index('ix_ai_insights_viewed', 'ai_insights', ['viewed'])
    op.create_index('ix_ai_insights_dismissed', 'ai_insights', ['dismissed'])
    op.create_index('ix_ai_insights_created_at', 'ai_insights', ['created_at'])


def downgrade() -> None:
    # Drop ai_insights table
    op.drop_index('ix_ai_insights_created_at', 'ai_insights')
    op.drop_index('ix_ai_insights_dismissed', 'ai_insights')
    op.drop_index('ix_ai_insights_viewed', 'ai_insights')
    op.drop_index('ix_ai_insights_category', 'ai_insights')
    op.drop_index('ix_ai_insights_severity', 'ai_insights')
    op.drop_index('ix_ai_insights_id', 'ai_insights')
    op.drop_table('ai_insights')
    
    # Drop ai_policies table
    op.drop_index('ix_ai_policies_is_active', 'ai_policies')
    op.drop_index('ix_ai_policies_priority', 'ai_policies')
    op.drop_index('ix_ai_policies_category', 'ai_policies')
    op.drop_index('ix_ai_policies_policy_type', 'ai_policies')
    op.drop_index('ix_ai_policies_name', 'ai_policies')
    op.drop_index('ix_ai_policies_id', 'ai_policies')
    op.drop_table('ai_policies')

