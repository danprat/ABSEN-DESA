# Security Fixes Implementation Plan

**Tanggal:** 2026-01-09
**Berdasarkan:** Security Audit Report (docs/SECURITY_AUDIT_REPORT.md)
**Scope:** Priority 1, 2, 3 (13 security fixes total)
**Approach:** All-at-once dengan sequential execution dan code review checkpoints

---

## Implementation Strategy

**Execution:** Sequential task groups dengan subagent-driven-development
**Code Review:** After Group 1, Group 3, and Group 6 (final)
**Breaking Changes:** JWT localStorage → httpOnly cookies (Group 3)

---

## Task Groups

### Group 1 - Priority 1 (Critical - Backend Config)
**Dependencies:** None

**Tasks:**
1. Generate strong SECRET_KEY (32+ chars)
2. Fix CORS wildcard → specific origins
3. Fix default admin credentials → random password

**Files:**
- `backend/.env`
- `backend/app/routers/auth.py`

**Verification:**
```bash
grep "SECRET_KEY=" backend/.env  # 32+ random chars
grep "CORS_ORIGINS=" backend/.env  # No *
curl -X POST http://localhost:8000/api/v1/auth/setup
```

---

### Group 2 - Priority 2 Part A (Rate Limiting - Backend)
**Dependencies:** Group 1 complete

**Tasks:**
1. Install slowapi dependency
2. Implement rate limiting on login (5/minute)

**Files:**
- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/routers/auth.py`

**Verification:**
```bash
# Should block after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -d "username=test&password=test"
done
```

---

### Group 3 - Priority 2 Part B (JWT Security - Backend + Frontend)
**Dependencies:** Group 2 complete
**⚠️ BREAKING CHANGE:** Frontend depends on backend changes

**Tasks:**
1. Reduce JWT expiration (1440 → 60 minutes)
2. Implement token revocation (Redis blacklist)
3. Change JWT to httpOnly cookies (Backend)
4. Update frontend for cookie-based auth (Frontend)

**Files:**
- `backend/app/config.py`
- `backend/app/utils/auth.py`
- `backend/app/routers/auth.py`
- `tap-to-attend/src/lib/api.ts`
- `tap-to-attend/src/hooks/useAuth.tsx`

**Implementation Details:**

**Backend Changes:**
```python
# config.py
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour

# auth.py - Token revocation
def revoke_token(token: str, expires_in: int):
    set_cache(f"blacklist:{token}", "revoked", ttl=expires_in)

def is_token_revoked(token: str) -> bool:
    return get_cache(f"blacklist:{token}") is not None

# auth.py - httpOnly cookie
from fastapi.responses import Response

@router.post("/login")
def login(response: Response, ...):
    # Create token
    access_token = create_access_token(...)

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Production only
        samesite="lax",
        max_age=3600
    )

    return {"message": "Login berhasil", "role": admin.role}

@router.post("/logout")
def logout(
    response: Response,
    token: str = Depends(oauth2_scheme),
    current_admin: Admin = Depends(get_current_admin)
):
    # Revoke token
    revoke_token(token, 3600)

    # Clear cookie
    response.delete_cookie("access_token")
    return {"message": "Logout berhasil"}

# Update get_current_admin to check blacklist
def get_current_admin(...):
    # Check if token is revoked
    if is_token_revoked(token):
        raise HTTPException(401, "Token has been revoked")
    # ... existing validation
```

**Frontend Changes:**
```typescript
// api.ts - Remove localStorage usage
// DELETE: authToken object entirely

// Enable credentials for cookies
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true  // ADD THIS
});

// Remove token interceptor
// DELETE: apiClient.interceptors.request.use (token injection)

// Update response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Just redirect, cookie will be cleared by backend
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Update auth API
export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await apiClient.post<LoginResponse>(
        '/api/v1/auth/login',
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return response.data;
    },

    logout: async (): Promise<void> => {
      await apiClient.post('/api/v1/auth/logout');
    },

    isAuthenticated: async (): Promise<boolean> => {
      try {
        // Try to access protected endpoint
        await apiClient.get('/api/v1/admin/settings');
        return true;
      } catch {
        return false;
      }
    },
    // ... rest
  }
};
```

```typescript
// useAuth.tsx - Remove localStorage role storage
// Just rely on API calls, role comes from backend
const ROLE_KEY = 'user_role';  // DELETE this

export const authRole = {  // DELETE this entire object
  get: (): string | null => localStorage.getItem(ROLE_KEY),
  set: (role: string): void => localStorage.setItem(ROLE_KEY, role),
  remove: (): void => localStorage.removeItem(ROLE_KEY),
};

// Update useAuth hook
export function useAuth() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount
    const checkAuth = async () => {
      try {
        const settings = await api.admin.settings.get();
        // Assuming backend returns user info with role
        setRole('admin'); // Or get from settings/user endpoint
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await api.auth.login(credentials);
    setRole(response.role);
    return response;
  };

  const logout = async () => {
    await api.auth.logout();
    setRole(null);
  };

  return { role, login, logout, loading };
}
```

**Verification:**
```bash
# Backend
grep "ACCESS_TOKEN_EXPIRE_MINUTES = 60" backend/app/config.py
curl -i -X POST http://localhost:8000/api/v1/auth/login  # Check Set-Cookie header

# Frontend
# Login via UI, check DevTools:
# - Application > Cookies > access_token present
# - HttpOnly flag = true
# - localStorage should NOT have auth_token
```

---

### Group 4 - Priority 3 Part A (File Security - Backend)
**Dependencies:** Group 3 complete

**Tasks:**
1. Add file size limit (5MB max)
2. Strengthen file type validation (magic bytes)
3. Protect uploaded files with auth

**Files:**
- `backend/app/routers/face.py`
- `backend/app/main.py`
- `backend/app/utils/validators.py` (NEW)

**Implementation:**

```python
# app/utils/validators.py (NEW FILE)
import imghdr
from fastapi import HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image_file(content: bytes, filename: str) -> None:
    """Validate image file size and type"""
    # Check size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File terlalu besar. Maximum {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Check actual file type (magic bytes)
    image_type = imghdr.what(None, h=content)
    allowed_types = ['jpeg', 'png', 'webp']

    if image_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File bukan gambar yang valid. Hanya {', '.join(allowed_types)} yang diizinkan"
        )
```

```python
# app/routers/face.py
from app.utils.validators import validate_image_file

@router.post("/{employee_id}/face", response_model=FaceUploadResponse)
async def upload_face(...):
    # ... existing code

    image_data = await file.read()

    # Validate file FIRST
    validate_image_file(image_data, file.filename or "unknown")

    # Then proceed with face detection
    if not face_recognition_service.detect_face(image_data):
        raise HTTPException(400, "Wajah tidak terdeteksi")

    # ... rest of code
```

```python
# app/main.py
# REMOVE this line:
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ADD protected endpoint:
from fastapi.responses import FileResponse
from app.utils.auth import get_current_admin

@app.get("/api/v1/uploads/{path:path}")
def serve_upload(
    path: str,
    current_admin: Admin = Depends(get_current_admin)
):
    """Serve uploaded files with authentication"""
    # Prevent path traversal
    if ".." in path or path.startswith("/"):
        raise HTTPException(400, "Invalid path")

    file_path = os.path.join("uploads", path)

    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")

    return FileResponse(file_path)
```

**Frontend Update (for image URLs):**
```typescript
// Images will now need auth token in cookie to load
// Update image URLs from /uploads/... to /api/v1/uploads/...
// Browser will automatically send cookie
```

**Verification:**
```bash
# Test file size limit
dd if=/dev/zero of=large.jpg bs=1M count=6  # 6MB file
curl -X POST http://localhost:8000/api/v1/employees/1/face \
  -F "file=@large.jpg" \
  -H "Authorization: Bearer <token>"
# Should get 413 error

# Test file type validation
echo "fake image" > fake.jpg
curl -X POST http://localhost:8000/api/v1/employees/1/face \
  -F "file=@fake.jpg" \
  -H "Authorization: Bearer <token>"
# Should get 400 error

# Test protected uploads
curl http://localhost:8000/uploads/faces/test.jpg  # Should fail (404)
curl http://localhost:8000/api/v1/uploads/faces/test.jpg  # Should fail (401)
curl http://localhost:8000/api/v1/uploads/faces/test.jpg \
  --cookie "access_token=<valid-token>"  # Should work
```

---

### Group 5 - Priority 3 Part B (Password & Config - Backend)
**Dependencies:** Group 4 complete

**Tasks:**
1. Add password policy enforcement
2. Set DEBUG=false with dev/prod instructions

**Files:**
- `backend/app/schemas/auth.py`
- `backend/.env`
- `backend/.env.example`

**Implementation:**

```python
# app/schemas/auth.py
from pydantic import BaseModel, field_validator
import re

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password minimal 8 karakter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password harus mengandung minimal 1 huruf besar')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password harus mengandung minimal 1 huruf kecil')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password harus mengandung minimal 1 angka')
        # Optional: check for common passwords
        common_passwords = ['12345678', 'password', 'Password1']
        if v in common_passwords:
            raise ValueError('Password terlalu umum')
        return v

    @field_validator('confirm_password')
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Password confirmation tidak cocok')
        return v

# Apply same validator to AdminCreate schema
class AdminCreate(BaseModel):
    username: str
    name: str
    password: str
    role: str

    @field_validator('password')
    def validate_password_strength(cls, v):
        # Same validation as above
        if len(v) < 8:
            raise ValueError('Password minimal 8 karakter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password harus mengandung minimal 1 huruf besar')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password harus mengandung minimal 1 huruf kecil')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password harus mengandung minimal 1 angka')
        return v
```

```bash
# .env - Update with comments
# =================================
# ENVIRONMENT CONFIGURATION
# =================================
# Development: DEBUG=true
# Production: DEBUG=false (IMPORTANT!)
DEBUG=false

# ... rest of config
```

```bash
# .env.example - Add documentation
# Database
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/absen_desa

# JWT - GENERATE NEW SECRET_KEY FOR PRODUCTION!
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=CHANGE-THIS-IN-PRODUCTION-USE-RANDOM-STRING
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# App
# Production: Set DEBUG=false
DEBUG=true
# Production: Set to your actual domain(s), comma-separated
# Example: CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Face Recognition
FACE_RECOGNITION_ENABLED=false
FACE_RECOGNITION_URL=http://localhost:8001

# Redis Caching
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true
CACHE_TTL_SETTINGS=3600
CACHE_TTL_ATTENDANCE_TODAY=30
CACHE_TTL_MONTHLY_REPORT=300
```

**Verification:**
```bash
# Test weak password rejected
curl -X PATCH http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -d '{"current_password":"Admin123","new_password":"weak","confirm_password":"weak"}'
# Should get validation error

# Test strong password accepted
curl -X PATCH http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -d '{"current_password":"Admin123","new_password":"StrongPass123","confirm_password":"StrongPass123"}'
# Should succeed
```

---

### Group 6 - Priority 3 Part C (Dependencies - Frontend)
**Dependencies:** Group 5 complete

**Tasks:**
1. Update outdated frontend dependencies

**Files:**
- `tap-to-attend/package.json`
- `tap-to-attend/bun.lockb`

**Implementation:**
```bash
cd tap-to-attend
bun update
# Review changes, test build
bun run build
```

**Verification:**
```bash
bun outdated  # Should show minimal outdated packages
bun run build  # Should build successfully
bun run dev  # Should run without errors
```

---

## Code Review Checkpoints

### Checkpoint 1: After Group 1 (Critical Fixes)
**Focus:** Configuration security
- Verify SECRET_KEY is strong random string
- Verify CORS is properly configured
- Verify admin setup generates random password
- Test basic login still works

### Checkpoint 2: After Group 3 (JWT Breaking Changes)
**Focus:** Authentication flow end-to-end
- Verify login sets httpOnly cookie
- Verify protected endpoints work with cookie
- Verify logout clears cookie and revokes token
- Verify rate limiting works
- Test frontend login/logout flow completely

### Checkpoint 3: After Group 6 (Final)
**Focus:** Comprehensive security verification
- All 13 fixes implemented
- File upload validation works
- Password policy enforced
- Dependencies updated
- Full regression testing

---

## Final Verification Checklist

```bash
# Backend
✓ SECRET_KEY adalah random 32+ chars
✓ CORS_ORIGINS tidak mengandung "*"
✓ DEBUG=false (atau properly documented for dev/prod)
✓ Rate limiting blocks after 5 login attempts
✓ JWT expiration = 60 minutes
✓ Token revocation works (logout invalidates token)
✓ Login sets httpOnly cookie
✓ File upload > 5MB rejected
✓ Fake image file rejected
✓ /uploads/* requires authentication
✓ Weak password rejected
✓ Strong password accepted

# Frontend
✓ No token in localStorage
✓ httpOnly cookie present after login
✓ Login flow works end-to-end
✓ Logout clears cookie
✓ Protected pages require auth
✓ Dependencies updated
✓ Build succeeds without errors
✓ App runs without console errors
```

---

## Rollback Plan

Jika ada issues setelah deployment:

1. **Critical Issues (app broken):**
   ```bash
   git revert <commit-hash>
   # atau
   git reset --hard <previous-commit>
   git push --force
   ```

2. **Partial Rollback (specific fix broken):**
   - Identify problematic group
   - Revert specific commits
   - Re-test

3. **Frontend Issues Only:**
   - Rollback frontend deployment
   - Backend changes tetap (backward compatible)

---

## Success Criteria

Implementation dianggap sukses jika:
1. ✓ Semua 13 tasks completed
2. ✓ All verification tests pass
3. ✓ No regression (existing features still work)
4. ✓ Code review checkpoints passed
5. ✓ Security posture improved significantly

---

## Next Steps After Implementation

1. **Deployment:**
   - Deploy backend dengan environment variables updated
   - Deploy frontend
   - Monitor for errors

2. **Documentation:**
   - Update README dengan security improvements
   - Document new .env variables
   - Update deployment guide

3. **Monitoring:**
   - Watch logs for rate limiting triggers
   - Monitor token revocation Redis usage
   - Check file upload rejections

4. **Future Security Work:**
   - Implement Priority 4 (Low) fixes
   - Regular dependency updates
   - Penetration testing
   - Security headers (HSTS, CSP, etc.)
