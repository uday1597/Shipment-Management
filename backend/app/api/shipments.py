from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated

from app.dependencies import get_shipment_service
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)
from app.services.shipment_service import ShipmentNotFoundError, ShipmentService

# 1. Define the router with global path configuration
router = APIRouter(
    prefix="/shipments",
    tags=["shipments"]
)

# 2. Reusable Type Alias for your dependency injection.
# This injects a fresh ShipmentService per request without duplicating 'Depends(...)' everywhere.
ActiveShipmentService = Annotated[ShipmentService, Depends(get_shipment_service)]


# GET /shipments
@router.get(
    "/",
    response_model=List[ShipmentResponse]
)
def get_shipments(service: ActiveShipmentService):
    return service.get_shipments()


# GET /shipments/{id}
@router.get(
    "/{id}",
    response_model=ShipmentResponse
)
def get_shipment(id: int, service: ActiveShipmentService):
    try:
        return service.get_shipment(id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )


# POST /shipments
@router.post(
    "/",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_shipment(shipment: ShipmentCreate, service: ActiveShipmentService):
    shipment_data = shipment.model_dump()
    return service.create_shipment(shipment_data)


# PATCH /shipments/{id}
@router.patch(
    "/{id}",
    response_model=ShipmentResponse
)
def patch_shipment(id: int, shipment: ShipmentUpdate, service: ActiveShipmentService):
    updates = shipment.model_dump(exclude_unset=True)
    try:
        return service.update_shipment(id, updates)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc)
        )

# DELETE /shipments/{id}
@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_shipment(id: int, service: ActiveShipmentService):
    try:
        service.delete_shipment(id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
    return None