
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.shipment_repository import ShipmentRepository
from app.services.shipment_service import ShipmentService


def get_shipment_repository(
    db: Annotated[Session, Depends(get_db)],
) -> ShipmentRepository:
    return ShipmentRepository(db)


def get_shipment_service(
    repository: Annotated[
        ShipmentRepository,
        Depends(get_shipment_repository),
    ],
) -> ShipmentService:
    return ShipmentService(repository)
