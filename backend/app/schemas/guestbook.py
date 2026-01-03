"""Guest Book Schemas"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime


class GuestBookCreate(BaseModel):
    """Schema for creating a guest book entry"""
    name: str = Field(..., min_length=1, max_length=100)
    institution: str = Field(..., min_length=1, max_length=200)
    purpose: str = Field(..., min_length=1)
    visit_date: date


class GuestBookResponse(BaseModel):
    """Schema for guest book entry response"""
    id: int
    name: str
    institution: str
    purpose: str
    visit_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class GuestBookListResponse(BaseModel):
    """Schema for paginated guest book list"""
    items: List[GuestBookResponse]
    total: int
    page: int
    per_page: int
