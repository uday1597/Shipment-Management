
import { useState } from "react";
import { Camera, CameraDirection } from "@capacitor/camera";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { uploadProofOfDeliveryPhoto } from "@/features/shipments/services/proofOfDeliveryService";

interface ProofOfDeliveryPhotoProps {
  shipmentId: number;
}

export default function ProofOfDeliveryPhoto({
  shipmentId,
}: ProofOfDeliveryPhotoProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!photo) {
        throw new Error("Please take or select a photo first.");
      }

      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 20_000);

      try {
        const imageResponse = await fetch(photo, {
          signal: controller.signal,
        });

        if (!imageResponse.ok) {
          throw new Error("Could not read the selected photo.");
        }

        const imageBlob = await imageResponse.blob();

        return await uploadProofOfDeliveryPhoto(
          shipmentId,
          imageBlob,
          controller.signal,
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          throw new Error(
            "Upload timed out. Check your internet connection and try again.",
          );
        }

        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    retry: 0,
    onSuccess: (uploadedPhoto) => {
      setSuccess("Proof of delivery uploaded successfully.");
      setError(null);
      setPhoto(null);

      console.info("Proof of delivery saved:", uploadedPhoto);
    },
    onError: (uploadError: unknown) => {
      if (axios.isAxiosError(uploadError)) {
        const detail: unknown = uploadError.response?.data?.detail;

        if (typeof detail === "string" && detail.trim()) {
          setError(detail);
          return;
        }

        if (!uploadError.response) {
          setError(
            "Unable to reach the server. Check your connection and try again.",
          );
          return;
        }

        if (uploadError.response.status >= 500) {
          setError("Upload failed because of a server error. Please try again.");
          return;
        }
      }

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the photo. Please try again.",
      );
    },
  });

  async function takePhoto() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await Camera.takePhoto({
        quality: 80,
        cameraDirection: CameraDirection.Rear,
      });

      if (!result.webPath) {
        setError("The photo could not be displayed. Please try again.");
        return;
      }

      setPhoto(result.webPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (/cancel|dismiss|abort/i.test(message)) {
        return;
      }

      setError("Could not take the photo. Check camera access and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseFromGallery() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { results } = await Camera.chooseFromGallery({
        quality: 80,
        limit: 1,
      });

      const selectedPhoto = results[0];

      if (!selectedPhoto?.webPath) {
        return;
      }

      setPhoto(selectedPhoto.webPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (/cancel|dismiss|abort/i.test(message)) {
        return;
      }

      setError("Could not select the photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setError(null);
    setSuccess(null);
  }

  const busy = loading || uploadMutation.isPending;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={takePhoto}
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Opening…" : "📷 Take photo"}
        </button>

        <button
          type="button"
          onClick={chooseFromGallery}
          disabled={busy}
          className="min-h-11 rounded-xl border border-white/20 px-4 py-3 font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose from gallery
        </button>
      </div>

      {photo && (
        <div className="space-y-3">
          <p className="text-sm text-white/70">Photo preview</p>

          <img
            src={photo}
            alt="Proof of delivery preview"
            className="block max-h-80 w-full rounded-xl border border-white/10 object-contain"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={takePhoto}
              disabled={busy}
              className="min-h-11 rounded-xl border border-white/20 px-4 py-3 hover:bg-white/10 disabled:opacity-50"
            >
              Retake photo
            </button>

            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="min-h-11 rounded-xl border border-red-400/40 px-4 py-3 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
            >
              Remove preview
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccess(null);
                uploadMutation.mutate();
              }}
              disabled={busy}
              className="min-h-11 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload photo"}
            </button>
          </div>
        </div>
      )}

      {uploadMutation.isPending && (
        <p role="status" className="text-sm text-white/70">
          Uploading your photo. Please wait…
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-300">
          {success}
        </p>
      )}

      <p className="text-xs text-white/50">
        Photos are saved to the selected shipment after a successful upload.
      </p>
    </section>
  );
}
