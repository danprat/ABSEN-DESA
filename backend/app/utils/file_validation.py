"""File validation utilities for secure file uploads"""
import magic
from fastapi import HTTPException, status, UploadFile


# File size limits
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB in bytes

# Magic bytes for allowed image types
ALLOWED_IMAGE_MIMES = {
    "image/jpeg": [
        bytes.fromhex("FFD8FF"),  # JPEG/JPG
    ],
    "image/png": [
        bytes.fromhex("89504E47"),  # PNG
    ],
    "image/gif": [
        bytes.fromhex("474946383761"),  # GIF87a
        bytes.fromhex("474946383961"),  # GIF89a
    ],
}


async def validate_image_upload(
    file: UploadFile,
    max_size: int = MAX_IMAGE_SIZE,
    allowed_types: list[str] = None
) -> bytes:
    """
    Validate uploaded image file.

    Args:
        file: The uploaded file
        max_size: Maximum file size in bytes (default: 5MB)
        allowed_types: List of allowed MIME types (default: jpeg, png, gif)

    Returns:
        bytes: The file content if validation passes

    Raises:
        HTTPException: If validation fails
    """
    if allowed_types is None:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]

    # Read file content
    file_data = await file.read()

    # Check file size
    if len(file_data) > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file maksimal {size_mb:.0f}MB"
        )

    # Check MIME type from content-type header
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berupa gambar (jpg, png, atau gif)"
        )

    # Verify actual file type using magic bytes (more secure than just checking extension)
    try:
        # Use python-magic to detect actual MIME type
        detected_mime = magic.from_buffer(file_data, mime=True)

        # Normalize mime type (image/jpg -> image/jpeg)
        if detected_mime == "image/jpg":
            detected_mime = "image/jpeg"

        # Verify detected MIME matches declared content-type
        declared_mime = file.content_type
        if declared_mime == "image/jpg":
            declared_mime = "image/jpeg"

        if detected_mime not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipe file tidak valid. Terdeteksi: {detected_mime}"
            )

        # Extra check: verify magic bytes match expected patterns
        is_valid_magic = False
        for mime_type, magic_patterns in ALLOWED_IMAGE_MIMES.items():
            if detected_mime == mime_type:
                for pattern in magic_patterns:
                    if file_data.startswith(pattern):
                        is_valid_magic = True
                        break
                break

        if not is_valid_magic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File tidak valid atau rusak"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memvalidasi file: {str(e)}"
        )

    return file_data
