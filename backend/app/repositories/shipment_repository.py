
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Shipment
from app.models import Shipment, ShipmentStatusHistory

class ShipmentRepository:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _to_dict(shipment: Shipment) -> dict:
        return {
            "id": shipment.id,
            "content": shipment.content,
            "destination": shipment.destination,
            "status": shipment.status,
            "weight": shipment.weight,
            "distance": shipment.distance,
            "cost": shipment.cost,
            "version": shipment.version,
        }
    
    def get_all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict]:
        query = select(Shipment).order_by(Shipment.id)

        if limit is not None:
            query = query.limit(limit)

        query = query.offset(offset)

        shipments = self.db.scalars(query).all()
        return [self._to_dict(item) for item in shipments]

    def get_by_id(self, shipment_id: int) -> dict | None:
        shipment = self.db.get(Shipment, shipment_id)

        if shipment is None:
            return None

        return self._to_dict(shipment)

    
    def create(self, shipment_data: dict) -> dict:
        data = {
            key: value
            for key, value in shipment_data.items()
            if key != "id"
        }

        shipment = Shipment(**data)
        self.db.add(shipment)

        # Send pending SQL to the database without committing.
        self.db.flush()

        return self._to_dict(shipment)


    def update(self, shipment_id: int, updates: dict) -> dict | None:
        shipment = self.db.get(Shipment, shipment_id)

        if shipment is None:
            return None

        allowed_fields = {
            "content",
            "destination",
            "status",
            "weight",
            "distance",
            "cost",
        }

        for field in allowed_fields:
            if field in updates:
                setattr(shipment, field, updates[field])

        self.db.flush()

        return self._to_dict(shipment)


    def delete(self, shipment_id: int) -> bool:
        shipment = self.db.get(Shipment, shipment_id)

        if shipment is None:
            return False

        self.db.delete(shipment)
        self.db.flush()

        return True


    def add_status_history(
        self,
        shipment_id: int,
        old_status: str | None,
        new_status: str,
        notes: str | None = None,
    ) -> None:
        history = ShipmentStatusHistory(
            shipment_id=shipment_id,
            old_status=old_status,
            new_status=new_status,
            notes=notes,
        )

        self.db.add(history)
        self.db.flush()
