"""add source_filename to jobs

Revision ID: 9d8f4fe3d3ac
Revises: 14337dfdb30d
Create Date: 2026-03-02 11:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9d8f4fe3d3ac"
down_revision: Union[str, Sequence[str], None] = "14337dfdb30d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("source_filename", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "source_filename")
