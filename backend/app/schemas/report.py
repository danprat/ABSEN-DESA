from typing import Optional, List
from pydantic import BaseModel


class MonthlyReportItem(BaseModel):
    employee_id: int
    employee_name: str
    employee_nip: Optional[str]
    employee_position: str
    total_days: int
    present_days: int
    late_days: int
    absent_days: int
    leave_days: int
    sick_days: int
    attendance_percentage: float


class MonthlyReportResponse(BaseModel):
    month: int
    year: int
    items: List[MonthlyReportItem]
    total_employees: int
