from fastapi import APIRouter, Depends, HTTPException, Query, status,File, UploadFile
from typing import List, Annotated

from app.dependencies import get_shipment_service, get_proof_of_delivery_service
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse
)
from app.schemas.proof_of_delivery import ProofOfDeliveryPhotoResponse

from app.services.shipment_service import (
    ShipmentNotFoundError,
    ShipmentService,
    ShipmentConflictError,
)
from sqlalchemy.orm.exc import StaleDataError

from app.services.cloudinary_service import (
    MAX_IMAGE_SIZE_BYTES,
    CloudinaryStorageError,
    InvalidProofOfDeliveryImageError,
)
from app.services.proof_of_delivery_service import ProofOfDeliveryService

# 1. Define the router with global path configuration
router = APIRouter(
    prefix="/shipments",
    tags=["shipments"]
)

# 2. Reusable Type Alias for your dependency injection.
# This injects a fresh ShipmentService per request without duplicating 'Depends(...)' everywhere.
ActiveShipmentService = Annotated[ShipmentService, Depends(get_shipment_service)]

ActiveProofOfDeliveryService = Annotated[
    ProofOfDeliveryService,
    Depends(get_proof_of_delivery_service),
]

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
    except ShipmentConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except StaleDataError as exc:
        raise HTTPException(
            status_code=409,
            detail="Shipment was modified concurrently. Refresh and try again.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

# DELETE /shipments/{id}
@router.delete("/{id}", status_code=204)
def delete_shipment(
    id: int,
    service: ActiveShipmentService,
):
    service.delete_shipment(id)
    return None

@router.post(
    "/{shipment_id}/proof-of-delivery",
    response_model=ProofOfDeliveryPhotoResponse,
    status_code=201,
)
def upload_proof_of_delivery(
    shipment_id: int,
    service: ActiveProofOfDeliveryService,
    file: UploadFile = File(...),
):
    try:
        # Read at most 1 byte beyond the limit so oversized files
        # can be rejected without loading the entire file into memory.
        content = file.file.read(MAX_IMAGE_SIZE_BYTES + 1)

        return service.create_photo(shipment_id, content)

    except InvalidProofOfDeliveryImageError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except CloudinaryStorageError as exc:
        raise HTTPException(
            status_code=502,
            detail="Image storage is temporarily unavailable.",
        ) from exc

    finally:
        file.file.close()
