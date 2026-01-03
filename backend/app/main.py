from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    auth, employees, face, attendance, admin_attendance, 
    reports, settings, audit, public,
    guestbook, survey, admin_guestbook, admin_survey
)

settings_config = get_settings()

app = FastAPI(
    title="Sistem Absensi Desa",
    description="Backend API untuk sistem absensi pegawai desa berbasis face recognition",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_config.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/faces", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(employees.router, prefix=API_PREFIX)
app.include_router(face.router, prefix=API_PREFIX)
app.include_router(attendance.router, prefix=API_PREFIX)
app.include_router(admin_attendance.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(settings.router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)
app.include_router(public.router, prefix=API_PREFIX)
app.include_router(guestbook.router, prefix=API_PREFIX)
app.include_router(survey.router, prefix=API_PREFIX)
app.include_router(admin_guestbook.router, prefix=API_PREFIX)
app.include_router(admin_survey.router, prefix=API_PREFIX)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Sistem Absensi Desa API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
