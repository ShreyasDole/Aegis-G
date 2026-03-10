"""Initial schema - threats, reports, ledger, users

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(50), nullable=False, server_default='analyst'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Threats table
    op.create_table(
        'threats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('source_platform', sa.String(50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('detected_by', sa.String(50), server_default='gemini-2.5-flash'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_threats_id', 'threats', ['id'])
    op.create_index('ix_threats_content_hash', 'threats', ['content_hash'], unique=True)
    op.create_index('ix_threats_timestamp', 'threats', ['timestamp'])

    # Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('threat_id', sa.Integer(), nullable=True),
        sa.Column('analyst_notes', sa.Text(), nullable=True),
        sa.Column('gemini_summary', sa.Text(), nullable=True),
        sa.Column('shared_ledger_hash', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['threat_id'], ['threats.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_reports_id', 'reports', ['id'])
    op.create_index('ix_reports_shared_ledger_hash', 'reports', ['shared_ledger_hash'])

    # Ledger entries table (blockchain audit trail)
    op.create_table(
        'ledger_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('previous_hash', sa.String(64), nullable=True),
        sa.Column('current_hash', sa.String(64), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('recipient_agency', sa.String(100), nullable=True),
        sa.Column('redacted_content', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('verified', sa.String(10), server_default='pending'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ledger_entries_id', 'ledger_entries', ['id'])
    op.create_index('ix_ledger_entries_current_hash', 'ledger_entries', ['current_hash'], unique=True)
    op.create_index('ix_ledger_entries_timestamp', 'ledger_entries', ['timestamp'])


def downgrade() -> None:
    op.drop_table('ledger_entries')
    op.drop_table('reports')
    op.drop_table('threats')
    op.drop_table('users')

