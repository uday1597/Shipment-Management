from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProofOfDeliveryPhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    image_url: str
    image_format: str
    file_size_bytes: int
    created_at: datetime
