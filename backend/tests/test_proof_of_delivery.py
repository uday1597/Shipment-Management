from io import BytesIO

from PIL import Image

from app.services import cloudinary_service
from tests.test_shipments import create_shipment
from app.models import ProofOfDeliveryPhoto
from app.repositories.proof_of_delivery_repository import (
    ProofOfDeliveryRepository,
)
from tests.conftest import TestingSessionLocal
from app.services.cloudinary_service import CloudinaryStorageError
from sqlalchemy import inspect

def make_test_image(
    image_format: str = "PNG",
) -> bytes:
    buffer = BytesIO()

    image = Image.new("RGB", (10, 10), color="red")
    image.save(buffer, format=image_format)

    return buffer.getvalue()


def test_upload_proof_of_delivery_success(
    client,
    monkeypatch,
):
    created = create_shipment(client)
    image_bytes = make_test_image()

    def fake_upload(shipment_id, content):
        assert shipment_id == created["id"]
        assert content == image_bytes

        return {
            "cloudinary_public_id": "test/proof-image",
            "image_url": "https://example.com/proof.png",
            "image_format": "png",
            "file_size_bytes": len(image_bytes),
        }

    monkeypatch.setattr(
        cloudinary_service,
        "upload_image",
        fake_upload,
    )

    # Patch the reference used by the POD service.
    monkeypatch.setattr(
        "app.services.proof_of_delivery_service.upload_image",
        fake_upload,
    )

    response = client.post(
        f"/shipments/{created['id']}/proof-of-delivery",
        files={
            "file": (
                "proof.png",
                image_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["shipment_id"] == created["id"]
    assert data["image_url"] == "https://example.com/proof.png"
    assert data["image_format"] == "png"
    assert data["file_size_bytes"] == len(image_bytes)
    assert data["created_at"] is not None


def test_upload_proof_of_delivery_rejects_invalid_image(client):
    created = create_shipment(client)

    response = client.post(
        f"/shipments/{created['id']}/proof-of-delivery",
        files={
            "file": (
                "not-an-image.png",
                b"this is not a real image",
                "image/png",
            )
        },
    )

    assert response.status_code == 422


def test_upload_proof_of_delivery_rejects_oversized_image(client):
    from app.services.cloudinary_service import MAX_IMAGE_SIZE_BYTES

    created = create_shipment(client)

    oversized_content = b"x" * (MAX_IMAGE_SIZE_BYTES + 1)

    response = client.post(
        f"/shipments/{created['id']}/proof-of-delivery",
        files={
            "file": (
                "oversized.png",
                oversized_content,
                "image/png",
            )
        },
    )

    assert response.status_code == 422

def test_upload_proof_of_delivery_rejects_missing_shipment(
    client,
    monkeypatch,
):
    image_bytes = make_test_image()

    def upload_should_not_run(*args, **kwargs):
        raise AssertionError("Upload must not run for a missing shipment")

    monkeypatch.setattr(
        "app.services.proof_of_delivery_service.upload_image",
        upload_should_not_run,
    )

    response = client.post(
        "/shipments/999999/proof-of-delivery",
        files={
            "file": (
                "proof.png",
                image_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 404
def test_upload_returns_502_when_cloudinary_fails(
    client,
    monkeypatch,
):
    created = create_shipment(client)

    def fail_upload(shipment_id, content):
        raise CloudinaryStorageError("Cloudinary unavailable")

    monkeypatch.setattr(
        "app.services.proof_of_delivery_service.upload_image",
        fail_upload,
    )

    response = client.post(
        f"/shipments/{created['id']}/proof-of-delivery",
        files={
            "file": (
                "proof.png",
                make_test_image(),
                "image/png",
            )
        },
    )

    assert response.status_code == 502
    assert response.json() == {
        "detail": "Image storage is temporarily unavailable."
    }
    assert "Cloudinary unavailable" not in response.text
