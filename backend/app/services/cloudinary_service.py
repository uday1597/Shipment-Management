
import os
from io import BytesIO

import cloudinary
import cloudinary.uploader
from PIL import Image, UnidentifiedImageError


MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

ALLOWED_IMAGE_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
}


class InvalidProofOfDeliveryImageError(ValueError):
    """Raised when an uploaded file is not an accepted image."""


class CloudinaryStorageError(Exception):
    """Raised when Cloudinary cannot complete a storage operation."""


def _configure_cloudinary() -> None:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not all((cloud_name, api_key, api_secret)):
        raise CloudinaryStorageError(
            "Cloudinary is not configured."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def validate_image(content: bytes) -> str:
    if not content:
        raise InvalidProofOfDeliveryImageError(
            "The uploaded image is empty."
        )

    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise InvalidProofOfDeliveryImageError(
            "Image size must not exceed 10 MiB."
        )

    try:
        with Image.open(BytesIO(content)) as image:
            image_format = image.format

            if image_format not in ALLOWED_IMAGE_FORMATS:
                raise InvalidProofOfDeliveryImageError(
                    "Only JPEG, PNG, and WebP images are accepted."
                )

            image.verify()

        return ALLOWED_IMAGE_FORMATS[image_format]

    except InvalidProofOfDeliveryImageError:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
    ) as exc:
        raise InvalidProofOfDeliveryImageError(
            "The uploaded file is not a valid image."
        ) from exc


def upload_image(
    shipment_id: int,
    content: bytes,
) -> dict:
    image_format = validate_image(content)
    _configure_cloudinary()

    try:
        result = cloudinary.uploader.upload(
            BytesIO(content),
            folder=f"shipment-management/proof-of-delivery/{shipment_id}",
            resource_type="image",
            allowed_formats=list(ALLOWED_IMAGE_FORMATS.values()),
            overwrite=False,
            unique_filename=True,
        )

        return {
            "cloudinary_public_id": result["public_id"],
            "image_url": result["secure_url"],
            "image_format": result.get("format", image_format),
            "file_size_bytes": result["bytes"],
        }

    except Exception as exc:
        raise CloudinaryStorageError(
            "Unable to store the proof-of-delivery image."
        ) from exc


def delete_image(public_id: str) -> None:
    _configure_cloudinary()

    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
        )

        if result.get("result") not in {"ok", "not found"}:
            raise CloudinaryStorageError(
                "Cloudinary did not confirm image deletion."
            )

    except CloudinaryStorageError:
        raise
    except Exception as exc:
        raise CloudinaryStorageError(
            "Unable to delete the stored image."
        ) from exc
