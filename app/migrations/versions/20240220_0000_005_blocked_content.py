"""Add blocked_content table for Agent 4 (Policy Guardian)

Revision ID: 005
Revises: 004
Create Date: 2024-02-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create blocked_content table
    op.create_table(
        'blocked_content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('content_preview', sa.Text(), nullable=True),
        sa.Column('source_platform', sa.String(50), nullable=True),
        sa.Column('source_username', sa.String(200), nullable=True),
        sa.Column('policy_id', sa.Integer(), nullable=False),
        sa.Column('policy_name', sa.String(200), nullable=False),
        sa.Column('rule_name', sa.String(100), nullable=True),
        sa.Column('dsl_logic', sa.Text(), nullable=True),
        sa.Column('matched_conditions', sa.Text(), nullable=True),
        sa.Column('action_taken', sa.String(50), nullable=False),
        sa.Column('ai_score', sa.Float(), nullable=True),
        sa.Column('graph_cluster_size', sa.Integer(), nullable=True),
        sa.Column('narrative_keywords', sa.Text(), nullable=True),
        sa.Column('blocked_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['policy_id'], ['ai_policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for blocked_content
    op.create_index('ix_blocked_content_id', 'blocked_content', ['id'])
    op.create_index('ix_blocked_content_content_hash', 'blocked_content', ['content_hash'])
    op.create_index('ix_blocked_content_policy_id', 'blocked_content', ['policy_id'])
    op.create_index('ix_blocked_content_blocked_at', 'blocked_content', ['blocked_at'])


def downgrade() -> None:
    # Drop blocked_content table
    op.drop_index('ix_blocked_content_blocked_at', 'blocked_content')
    op.drop_index('ix_blocked_content_policy_id', 'blocked_content')
    op.drop_index('ix_blocked_content_content_hash', 'blocked_content')
    op.drop_index('ix_blocked_content_id', 'blocked_content')
    op.drop_table('blocked_content')

