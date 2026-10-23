
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.shipment_repository import ShipmentRepository
from app.services.shipment_service import ShipmentService
from app.repositories.proof_of_delivery_repository import (
    ProofOfDeliveryRepository,
)
from app.services.proof_of_delivery_service import ProofOfDeliveryService

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
    
def get_proof_of_delivery_repository(
    db: Annotated[Session, Depends(get_db)],
) -> ProofOfDeliveryRepository:
    return ProofOfDeliveryRepository(db)


def get_proof_of_delivery_service(
    repository: Annotated[
        ProofOfDeliveryRepository,
        Depends(get_proof_of_delivery_repository),
    ],
) -> ProofOfDeliveryService:
    return ProofOfDeliveryService(repository)