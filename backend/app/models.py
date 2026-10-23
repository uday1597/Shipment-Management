
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
    text,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = (
        CheckConstraint(
            "weight > 0 AND weight <= 1000",
            name="ck_shipments_weight_range",
        ),
    )
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

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    __mapper_args__ = {
        "version_id_col": version,
    }


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


class ProofOfDeliveryPhoto(Base):
    __tablename__ = "proof_of_delivery_photos"

    __table_args__ = (
        Index(
            "idx_pod_photos_shipment_created",
            "shipment_id",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    shipment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shipments.id", ondelete="CASCADE"),
        nullable=False,
    )

    cloudinary_public_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    image_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    image_format: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
