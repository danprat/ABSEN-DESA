from typing import Optional, Tuple
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.models.holiday import Holiday
from app.models.work_settings import WorkSettings


class AttendanceService:
    def get_work_settings(self, db: Session) -> WorkSettings:
        settings = db.query(WorkSettings).first()
        if not settings:
            settings = WorkSettings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings
    
    def is_holiday(self, db: Session, check_date: date) -> bool:
        holiday = db.query(Holiday).filter(Holiday.date == check_date).first()
        return holiday is not None
    
    def is_weekend(self, check_date: date) -> bool:
        return check_date.weekday() in [5, 6]
    
    def get_attendance_mode(self, current_time: time, settings: WorkSettings) -> Optional[str]:
        check_in_start = settings.check_in_start
        check_in_end = settings.check_in_end
        check_out_start = settings.check_out_start
        # Set check_out_end to 23:59:59 (end of day)
        check_out_end = time(23, 59, 59)

        if check_in_start <= current_time < check_in_end:
            return "CHECK_IN"
        elif check_out_start <= current_time <= check_out_end:
            return "CHECK_OUT"
        return None
    
    def get_today_attendance(self, db: Session, employee_id: int) -> Optional[AttendanceLog]:
        today = date.today()
        return db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == employee_id,
                AttendanceLog.date == today
            )
        ).first()
    
    def process_attendance(
        self,
        db: Session,
        employee: Employee,
        confidence_score: float
    ) -> Tuple[Optional[AttendanceLog], str]:
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        if self.is_weekend(today):
            return None, "Hari ini adalah akhir pekan"
        
        if self.is_holiday(db, today):
            return None, "Hari ini adalah hari libur"

        settings = self.get_work_settings(db)
        mode = self.get_attendance_mode(current_time, settings)
        if mode is None:
            return None, f"Di luar jam absensi ({settings.check_in_start.strftime('%H:%M')}-{time(23, 59).strftime('%H:%M')})"

        attendance = self.get_today_attendance(db, employee.id)
        
        if mode == "CHECK_IN":
            if attendance and attendance.check_in_at:
                return attendance, f"Sudah absen masuk pukul {attendance.check_in_at.strftime('%H:%M')}"
            
            late_threshold = datetime.combine(
                today,
                settings.check_in_end
            ) + timedelta(minutes=settings.late_threshold_minutes)
            
            if now <= late_threshold:
                status = AttendanceStatus.HADIR
            else:
                status = AttendanceStatus.TERLAMBAT
            
            if attendance:
                attendance.check_in_at = now
                attendance.status = status
                attendance.confidence_score = confidence_score
            else:
                attendance = AttendanceLog(
                    employee_id=employee.id,
                    date=today,
                    check_in_at=now,
                    status=status,
                    confidence_score=confidence_score
                )
                db.add(attendance)
            
            db.commit()
            db.refresh(attendance)
            
            greeting = f"Selamat datang, {employee.name}"
            if status == AttendanceStatus.TERLAMBAT:
                greeting += " (Terlambat)"
            
            return attendance, greeting
        
        else:
            if not attendance or not attendance.check_in_at:
                return None, "Belum absen masuk hari ini"
            
            if attendance.check_out_at:
                return attendance, f"Sudah absen pulang pukul {attendance.check_out_at.strftime('%H:%M')}"
            
            attendance.check_out_at = now
            db.commit()
            db.refresh(attendance)
            
            return attendance, f"Sampai jumpa besok, {employee.name}"
    
    def mark_absent_employees(self, db: Session):
        today = date.today()
        
        if self.is_weekend(today) or self.is_holiday(db, today):
            return
        
        employees = db.query(Employee).filter(Employee.is_active == True).all()
        
        for emp in employees:
            attendance = self.get_today_attendance(db, emp.id)
            if not attendance:
                attendance = AttendanceLog(
                    employee_id=emp.id,
                    date=today,
                    status=AttendanceStatus.ALFA
                )
                db.add(attendance)
        
        db.commit()


attendance_service = AttendanceService()
