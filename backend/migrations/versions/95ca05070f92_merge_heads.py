"""merge heads

Revision ID: 95ca05070f92
Revises: 2025_11_01_0001, 21f744080608, eccf02c21de2
Create Date: 2025-11-02 13:00:08.832697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import backend.internal.db


# revision identifiers, used by Alembic.
revision: str = '95ca05070f92'
down_revision: Union[str, None] = ('2025_11_01_0001', '21f744080608', 'eccf02c21de2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
