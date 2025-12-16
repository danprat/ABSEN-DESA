from typing import List
from pydantic import BaseModel
from datetime import date, datetime


class HolidayBase(BaseModel):
    date: date
    name: str


class HolidayCreate(HolidayBase):
    pass


class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayListResponse(BaseModel):
    items: List[HolidayResponse]
    total: int
