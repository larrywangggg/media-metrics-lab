"""add server defaults to jobs timestamps

Revision ID: 316cdaedc63c
Revises: 61706cec9f1b
Create Date: 2026-02-09 23:39:59.238430


Originally intended to add server defaults; actual defaults set in 14337dfdb30d.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '316cdaedc63c'
down_revision: Union[str, Sequence[str], None] = '61706cec9f1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    


def downgrade() -> None:
    """Downgrade schema."""
    pass
