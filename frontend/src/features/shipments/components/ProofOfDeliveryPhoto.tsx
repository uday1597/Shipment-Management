
import { useState } from 'react';
import {
  Camera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';

export default function ProofOfDeliveryPhoto() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function capturePhoto() {
    setError(null);
    setLoading(true);

    try {
      const result = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });

      setPhoto(result.webPath ?? null);

      if (!result.webPath) {
        setError('The photo could not be displayed.');
      }
    } catch {
      setError(
        'Photo capture was cancelled or unavailable. ' +
        'Check camera permissions and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Proof of delivery</h2>

      <button
        type="button"
        onClick={capturePhoto}
        disabled={loading}
      >
        {loading ? 'Opening camera…' : 'Capture delivery photo'}
      </button>

      {photo && (
        <div>
          <img
            src={photo}
            alt="Proof of delivery"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 360,
              marginTop: 16,
              borderRadius: 12,
            }}
          />

          <button
            type="button"
            onClick={() => setPhoto(null)}
          >
            Remove preview
          </button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
