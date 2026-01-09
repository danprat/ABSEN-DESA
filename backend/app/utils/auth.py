from datetime import datetime, timedelta
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.models.admin import Admin, AdminRole
from app.schemas.auth import TokenData
from app.cache import get_cache, set_cache

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_token_from_cookie_or_header(
    request: Request,
    token_from_header: Optional[str] = Depends(oauth2_scheme)
) -> str:
    """Extract token from cookie (preferred) or Authorization header (fallback)"""
    # Try cookie first
    token = request.cookies.get("access_token")

    # Fallback to Authorization header
    if not token:
        token = token_from_header

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def revoke_token(token: str, expires_in: int):
    """Blacklist a token by storing it in Redis cache until expiration"""
    set_cache(f"blacklist:{token}", "revoked", ttl=expires_in)


def is_token_revoked(token: str) -> bool:
    """Check if a token has been revoked (blacklisted)"""
    return get_cache(f"blacklist:{token}") is not None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_admin(
    token: str = Depends(get_token_from_cookie_or_header),
    db: Session = Depends(get_db)
) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if token is revoked (blacklisted)
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        admin_id: int = payload.get("admin_id")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, admin_id=admin_id, role=role)
    except JWTError:
        raise credentials_exception

    admin = db.query(Admin).filter(Admin.id == token_data.admin_id).first()
    if admin is None:
        raise credentials_exception
    return admin


def require_admin_role(
    current_admin: Admin = Depends(get_current_admin)
) -> Admin:
    """Dependency to ensure user has admin role (not kepala_desa).
    Use this for write operations (POST, PATCH, DELETE).
    """
    if current_admin.role != AdminRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang dapat melakukan operasi ini."
        )
    return current_admin
