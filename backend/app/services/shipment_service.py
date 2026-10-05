
# app/services/shipment_service.py


import time
from app.decorators.log_time import log_execution_time
from app.schemas import shipment


class ShipmentService:

    def __init__(self, repository):
        self.repository = repository

    def get_shipments(self):
        return self.repository.get_all()

    def get_shipment(self, shipment_id: int):
        shipment = self.repository.get_by_id(shipment_id)
        if shipment is None:
            raise ShipmentNotFoundError("Shipment not found")

        return shipment

    def create_shipment(self, shipment_data: dict):
        cost = self.calculate_shipping_cost(
            shipment_data["weight"],
            shipment_data["distance"]
        )

        new_shipment = {
            **shipment_data,
            "status": "created",
            "cost": cost
        }
        return self.repository.create(new_shipment)

    def update_shipment(self, shipment_id: int, updates: dict):
        shipment = self.get_shipment(shipment_id)

        if not updates:
            return shipment

        if "weight" in updates and updates["weight"] is None:
            raise ValueError("Weight cannot be null")

        if "distance" in updates and updates["distance"] is None:
            raise ValueError("Distance cannot be null")

        if "content" in updates and updates["content"] is None:
            raise ValueError("Content cannot be null")

        if "destination" in updates and updates["destination"] is None:
            raise ValueError("Destination cannot be null")

        updated_data = {
            **shipment,
            **updates
        }

        if "weight" in updates or "distance" in updates:
            updated_data["cost"] = self.calculate_shipping_cost(
                updated_data["weight"],
                updated_data["distance"]
            )

        updated_data["status"] = "updated"
        return self.repository.update(shipment_id, updated_data)

    def replace_shipment(self, shipment_id: int, shipment_data: dict):
        shipment=self.get_shipment(shipment_id)
        print(shipment)
        cost = self.calculate_shipping_cost(
            shipment_data["weight"],
            shipment_data["distance"]
        )

        replacement = {
            **shipment_data,
            "status": "updated",
            "cost": cost
        }
        return self.repository.update(shipment_id, replacement)
    
    def delete_shipment(self,shipment_id: int):
        shipment = self.repository.delete(shipment_id)

        if shipment is None:
            raise ShipmentNotFoundError("Shipment not found")

        return shipment

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