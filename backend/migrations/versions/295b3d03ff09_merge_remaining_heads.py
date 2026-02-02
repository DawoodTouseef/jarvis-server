"""merge remaining heads

Revision ID: 295b3d03ff09
Revises: 2025_11_01_0001
Create Date: 2026-02-02 14:06:09.821140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import backend.internal.db


# revision identifiers, used by Alembic.
revision: str = '295b3d03ff09'
down_revision: Union[str, None] = '2025_11_01_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
