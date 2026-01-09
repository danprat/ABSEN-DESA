"""Secure static file serving with authentication"""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.utils.auth import get_current_admin


router = APIRouter(prefix="/uploads", tags=["Secure Uploads"])


@router.get("/faces/{filename}")
def serve_face_photo(
    filename: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Serve face photos - requires authentication"""
    filepath = Path("uploads/faces") / filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File tidak ditemukan"
        )

    # Security check: ensure path doesn't escape uploads directory
    try:
        filepath.resolve().relative_to(Path("uploads/faces").resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak"
        )

    return FileResponse(filepath)


@router.get("/logos/{filename}")
def serve_logo(
    filename: str,
    request: Request
):
    """Serve logos - public access (for landing page)"""
    filepath = Path("uploads/logos") / filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File tidak ditemukan"
        )

    # Security check: ensure path doesn't escape uploads directory
    try:
        filepath.resolve().relative_to(Path("uploads/logos").resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak"
        )

    return FileResponse(filepath)


@router.get("/backgrounds/{filename}")
def serve_background(
    filename: str,
    request: Request
):
    """Serve background images - public access (for landing page)"""
    filepath = Path("uploads/backgrounds") / filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File tidak ditemukan"
        )

    # Security check: ensure path doesn't escape uploads directory
    try:
        filepath.resolve().relative_to(Path("uploads/backgrounds").resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak"
        )

    return FileResponse(filepath)
