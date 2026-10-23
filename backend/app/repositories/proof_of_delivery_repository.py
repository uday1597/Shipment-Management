from sqlalchemy.orm import Session

from app.models import ProofOfDeliveryPhoto, Shipment


class ProofOfDeliveryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def shipment_exists(self, shipment_id: int) -> bool:
        return self.db.get(Shipment, shipment_id) is not None

    def create(
        self,
        *,
        shipment_id: int,
        image_data: dict,
    ) -> ProofOfDeliveryPhoto:
        photo = ProofOfDeliveryPhoto(
            shipment_id=shipment_id,
            cloudinary_public_id=image_data["cloudinary_public_id"],
            image_url=image_data["image_url"],
            image_format=image_data["image_format"],
            file_size_bytes=image_data["file_size_bytes"],
        )

        self.db.add(photo)
        self.db.flush()

        return photo
