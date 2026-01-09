from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.models.admin import Admin
from app.models.audit_log import AuditAction, EntityType
from app.schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest
from app.utils.auth import verify_password, create_access_token, get_password_hash, get_current_admin, revoke_token
from app.utils.password_policy import validate_password_strength, validate_password_match
from app.utils.audit import log_audit
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Max 5 login attempts per minute per IP
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
        data={"sub": admin.username, "admin_id": admin.id, "role": admin.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=3600  # 1 hour in seconds
    )

    return TokenResponse(access_token=access_token, role=admin.role)


@router.post("/setup", response_model=dict)
def setup_admin(db: Session = Depends(get_db)):
    """Setup initial admin account. Only works if no admin exists."""
    existing = db.query(Admin).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin sudah ada"
        )

    # Generate random secure password
    import secrets
    random_password = secrets.token_urlsafe(16)

    admin = Admin(
        username="admin",
        password_hash=get_password_hash(random_password),
        name="Administrator"
    )
    db.add(admin)
    db.commit()

    return {
        "message": "Admin berhasil dibuat. SIMPAN password ini!",
        "username": "admin",
        "password": random_password,
        "warning": "Password ini hanya ditampilkan sekali. Segera ganti password setelah login!"
    }


@router.get("/me", response_model=dict)
def get_current_user(
    current_admin: Admin = Depends(get_current_admin)
):
    """Get current authenticated user info"""
    return {
        "username": current_admin.username,
        "role": current_admin.role,
        "name": current_admin.name
    }


@router.patch("/change-password", response_model=dict)
def change_password(
    request: ChangePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Change admin password. Requires authentication."""
    # Verify current password
    if not verify_password(request.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password lama tidak benar"
        )

    # Validate new password strength
    validate_password_strength(request.new_password)

    # Validate password confirmation
    validate_password_match(request.new_password, request.confirm_password)

    # Update password
    current_admin.password_hash = get_password_hash(request.new_password)
    db.commit()

    # Log audit action
    log_audit(
        db=db,
        action=AuditAction.UPDATE,
        entity_type=EntityType.ADMIN,
        entity_id=current_admin.id,
        description=f"Password changed for admin: {current_admin.username}",
        performed_by=current_admin.username
    )

    return {"message": "Password berhasil diubah"}


@router.post("/logout", response_model=dict)
def logout(
    response: Response,
    request: Request,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Logout by revoking the current token"""
    # Get token from cookie or header
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to header for backward compatibility
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if token:
        # Revoke token for remaining TTL (60 minutes = 3600 seconds)
        revoke_token(token, expires_in=3600)

    # Clear httpOnly cookie
    response.delete_cookie(key="access_token")

    # Log audit action
    log_audit(
        db=db,
        action=AuditAction.UPDATE,
        entity_type=EntityType.ADMIN,
        entity_id=current_admin.id,
        description=f"Logout: {current_admin.username}",
        performed_by=current_admin.username
    )

    return {"message": "Logout berhasil"}
