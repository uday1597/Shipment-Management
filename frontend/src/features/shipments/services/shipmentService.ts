import { apiClient } from "@/services/api/apiClient";
import type { Shipment, ShipmentCreate } from "../types/shipment";

export async function getShipments(): Promise<Shipment[]> {
  const response = await apiClient.get<Shipment[]>("/shipments/");

  return response.data;
}

export async function getShipment(id: number): Promise<Shipment> {
  const response = await apiClient.get<Shipment>(
    `/shipments/${id}`
  );

  return response.data;
}

export async function createShipment(body:ShipmentCreate): Promise<Shipment> {
    const response = await apiClient.post<Shipment>("/shipments/",body);
  
    return response.data;
}

export async function updateShipment(
  id: number,
  payload: ShipmentCreate,
): Promise<Shipment> {
  const response = await apiClient.patch(
    `/shipments/${id}`,
    payload,
  );

  return response.data;
}

export async function deleteShipment(id: number): Promise<Boolean> {
  const response = await apiClient.delete(`/shipments/${id}`);
  return response.data;
}