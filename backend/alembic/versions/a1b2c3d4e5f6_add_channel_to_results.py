"""add channel to results

Revision ID: a1b2c3d4e5f6
Revises: 9d8f4fe3d3ac
Create Date: 2026-03-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9d8f4fe3d3ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS channel TEXT")


def downgrade() -> None:
    op.drop_column('results', 'channel')
