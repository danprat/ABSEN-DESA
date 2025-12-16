from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.models.audit_log import AuditLog, AuditAction, EntityType
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.utils.auth import get_current_admin

router = APIRouter(prefix="/admin/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    action: Optional[AuditAction] = Query(None),
    entity_type: Optional[EntityType] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )
