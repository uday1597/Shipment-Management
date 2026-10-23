import logging

from app.repositories.proof_of_delivery_repository import (
    ProofOfDeliveryRepository,
)
from app.services.cloudinary_service import (
    CloudinaryStorageError,
    delete_image,
    upload_image,
)
from app.services.shipment_service import ShipmentNotFoundError

logger = logging.getLogger(__name__)


class ProofOfDeliveryService:
    def __init__(self, repository: ProofOfDeliveryRepository) -> None:
        self.repository = repository

    def create_photo(self, shipment_id: int, content: bytes) -> dict:
        if not self.repository.shipment_exists(shipment_id):
            raise ShipmentNotFoundError(
                f"Shipment {shipment_id} not found"
            )

        image_data = upload_image(shipment_id, content)

        try:
            photo = self.repository.create(
                shipment_id=shipment_id,
                image_data=image_data,
            )

            self.repository.db.commit()

            return {
                "id": photo.id,
                "shipment_id": photo.shipment_id,
                "image_url": photo.image_url,
                "image_format": photo.image_format,
                "file_size_bytes": photo.file_size_bytes,
                "created_at": photo.created_at,
            }

        except Exception:
            self.repository.db.rollback()

            try:
                delete_image(image_data["cloudinary_public_id"])
            except CloudinaryStorageError:
                logger.exception(
                    "Failed to clean up Cloudinary image after "
                    "database persistence failed for shipment %s",
                    shipment_id,
                )

            raise
