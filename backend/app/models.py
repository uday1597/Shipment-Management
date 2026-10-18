
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    content: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    destination: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="created",
    )

    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    distance: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
        onupdate=func.now(),
    )


class ShipmentStatusHistory(Base):
    __tablename__ = "shipment_status_history"

    __table_args__ = (
        Index(
            "idx_shipment_history_shipment_time",
            "shipment_id",
            text("changed_at DESC"),
        ),
        Index(
            "idx_shipment_history_status_time",
            "new_status",
            "changed_at",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )

    shipment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shipments.id", ondelete="CASCADE"),
        nullable=False,
    )

    old_status: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    new_status: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
