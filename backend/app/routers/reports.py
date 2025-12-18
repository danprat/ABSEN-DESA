import csv
import io
from datetime import date
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.models.admin import Admin
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.schemas.report import MonthlyReportItem, MonthlyReportResponse
from app.utils.auth import get_current_admin

router = APIRouter(prefix="/admin/reports", tags=["Reports"])


@router.get("/monthly", response_model=MonthlyReportResponse)
def get_monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    
    items = []
    for emp in employees:
        attendances = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == emp.id,
                AttendanceLog.date >= start_date,
                AttendanceLog.date <= end_date
            )
        ).all()
        
        present = sum(1 for a in attendances if a.status == AttendanceStatus.HADIR)
        late = sum(1 for a in attendances if a.status == AttendanceStatus.TERLAMBAT)
        absent = sum(1 for a in attendances if a.status == AttendanceStatus.ALFA)
        leave = sum(1 for a in attendances if a.status == AttendanceStatus.IZIN)
        sick = sum(1 for a in attendances if a.status == AttendanceStatus.SAKIT)
        checkout = sum(1 for a in attendances if a.check_out_at is not None)

        total_days = len(attendances)
        attendance_pct = ((present + late) / total_days * 100) if total_days > 0 else 0

        items.append(MonthlyReportItem(
            employee_id=emp.id,
            employee_name=emp.name,
            employee_nip=emp.nip,
            employee_position=emp.position,
            total_days=total_days,
            present_days=present,
            late_days=late,
            absent_days=absent,
            leave_days=leave,
            sick_days=sick,
            checkout_days=checkout,
            attendance_percentage=round(attendance_pct, 2)
        ))
    
    return MonthlyReportResponse(
        month=month,
        year=year,
        items=items,
        total_employees=len(employees)
    )


@router.get("/export")
def export_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "NIP", "Nama", "Jabatan",
        "Hadir", "Terlambat", "Alfa", "Izin", "Sakit", "Checkout",
        "Total Hari", "Persentase Kehadiran"
    ])
    
    for emp in employees:
        attendances = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == emp.id,
                AttendanceLog.date >= start_date,
                AttendanceLog.date <= end_date
            )
        ).all()
        
        present = sum(1 for a in attendances if a.status == AttendanceStatus.HADIR)
        late = sum(1 for a in attendances if a.status == AttendanceStatus.TERLAMBAT)
        absent = sum(1 for a in attendances if a.status == AttendanceStatus.ALFA)
        leave = sum(1 for a in attendances if a.status == AttendanceStatus.IZIN)
        sick = sum(1 for a in attendances if a.status == AttendanceStatus.SAKIT)
        checkout = sum(1 for a in attendances if a.check_out_at is not None)

        total_days = len(attendances)
        attendance_pct = ((present + late) / total_days * 100) if total_days > 0 else 0

        writer.writerow([
            emp.nip or "-",
            emp.name,
            emp.position,
            present,
            late,
            absent,
            leave,
            sick,
            checkout,
            total_days,
            f"{attendance_pct:.2f}%"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=rekap_absensi_{year}_{month:02d}.csv"
        }
    )
