"""Admin Guest Book Router - Protected endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import date
import csv
import io

from app.database import get_db
from app.models.admin import Admin
from app.models.guestbook import GuestBookEntry
from app.schemas.guestbook import GuestBookListResponse, GuestBookResponse
from app.utils.auth import get_current_admin
from app.utils.audit import log_audit
from app.models.audit_log import AuditAction, EntityType

router = APIRouter(prefix="/admin/guest-book", tags=["Admin - Guest Book"])


@router.get("", response_model=GuestBookListResponse)
def list_guest_book_entries(
    search: Optional[str] = Query(None, description="Search by name or institution"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List guest book entries with optional filters (admin only)"""
    query = db.query(GuestBookEntry)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (GuestBookEntry.name.ilike(search_term)) |
            (GuestBookEntry.institution.ilike(search_term))
        )
    
    # Apply date filters
    if start_date:
        query = query.filter(GuestBookEntry.visit_date >= start_date)
    if end_date:
        query = query.filter(GuestBookEntry.visit_date <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    entries = query.order_by(desc(GuestBookEntry.created_at))\
        .offset((page - 1) * per_page)\
        .limit(per_page)\
        .all()
    
    return GuestBookListResponse(
        items=entries,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/export")
def export_guest_book(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    format: str = Query("csv", pattern="^(csv)$"),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Export guest book entries to CSV"""
    query = db.query(GuestBookEntry)
    
    if start_date:
        query = query.filter(GuestBookEntry.visit_date >= start_date)
    if end_date:
        query = query.filter(GuestBookEntry.visit_date <= end_date)
    
    entries = query.order_by(desc(GuestBookEntry.created_at)).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Nama", "Instansi", "Keperluan", "Tanggal Kunjungan", "Dibuat"])
    
    for entry in entries:
        writer.writerow([
            entry.id,
            entry.name,
            entry.institution,
            entry.purpose,
            entry.visit_date.strftime("%Y-%m-%d"),
            entry.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    
    # Log audit
    log_audit(
        db=db,
        action=AuditAction.EXPORT,
        entity_type=EntityType.GUESTBOOK,
        entity_id=None,
        description=f"Exported {len(entries)} guest book entries to {format}",
        performed_by=admin.username,
        details={"format": format, "count": len(entries)}
    )
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=buku_tamu.csv"}
    )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guest_book_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Delete a guest book entry (admin only)"""
    entry = db.query(GuestBookEntry).filter(GuestBookEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest book entry not found"
        )
    
    # Log audit before deletion
    log_audit(
        db=db,
        action=AuditAction.DELETE,
        entity_type=EntityType.GUESTBOOK,
        entity_id=entry_id,
        description=f"Deleted guest book entry: {entry.name}",
        performed_by=admin.username,
        details={"name": entry.name, "institution": entry.institution}
    )
    
    db.delete(entry)
    db.commit()
    return None
