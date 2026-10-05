from app.repositories.shipment_repository import ShipmentRepository
from app.services.shipment_service import ShipmentService
from fastapi import Depends, Request


def get_shipment_repository(request: Request):
    shared_db = request.app.state.mock_db
    return ShipmentRepository(database_dict=shared_db)


def get_shipment_service(
    repository: ShipmentRepository = Depends(get_shipment_repository)
):
    return ShipmentService(repository)