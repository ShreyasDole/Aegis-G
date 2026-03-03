"""Add thought_process column to ledger_entries

Revision ID: 004
Revises: 003
Create Date: 2024-02-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add thought_process column to ledger_entries table
    op.add_column(
        'ledger_entries',
        sa.Column('thought_process', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    # Remove thought_process column from ledger_entries table
    op.drop_column('ledger_entries', 'thought_process')

