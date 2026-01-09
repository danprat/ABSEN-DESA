"""Public endpoints that don't require authentication."""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.work_settings import WorkSettings
from app.models.daily_schedule import DailyWorkSchedule
from app.cache import get_cache, set_cache
from app.config import get_settings

config = get_settings()


router = APIRouter(prefix="/public", tags=["Public"])


class TodayScheduleResponse(BaseModel):
    is_workday: bool
    check_in_start: str
    check_in_end: str
    check_out_start: str


class PublicSettingsResponse(BaseModel):
    village_name: str
    officer_name: Optional[str]
    logo_url: Optional[str]
    background_url: Optional[str]
    today_schedule: Optional[TodayScheduleResponse]


@router.get("/settings", response_model=PublicSettingsResponse)
def get_public_settings(db: Session = Depends(get_db)):
    """
    Get public settings without authentication - for attendance page.

    This endpoint is cached for 1 hour because settings rarely change.
    Cache is per-day for schedule (since schedule changes daily).
    """
    # Create cache key with today's date (since schedule is day-specific)
    today_date = datetime.now().date()
    cache_key = f"public:settings:{today_date}"

    # Try to get from cache first
    cached_data = get_cache(cache_key)
    if cached_data:
        return PublicSettingsResponse(**cached_data)

    # Cache miss - fetch from database
    # Get work settings
    settings = db.query(WorkSettings).first()
    if not settings:
        settings = WorkSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Get today's schedule
    today = datetime.now()
    day_of_week = today.weekday()  # 0=Monday, 6=Sunday

    schedule = db.query(DailyWorkSchedule).filter(
        DailyWorkSchedule.day_of_week == day_of_week
    ).first()

    today_schedule = None
    if schedule:
        today_schedule = TodayScheduleResponse(
            is_workday=schedule.is_workday,
            check_in_start=schedule.check_in_start.strftime("%H:%M"),
            check_in_end=schedule.check_in_end.strftime("%H:%M"),
            check_out_start=schedule.check_out_start.strftime("%H:%M")
        )
    else:
        # Fallback to global settings if no daily schedule
        today_schedule = TodayScheduleResponse(
            is_workday=day_of_week not in [5, 6],  # Sat/Sun = off
            check_in_start=settings.check_in_start.strftime("%H:%M"),
            check_in_end=settings.check_in_end.strftime("%H:%M"),
            check_out_start=settings.check_out_start.strftime("%H:%M")
        )

    response_data = {
        "village_name": settings.village_name,
        "officer_name": settings.officer_name,
        "logo_url": settings.logo_url,
        "background_url": settings.background_url,
        "today_schedule": today_schedule.model_dump() if today_schedule else None
    }

    # Cache for 1 hour (settings change rarely)
    set_cache(cache_key, response_data, config.CACHE_TTL_SETTINGS)

    return PublicSettingsResponse(**response_data)
