
"""add shipment version for optimistic locking

Revision ID: ce7a6bb5634b
Revises: 991e51763c50
"""

from alembic import op
import sqlalchemy as sa


revision = "ce7a6bb5634b"
down_revision = "991e51763c50"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "shipments",
        sa.Column(
            "version",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1"),
        ),
    )


def downgrade() -> None:
    op.drop_column("shipments", "version")
