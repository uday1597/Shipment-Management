
import { apiClient } from "@/services/api/apiClient";

export interface AnalyticsOverview {
  total_shipments: number;
  total_cost: number;
  average_cost: number;
  average_weight: number;
  total_distance: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface DestinationBreakdown {
  destination: string;
  shipment_count: number;
  total_cost: number;
}

export interface ShipmentCostItem {
  id: number;
  destination: string;
  status: string;
  cost: number;
  weight: number;
  distance: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await apiClient.get<AnalyticsOverview>(
    "/analytics/overview"
  );
  return response.data;
}

export async function getStatusBreakdown(): Promise<StatusBreakdown[]> {
  const response = await apiClient.get<StatusBreakdown[]>(
    "/analytics/status-breakdown"
  );
  return response.data;
}

export async function getDestinationBreakdown(): Promise<
  DestinationBreakdown[]
> {
  const response = await apiClient.get<DestinationBreakdown[]>(
    "/analytics/destinations"
  );
  return response.data;
}

export async function getShipmentCosts(): Promise<ShipmentCostItem[]> {
  const response = await apiClient.get<ShipmentCostItem[]>(
    "/analytics/costs"
  );
  return response.data;
}
export interface ShipmentStatusHistoryItem {
  id: number;
  shipment_id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  notes: string | null;
}

export const getShipmentStatusHistory = async (
  limit = 100
): Promise<ShipmentStatusHistoryItem[]> => {
  const response = await apiClient.get(
    `/analytics/status-history?limit=${limit}`
  );

  return response.data;
};

export interface ShipmentActivity {
  date: string;
  shipment_count: number;
}

export const getShipmentsOverTime = async (
  days = 30
): Promise<ShipmentActivity[]> => {
  const response = await apiClient.get(
    `/analytics/shipments-over-time?days=${days}`
  );

  return response.data;
};