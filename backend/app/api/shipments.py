from fastapi import APIRouter, Depends, HTTPException, Query, status
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

@router.get("/", response_model=List[ShipmentResponse])
def get_shipments(
    service: ActiveShipmentService,
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    return service.get_shipments(
        limit=limit,
        offset=offset,
    )


# GET /shipments/{id}
@router.get("/{id}", response_model=ShipmentResponse)
def get_shipment(
    id: int,
    service: ActiveShipmentService,
):
    return service.get_shipment(id)


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
@router.patch("/{id}", response_model=ShipmentResponse)
def patch_shipment(
    id: int,
    shipment: ShipmentUpdate,
    service: ActiveShipmentService,
):
    updates = shipment.model_dump(exclude_unset=True)

    try:
        return service.update_shipment(id, updates)
    except ValueError as exc:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

# DELETE /shipments/{id}
@router.delete("/{id}", status_code=204)
def delete_shipment(
    id: int,
    service: ActiveShipmentService,
):
    service.delete_shipment(id)
    return None