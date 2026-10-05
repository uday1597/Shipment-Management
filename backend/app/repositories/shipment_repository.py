class ShipmentRepository:
    def __init__(self, database_dict: dict):
        # The repo now works out of whatever dictionary we pass into it
        self.shipments = database_dict

    def get_all(self):
        return self.shipments

    def get_by_id(self, shipment_id: int):
        for shipment in self.shipments:
            if shipment["id"] == shipment_id:
                return shipment

        return None

    def create(self, shipment_data: dict):
        new_id = max(
            (shipment["id"] for shipment in self.shipments),
            default=0
        ) + 1

        new_shipment = {
            "id": new_id,
            **shipment_data
        }

        self.shipments.append(new_shipment)

        return new_shipment


    def update(self, shipment_id: int, updates: dict):
        shipment = self.get_by_id(shipment_id)

        if shipment is None:
            return None

        self.shipments[shipment_id].update(updates)

        return self.shipments[shipment_id]

    def delete(self, shipment_id: int):
        self.shipments.pop(shipment_id)

        return True