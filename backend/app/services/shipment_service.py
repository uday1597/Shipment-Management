
# app/services/shipment_service.py


import time
from app.decorators.log_time import log_execution_time
from app.schemas import shipment


class ShipmentService:

    def __init__(self, repository):
        self.repository = repository

    def get_shipments(
        self,
        limit: int | None = None,
        offset: int = 0,
    ):
        return self.repository.get_all(
            limit=limit,
            offset=offset,
        )

    def get_shipment(self, shipment_id: int):
        shipment = self.repository.get_by_id(shipment_id)
        if shipment is None:
            raise ShipmentNotFoundError("Shipment not found")

        return shipment

    def _execute_write(self, operation):
        try:
            result = operation()
            self.repository.db.commit()
            return result
        except Exception:
            self.repository.db.rollback()
            raise

    
    
    def create_shipment(self, shipment_data: dict):
        def operation():
            cost = self.calculate_shipping_cost(
                shipment_data["weight"],
                shipment_data["distance"],
            )

            new_shipment = {
                **shipment_data,
                "status": "created",
                "cost": cost,
            }

            created = self.repository.create(new_shipment)

            self.repository.add_status_history(
                shipment_id=created["id"],
                old_status=None,
                new_status="created",
                notes="Initial shipment status",
            )

            return created

        return self._execute_write(operation)



    
    def update_shipment(self, shipment_id: int, updates: dict):
        def operation():
            shipment = self.get_shipment(shipment_id)

            if not updates:
                return shipment

            required_fields = {
                "weight",
                "distance",
                "content",
                "destination",
            }

            for field in required_fields:
                if field in updates and updates[field] is None:
                    raise ValueError(
                        f"{field.capitalize()} cannot be null"
                    )

            old_status = shipment["status"]

            updated_data = {
                **shipment,
                **updates,
            }

            if "weight" in updates or "distance" in updates:
                updated_data["cost"] = self.calculate_shipping_cost(
                    updated_data["weight"],
                    updated_data["distance"],
                )

            updated_data["status"] = "updated"

            result = self.repository.update(
                shipment_id,
                updated_data,
            )

            if result is None:
                raise ShipmentNotFoundError("Shipment not found")

            if old_status != result["status"]:
                self.repository.add_status_history(
                    shipment_id=shipment_id,
                    old_status=old_status,
                    new_status=result["status"],
                    notes="Shipment details updated",
                )

            return result

        return self._execute_write(operation)



    
    def replace_shipment(self, shipment_id: int, shipment_data: dict):
        def operation():
            shipment = self.get_shipment(shipment_id)
            old_status = shipment["status"]

            cost = self.calculate_shipping_cost(
                shipment_data["weight"],
                shipment_data["distance"],
            )

            replacement = {
                **shipment_data,
                "status": "updated",
                "cost": cost,
            }

            result = self.repository.update(
                shipment_id,
                replacement,
            )

            if result is None:
                raise ShipmentNotFoundError("Shipment not found")

            if old_status != result["status"]:
                self.repository.add_status_history(
                    shipment_id=shipment_id,
                    old_status=old_status,
                    new_status=result["status"],
                    notes="Shipment replaced",
                )

            return result

        return self._execute_write(operation)



    def delete_shipment(self, shipment_id: int):
        def operation():
            deleted = self.repository.delete(shipment_id)

            if not deleted:
                raise ShipmentNotFoundError("Shipment not found")

            return True

        return self._execute_write(operation)


    @log_execution_time
    def get_shipping_cost(self, shipment_id: int):
        shipment = self.get_shipment(shipment_id)
        time.sleep(3)#dummy delaying to test logging
        return {
            **shipment,
            "cost": self.calculate_shipping_cost(
                shipment["weight"],
                shipment["distance"]
            )
        }

    def calculate_shipping_cost(self, weight: float, distance: float) -> float:
        return round(weight * distance * 0.05, 2)
    
    

class ShipmentNotFoundError(Exception):
    pass