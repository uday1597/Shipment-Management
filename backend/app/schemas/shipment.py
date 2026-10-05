
from pydantic import BaseModel, Field


class ShipmentCreate(BaseModel):
    content: str = Field(
        ...,
        description="The content of the shipment",
        min_length=5,
        max_length=100
    )
    destination: str = Field(
        ...,
        description="The destination of the shipment",
        min_length=2,
        max_length=100
    )
    weight: float = Field(
        ...,
        description="The weight of the shipment",
        gt=0,
        le=1000
    )
    distance: float = Field(
        ...,
        description="The distance of the shipment",
        gt=0
    )


class ShipmentUpdate(BaseModel):
    content: str | None = Field(
        default=None,
        min_length=5,
        max_length=100
    )
    destination: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    weight: float | None = Field(
        default=None,
        gt=0,
        le=1000
    )
    distance: float | None = Field(
        default=None,
        gt=0
    )


class ShipmentResponse(BaseModel):
    id: int
    content: str
    destination: str
    status: str
    weight: float
    distance: float
    cost: float