from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    auth, employees, face, attendance, admin_attendance,
    reports, settings, audit, public,
    guestbook, survey, admin_guestbook, admin_survey,
    admin_management
)
from app.utils import secure_static

settings_config = get_settings()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Sistem Absensi Desa",
    description="Backend API untuk sistem absensi pegawai desa berbasis face recognition",
    version="1.0.0"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_config.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Buat folder uploads
os.makedirs("uploads/faces", exist_ok=True)
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/backgrounds", exist_ok=True)

# API Routes
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
app.include_router(admin_management.router, prefix=API_PREFIX)

# Secure uploads router (with authentication where needed)
app.include_router(secure_static.router, prefix=API_PREFIX)


@app.on_event("startup")
def on_startup():
    """
    Startup event handler.

    1. Create database tables if not exist
    2. Warm-up face embeddings cache (avoid cold start delay)
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Warm-up face embeddings cache
    try:
        from app.services.face_recognition import face_recognition_service
        from app.database import SessionLocal

        db = SessionLocal()
        try:
            count = face_recognition_service.refresh_embedding_cache(db)
            print(f"✅ Face embeddings cache warmed up successfully ({count} embeddings loaded)")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️  Warning: Could not warm up face cache: {e}")
        print("   Face recognition will work, but first request may be slower")


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ============================================
# FRONTEND SERVING (untuk production all-in-one)
# ============================================

# Path ke frontend dist (setelah build)
# Sesuaikan path ini dengan struktur folder di server
FRONTEND_PATH = "../frontend_dist"

# Mount static assets (CSS, JS, images) jika folder frontend ada
if os.path.exists(FRONTEND_PATH):
    # Serve /assets untuk CSS, JS, dll
    assets_path = os.path.join(FRONTEND_PATH, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Catch-all route untuk SPA (harus paling akhir!)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Serve frontend untuk semua route yang tidak match dengan API.
        Ini untuk support client-side routing (React Router).
        """
        # Skip jika request ke API (sudah di-handle di atas)
        # Note: /uploads sekarang dilindungi dengan auth di API router
        if full_path.startswith("api/"):
            # Biarkan FastAPI return 404
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")

        # Coba serve file langsung jika ada (untuk file statis selain assets)
        file_path = os.path.join(FRONTEND_PATH, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        # Default: serve index.html untuk SPA routing
        index_path = os.path.join(FRONTEND_PATH, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)

        # Jika index.html tidak ada
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Frontend not found")
else:
    # Jika folder frontend tidak ada (development mode)
    @app.get("/")
    def root():
        return {
            "message": "Sistem Absensi Desa API",
            "version": "1.0.0",
            "note": "Frontend not mounted. Build frontend first: cd ../tap-to-attend && npm run build"
        }
