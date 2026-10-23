
import { apiClient } from "@/services/api/apiClient";

export interface ProofOfDeliveryPhotoResponse {
  id: number;
  shipment_id: number;
  image_url: string;
  image_format: string;
  file_size_bytes: number;
  created_at: string;
}


export async function uploadProofOfDeliveryPhoto(
    shipmentId: number,
    image: Blob,
    signal?: AbortSignal,
  ): Promise<ProofOfDeliveryPhotoResponse> {
    const formData = new FormData();
  
    formData.append("file", image, "proof-of-delivery");
  
    const response = await apiClient.post<ProofOfDeliveryPhotoResponse>(
      `/shipments/${shipmentId}/proof-of-delivery`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal,
      },
    );
  
    return response.data;
  }
  