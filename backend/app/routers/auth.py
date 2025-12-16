from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.admin import Admin
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.auth import verify_password, create_access_token, get_password_hash
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": admin.username, "admin_id": admin.id},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return TokenResponse(access_token=access_token)


@router.post("/setup", response_model=dict)
def setup_admin(db: Session = Depends(get_db)):
    """Setup initial admin account. Only works if no admin exists."""
    existing = db.query(Admin).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin sudah ada"
        )
    
    admin = Admin(
        username="admin",
        password_hash=get_password_hash("admin123"),
        name="Administrator"
    )
    db.add(admin)
    db.commit()
    
    return {"message": "Admin berhasil dibuat", "username": "admin", "password": "admin123"}
