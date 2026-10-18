
"""Add shipment timestamps and status history.

Revision ID: 991e51763c50
Revises: 2275eaa00805
"""

from alembic import op
import sqlalchemy as sa

revision = "991e51763c50"
down_revision = "2275eaa00805"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # Add timestamps only if missing.
    if "shipments" in tables:
        columns = {
            column["name"]
            for column in inspector.get_columns("shipments")
        }

        if "created_at" not in columns:
            op.add_column(
                "shipments",
                sa.Column(
                    "created_at",
                    sa.DateTime(timezone=True),
                    nullable=True,
                    server_default=sa.func.now(),
                ),
            )

        if "updated_at" not in columns:
            op.add_column(
                "shipments",
                sa.Column(
                    "updated_at",
                    sa.DateTime(timezone=True),
                    nullable=True,
                    server_default=sa.func.now(),
                ),
            )

    # Create the history table if missing.
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "shipment_status_history" not in tables:
        op.create_table(
            "shipment_status_history",
            sa.Column(
                "id",
                sa.BigInteger(),
                sa.Identity(),
                primary_key=True,
                nullable=False,
            ),
            sa.Column("shipment_id", sa.Integer(), nullable=False),
            sa.Column("old_status", sa.String(length=100), nullable=True),
            sa.Column("new_status", sa.String(length=100), nullable=False),
            sa.Column(
                "changed_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(
                ["shipment_id"],
                ["shipments.id"],
                ondelete="CASCADE",
            ),
        )

    # Ensure an existing history table generates IDs automatically.
    inspector = sa.inspect(bind)
    history_columns = {
        column["name"]: column
        for column in inspector.get_columns("shipment_status_history")
    }
    id_column = history_columns["id"]

    if id_column.get("default") is None and not id_column.get("identity"):
        op.execute(
            "CREATE SEQUENCE IF NOT EXISTS shipment_status_history_id_seq"
        )
        op.execute(
            """
            SELECT setval(
                'shipment_status_history_id_seq',
                COALESCE(
                    (SELECT MAX(id) FROM shipment_status_history),
                    0
                ) + 1,
                false
            )
            """
        )
        op.execute(
            """
            ALTER SEQUENCE shipment_status_history_id_seq
            OWNED BY shipment_status_history.id
            """
        )
        op.execute(
            """
            ALTER TABLE shipment_status_history
            ALTER COLUMN id
            SET DEFAULT nextval('shipment_status_history_id_seq')
            """
        )

    # Create history indexes only if missing.
    inspector = sa.inspect(bind)
    indexes = {
        index["name"]
        for index in inspector.get_indexes("shipment_status_history")
    }

    if "idx_shipment_history_shipment_time" not in indexes:
        op.create_index(
            "idx_shipment_history_shipment_time",
            "shipment_status_history",
            ["shipment_id", sa.text("changed_at DESC")],
            unique=False,
        )

    if "idx_shipment_history_status_time" not in indexes:
        op.create_index(
            "idx_shipment_history_status_time",
            "shipment_status_history",
            ["new_status", "changed_at"],
            unique=False,
        )


def downgrade() -> None:
    # Preserve existing schema and data on downgrade.
    pass
