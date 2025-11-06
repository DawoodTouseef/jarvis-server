"""merge constraint updates

Revision ID: 745007046e7b
Revises: 2025_11_02_0001
Create Date: 2025-11-02 13:59:54.222201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import backend.internal.db


# revision identifiers, used by Alembic.
revision: str = '745007046e7b'
down_revision: Union[str, None] = '2025_11_02_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass