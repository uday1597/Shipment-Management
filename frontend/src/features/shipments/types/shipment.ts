export type ShipmentStatus = "created" | "updated";

export interface Shipment {
  id: number;
  content: string;
  destination: string;
  status: ShipmentStatus;
  weight: number;
  distance: number;
  cost: number;
}

export interface ShipmentCreate {
  content: string;
  destination: string;
  weight: number;
  distance: number;
}

export interface ShipmentUpdate {
  content?: string;
  destination?: string;
  weight?: number;
  distance?: number;
}
