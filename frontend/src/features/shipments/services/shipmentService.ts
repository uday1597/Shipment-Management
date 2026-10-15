import { apiClient } from "@/services/api/apiClient";

import type {
  Shipment,
  ShipmentCreate,
  ShipmentUpdate,
} from "../types/shipment";

const SHIPMENTS_ENDPOINT = "/shipments/";

export async function getShipments(
  signal?: AbortSignal,
): Promise<Shipment[]> {
  const response = await apiClient.get<Shipment[]>(
    SHIPMENTS_ENDPOINT,
    { signal },
  );

  return response.data;
}

export async function getShipment(
  id: number,
  signal?: AbortSignal,
): Promise<Shipment> {
  const response = await apiClient.get<Shipment>(
    `${SHIPMENTS_ENDPOINT}${id}/`,
    { signal },
  );

  return response.data;
}

export async function createShipment(
  body: ShipmentCreate,
): Promise<Shipment> {
  const response = await apiClient.post<Shipment>(
    SHIPMENTS_ENDPOINT,
    body,
  );

  return response.data;
}

export async function updateShipment(
  id: number,
  payload: ShipmentUpdate,
): Promise<Shipment> {
  const response = await apiClient.patch<Shipment>(
    `${SHIPMENTS_ENDPOINT}${id}/`,
    payload,
  );

  return response.data;
}

export async function deleteShipment(
  id: number,
): Promise<void> {
  await apiClient.delete(`${SHIPMENTS_ENDPOINT}${id}/`);
}
