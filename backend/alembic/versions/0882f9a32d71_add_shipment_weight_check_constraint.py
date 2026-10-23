"""add shipment weight check constraint

Revision ID: 0882f9a32d71
Revises: 1dd6f4b0fcb8
Create Date: 2026-10-22 17:31:20.386462

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0882f9a32d71'
down_revision: Union[str, Sequence[str], None] = '1dd6f4b0fcb8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_shipments_weight_range",
        "shipments",
        "weight > 0 AND weight <= 1000",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_shipments_weight_range",
        "shipments",
        type_="check",
    )
