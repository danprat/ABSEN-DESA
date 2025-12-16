from typing import Optional
from datetime import time
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.models.work_settings import WorkSettings
from app.models.holiday import Holiday
from app.models.audit_log import AuditAction, EntityType
from app.schemas.settings import WorkSettingsResponse, WorkSettingsUpdate
from app.schemas.holiday import HolidayCreate, HolidayResponse, HolidayListResponse
from app.utils.auth import get_current_admin
from app.utils.audit import log_audit

router = APIRouter(prefix="/admin/settings", tags=["Settings"])


@router.get("", response_model=WorkSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    settings = db.query(WorkSettings).first()
    if not settings:
        settings = WorkSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.patch("", response_model=WorkSettingsResponse)
def update_settings(
    data: WorkSettingsUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    settings = db.query(WorkSettings).first()
    if not settings:
        settings = WorkSettings()
        db.add(settings)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    # Convert time objects to strings for JSON serialization in audit log
    audit_details = {}
    for key, value in update_data.items():
        if isinstance(value, time):
            audit_details[key] = value.strftime("%H:%M:%S")
        else:
            audit_details[key] = value

    log_audit(
        db=db,
        action=AuditAction.UPDATE,
        entity_type=EntityType.SETTINGS,
        entity_id=settings.id,
        description="Mengupdate pengaturan kantor",
        performed_by=admin.name,
        details=audit_details
    )

    return settings


@router.get("/holidays", response_model=HolidayListResponse)
def list_holidays(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    query = db.query(Holiday)
    
    if year:
        from sqlalchemy import extract
        query = query.filter(extract('year', Holiday.date) == year)
    
    holidays = query.order_by(Holiday.date).all()
    
    return HolidayListResponse(items=holidays, total=len(holidays))


@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(
    data: HolidayCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    existing = db.query(Holiday).filter(Holiday.date == data.date).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tanggal ini sudah terdaftar sebagai hari libur"
        )
    
    holiday = Holiday(**data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    
    log_audit(
        db=db,
        action=AuditAction.CREATE,
        entity_type=EntityType.HOLIDAY,
        entity_id=holiday.id,
        description=f"Menambahkan hari libur: {holiday.name} ({holiday.date})",
        performed_by=admin.name
    )
    
    return holiday


@router.delete("/holidays/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hari libur tidak ditemukan"
        )
    
    log_audit(
        db=db,
        action=AuditAction.DELETE,
        entity_type=EntityType.HOLIDAY,
        entity_id=holiday.id,
        description=f"Menghapus hari libur: {holiday.name} ({holiday.date})",
        performed_by=admin.name
    )
    
    db.delete(holiday)
    db.commit()
