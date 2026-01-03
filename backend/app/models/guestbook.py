"""Guest Book Model"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class GuestBookEntry(Base):
    """Model for guest book entries"""
    __tablename__ = "guest_book_entries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    institution = Column(String(200), nullable=False)
    purpose = Column(Text, nullable=False)
    visit_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
