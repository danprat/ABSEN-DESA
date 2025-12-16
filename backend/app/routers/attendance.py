import base64
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.attendance import AttendanceLog
from app.models.employee import Employee
from app.schemas.attendance import AttendanceRecognizeResponse, AttendanceTodayItem, AttendanceTodayResponse
from app.services.face_recognition import face_recognition_service
from app.services.attendance import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance - Tablet"])


@router.post("/recognize", response_model=AttendanceRecognizeResponse)
async def recognize_and_attend(
    file: UploadFile = File(None),
    image_base64: str = Form(None),
    db: Session = Depends(get_db)
):
    if file:
        image_data = await file.read()
    elif image_base64:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_data = base64.b64decode(image_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format base64 tidak valid"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gambar diperlukan (file atau base64)"
        )
    
    if not face_recognition_service.detect_face(image_data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wajah tidak terdeteksi"
        )
    
    employee, confidence = face_recognition_service.find_matching_employee(image_data, db)
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wajah tidak dikenali"
        )
    
    attendance, message = attendance_service.process_attendance(db, employee, confidence)
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return AttendanceRecognizeResponse(
        employee={
            "id": employee.id,
            "name": employee.name,
            "position": employee.position,
            "photo": employee.photo_url
        },
        attendance={
            "id": attendance.id,
            "status": attendance.status.value,
            "check_in_at": attendance.check_in_at.isoformat() if attendance.check_in_at else None,
            "check_out_at": attendance.check_out_at.isoformat() if attendance.check_out_at else None
        },
        message=message,
        confidence=round(confidence * 100, 1)
    )


@router.get("/today", response_model=AttendanceTodayResponse)
def get_today_attendance(db: Session = Depends(get_db)):
    today = date.today()
    
    attendances = db.query(AttendanceLog).join(Employee).filter(
        and_(
            AttendanceLog.date == today,
            Employee.is_active == True
        )
    ).order_by(AttendanceLog.check_in_at.desc()).all()
    
    items = []
    for att in attendances:
        items.append(AttendanceTodayItem(
            id=att.id,
            employee_id=att.employee_id,
            employee_name=att.employee.name,
            employee_position=att.employee.position,
            employee_photo=att.employee.photo_url,
            check_in_at=att.check_in_at,
            check_out_at=att.check_out_at,
            status=att.status
        ))
    
    return AttendanceTodayResponse(items=items, total=len(items))
