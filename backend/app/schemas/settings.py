from typing import Optional
from pydantic import BaseModel
from datetime import time, datetime


class WorkSettingsResponse(BaseModel):
    id: int
    village_name: str
    officer_name: Optional[str]
    logo_url: Optional[str]
    check_in_start: time
    check_in_end: time
    late_threshold_minutes: int
    check_out_start: time
    min_work_hours: float
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkSettingsUpdate(BaseModel):
    village_name: Optional[str] = None
    officer_name: Optional[str] = None
    logo_url: Optional[str] = None
    check_in_start: Optional[time] = None
    check_in_end: Optional[time] = None
    late_threshold_minutes: Optional[int] = None
    check_out_start: Optional[time] = None
    min_work_hours: Optional[float] = None
