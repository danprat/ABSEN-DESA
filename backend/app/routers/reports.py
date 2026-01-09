import csv
import io
from datetime import date, datetime
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from app.database import get_db
from app.models.admin import Admin
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.schemas.report import MonthlyReportItem, MonthlyReportResponse
from app.utils.auth import get_current_admin
from app.utils.export_utils import generate_pdf, generate_excel, generate_csv
from app.cache import get_cache, set_cache
from app.config import get_settings

router = APIRouter(prefix="/admin/reports", tags=["Reports"])
settings = get_settings()


def compute_monthly_statistics(db: Session, month: int, year: int) -> list[MonthlyReportItem]:
    """
    Compute monthly attendance statistics using optimized SQL query.
    Uses JOIN + GROUP BY to avoid N+1 query problem.

    Args:
        db: Database session
        month: Month number (1-12)
        year: Year

    Returns:
        List of MonthlyReportItem with statistics for each employee
    """
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)

    # Single optimized query with aggregations
    # This replaces 1 + N queries with just 1 query
    results = db.query(
        Employee.id,
        Employee.name,
        Employee.nik,
        Employee.nip,
        Employee.position,
        func.count(AttendanceLog.id).label('total_days'),
        func.sum(
            case((AttendanceLog.status == AttendanceStatus.HADIR, 1), else_=0)
        ).label('present_days'),
        func.sum(
            case((AttendanceLog.status == AttendanceStatus.TERLAMBAT, 1), else_=0)
        ).label('late_days'),
        func.sum(
            case((AttendanceLog.status == AttendanceStatus.ALFA, 1), else_=0)
        ).label('absent_days'),
        func.sum(
            case((AttendanceLog.status == AttendanceStatus.IZIN, 1), else_=0)
        ).label('leave_days'),
        func.sum(
            case((AttendanceLog.status == AttendanceStatus.SAKIT, 1), else_=0)
        ).label('sick_days'),
        func.sum(
            case((AttendanceLog.check_out_at.isnot(None), 1), else_=0)
        ).label('checkout_days')
    ).outerjoin(
        AttendanceLog,
        and_(
            Employee.id == AttendanceLog.employee_id,
            AttendanceLog.date >= start_date,
            AttendanceLog.date <= end_date
        )
    ).filter(
        Employee.is_active == True
    ).group_by(
        Employee.id,
        Employee.name,
        Employee.nik,
        Employee.nip,
        Employee.position
    ).all()

    # Process results
    items = []
    for row in results:
        total_days = row.total_days or 0
        present = row.present_days or 0
        late = row.late_days or 0

        attendance_pct = ((present + late) / total_days * 100) if total_days > 0 else 0

        items.append(MonthlyReportItem(
            employee_id=row.id,
            employee_name=row.name,
            employee_nik=row.nik,
            employee_position=row.position,
            total_days=total_days,
            present_days=present,
            late_days=late,
            absent_days=row.absent_days or 0,
            leave_days=row.leave_days or 0,
            sick_days=row.sick_days or 0,
            checkout_days=row.checkout_days or 0,
            attendance_percentage=round(attendance_pct, 2)
        ))

    return items


@router.get("/monthly", response_model=MonthlyReportResponse)
def get_monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Get monthly attendance report with caching.

    - Past months are cached permanently (data won't change)
    - Current month is cached for 5 minutes (data may still change)
    """
    # Check cache first
    cache_key = f"report:monthly:{year}:{month}"
    cached_data = get_cache(cache_key)

    if cached_data:
        # Return cached response
        return MonthlyReportResponse(**cached_data)

    # Cache miss - compute from database
    items = compute_monthly_statistics(db, month, year)

    # Count total employees
    total_employees = db.query(func.count(Employee.id))\
        .filter(Employee.is_active == True)\
        .scalar()

    response_data = {
        "month": month,
        "year": year,
        "items": [item.model_dump() for item in items],
        "total_employees": total_employees
    }

    # Determine TTL based on whether it's current month
    current_month = datetime.now().month
    current_year = datetime.now().year
    is_current_month = (month == current_month and year == current_year)

    # Current month: 5 minutes TTL (data may change)
    # Past months: 30 days TTL (data won't change)
    ttl = settings.CACHE_TTL_MONTHLY_REPORT if is_current_month else 86400 * 30

    # Cache the response
    set_cache(cache_key, response_data, ttl)

    return MonthlyReportResponse(**response_data)


@router.get("/export")
def export_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    format: str = Query("csv", pattern="^(csv|pdf|xlsx)$"),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """
    Export monthly attendance report in CSV, PDF, or Excel format.
    Uses optimized query to avoid N+1 problem.
    """
    # Use optimized helper function instead of N+1 queries
    items = compute_monthly_statistics(db, month, year)

    # Indonesian month names
    month_names = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
        5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
        9: "September", 10: "Oktober", 11: "November", 12: "Desember"
    }

    # Headers
    headers = ["NIP", "Nama", "Jabatan", "Hadir", "Terlambat", "Alfa", "Izin", "Sakit", "Checkout", "Total Hari", "Persentase"]

    # Prepare data as list of lists from optimized query results
    data = []
    for item in items:
        data.append([
            item.employee_nik or "-",
            item.employee_name,
            item.employee_position,
            item.present_days,
            item.late_days,
            item.absent_days,
            item.leave_days,
            item.sick_days,
            item.checkout_days,
            item.total_days,
            f"{item.attendance_percentage:.2f}%"
        ])

    # Title and subtitle
    title = "REKAP ABSENSI PEGAWAI"
    subtitle = f"Periode: {month_names[month]} {year}"

    # Generate file based on format
    if format == "csv":
        csv_content = generate_csv(headers, data)
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=rekap_absensi_{year}_{month:02d}.csv"
            }
        )
    elif format == "pdf":
        pdf_bytes = generate_pdf(title, subtitle, headers, data, logo_path=None, orientation="landscape")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=rekap_absensi_{year}_{month:02d}.pdf"
            }
        )
    elif format == "xlsx":
        excel_bytes = generate_excel(title, subtitle, headers, data, sheet_name="Rekap Absensi")
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=rekap_absensi_{year}_{month:02d}.xlsx"
            }
        )
