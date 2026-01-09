"""Password policy enforcement utilities"""
import re
from fastapi import HTTPException, status


# Password policy requirements
MIN_PASSWORD_LENGTH = 8
REQUIRE_UPPERCASE = True
REQUIRE_LOWERCASE = True
REQUIRE_DIGIT = True
REQUIRE_SPECIAL_CHAR = True


def validate_password_strength(password: str) -> None:
    """
    Validate password meets security requirements.

    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character

    Args:
        password: The password to validate

    Raises:
        HTTPException: If password doesn't meet requirements
    """
    errors = []

    # Check length
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"minimal {MIN_PASSWORD_LENGTH} karakter")

    # Check uppercase
    if REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
        errors.append("minimal 1 huruf kapital")

    # Check lowercase
    if REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
        errors.append("minimal 1 huruf kecil")

    # Check digit
    if REQUIRE_DIGIT and not re.search(r"\d", password):
        errors.append("minimal 1 angka")

    # Check special character
    if REQUIRE_SPECIAL_CHAR and not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/;'`~]", password):
        errors.append("minimal 1 karakter spesial (!@#$%^&* dll)")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password harus memenuhi kriteria: {', '.join(errors)}"
        )


def validate_password_match(password: str, confirm_password: str) -> None:
    """
    Validate that password and confirm password match.

    Args:
        password: The password
        confirm_password: The confirmation password

    Raises:
        HTTPException: If passwords don't match
    """
    if password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password dan konfirmasi password tidak cocok"
        )
