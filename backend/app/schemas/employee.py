from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime


class EmployeeBase(BaseModel):
    nip: Optional[str] = None
    name: str
    position: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    photo_url: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    nip: Optional[str] = None
    name: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    page_size: int
