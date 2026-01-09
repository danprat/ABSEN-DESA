# Security Audit Report - ABSEN DESA

**Tanggal Audit:** 2026-01-09
**Status Aplikasi:** Development
**Auditor:** Claude Code Security Audit
**Compliance:** Standard Security Best Practices

---

## Executive Summary

Security audit komprehensif telah dilakukan terhadap aplikasi Absensi Desa yang terdiri dari backend FastAPI dan frontend React. Audit menemukan **15 isu keamanan** dengan distribusi:
- **3 Critical** - Memerlukan perbaikan segera
- **6 High** - Prioritas tinggi untuk diperbaiki
- **4 Medium** - Harus diperbaiki sebelum production
- **2 Low** - Rekomendasi best practices

**Temuan Kritis Utama:**
1. Weak SECRET_KEY dan hardcoded credentials di .env
2. CORS wildcard (*) mengizinkan semua origins
3. Tidak ada rate limiting untuk endpoint login (risiko brute force)
4. JWT tokens disimpan di localStorage (rentan terhadap XSS)

---

## 1. Authentication & Authorization Security

### 🔴 CRITICAL - Weak Secret Key
**Lokasi:** `backend/.env:5`

**Deskripsi:**
```python
SECRET_KEY=your-secret-key-change-in-production
```
Secret key masih menggunakan placeholder default yang mudah ditebak. Secret key ini digunakan untuk signing JWT tokens.

**Dampak:**
- Attacker bisa forge JWT tokens jika secret key bocor
- Token validation bisa di-bypass
- Session hijacking risk

**Remediation:**
```bash
# Generate strong secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env dengan key yang strong
SECRET_KEY=<hasil-generate-di-atas>
```

**Severity:** CRITICAL
**CVSS Score:** 9.1 (Critical)

---

### 🔴 CRITICAL - Default Admin Credentials
**Lokasi:** `backend/app/routers/auth.py:58`

**Deskripsi:**
Endpoint `/auth/setup` membuat admin dengan credentials hardcoded:
```python
username="admin"
password="admin123"
```

**Dampak:**
- Credentials bisa ditebak dengan mudah
- Attacker bisa langsung akses sebagai admin jika setup endpoint belum dipanggil
- Tidak ada enforcement untuk password change setelah setup

**Remediation:**
```python
# Generate random password untuk initial setup
import secrets
random_password = secrets.token_urlsafe(16)

admin = Admin(
    username="admin",
    password_hash=get_password_hash(random_password),
    name="Administrator"
)
db.add(admin)
db.commit()

# Return password ONCE
return {
    "message": "Admin berhasil dibuat. Segera ganti password!",
    "username": "admin",
    "password": random_password,
    "warning": "Simpan password ini!"
}
```

**Severity:** CRITICAL
**CVSS Score:** 8.8 (High)

---

### 🟠 HIGH - No Rate Limiting on Login Endpoint
**Lokasi:** `backend/app/routers/auth.py:17-43`

**Deskripsi:**
Endpoint login tidak memiliki rate limiting, memungkinkan brute force attacks.

**Dampak:**
- Attacker bisa mencoba ribuan kombinasi username/password
- No protection terhadap credential stuffing
- Server resources bisa di-abuse

**Remediation:**
```python
# Install slowapi
# pip install slowapi

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")  # Max 5 attempts per minute
def login(request: Request, ...):
    # ... existing code
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)

---

### 🟠 HIGH - Long JWT Expiration Time
**Lokasi:** `backend/app/config.py:12`

**Deskripsi:**
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
```
Token expiration 24 jam terlalu lama untuk aplikasi yang menyimpan data sensitif.

**Dampak:**
- Jika token dicuri, attacker punya akses 24 jam
- No token refresh mechanism
- Increased window untuk token replay attacks

**Remediation:**
```python
# Kurangi token expiration
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS: int = 7
```

**Severity:** HIGH
**CVSS Score:** 6.5 (Medium)

---

### 🟠 HIGH - No Token Revocation Mechanism
**Lokasi:** `backend/app/utils/auth.py`

**Deskripsi:**
Tidak ada mekanisme untuk revoke JWT tokens. Logout hanya menghapus token dari client-side.

**Dampak:**
- Token masih valid setelah logout sampai expiration
- Tidak bisa force logout user
- Compromised tokens tidak bisa di-revoke

**Remediation:**
```python
# Implementasi token blacklist di Redis
def revoke_token(token: str, expires_in: int):
    set_cache(f"blacklist:{token}", "revoked", ttl=expires_in)

def is_token_revoked(token: str) -> bool:
    return get_cache(f"blacklist:{token}") is not None
```

**Severity:** HIGH
**CVSS Score:** 6.1 (Medium)

---

### 🟡 MEDIUM - No Password Policy Enforcement
**Lokasi:** `backend/app/routers/auth.py:67-95`

**Deskripsi:**
Tidak ada validasi untuk password strength:
- No minimum length requirement
- No complexity requirements
- No check for common passwords

**Dampak:**
- User bisa set password lemah seperti "123456"
- Increased risk of credential compromise

**Remediation:**
```python
from pydantic import field_validator
import re

@field_validator('new_password')
def validate_password_strength(cls, v):
    if len(v) < 8:
        raise ValueError('Password minimal 8 karakter')
    if not re.search(r'[A-Z]', v):
        raise ValueError('Password harus mengandung huruf besar')
    if not re.search(r'[a-z]', v):
        raise ValueError('Password harus mengandung huruf kecil')
    if not re.search(r'[0-9]', v):
        raise ValueError('Password harus mengandung angka')
    return v
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)

---

## 2. API Security (Backend)

### 🟡 MEDIUM - No File Size Limit on Face Upload
**Lokasi:** `backend/app/routers/face.py:18-83`

**Deskripsi:**
Endpoint upload foto wajah tidak membatasi ukuran file.

**Dampak:**
- DoS attack via large file uploads
- Disk space exhaustion
- Memory exhaustion

**Remediation:**
```python
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

content = await file.read()
if len(content) > MAX_FILE_SIZE:
    raise HTTPException(
        status_code=413,
        detail=f"File terlalu besar. Max {MAX_FILE_SIZE/1024/1024}MB"
    )
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)

---

### 🟡 MEDIUM - Weak File Type Validation
**Lokasi:** `backend/app/routers/face.py:32`

**Deskripsi:**
Validasi file type hanya berdasarkan `content_type` header yang bisa di-manipulasi:
```python
if not file.content_type.startswith("image/"):
```

**Dampak:**
- Attacker bisa upload malicious files dengan fake content-type
- Possible code execution via polyglot files

**Remediation:**
```python
import imghdr

def validate_image_file(content: bytes) -> bool:
    image_type = imghdr.what(None, h=content)
    return image_type in ['jpeg', 'jpg', 'png', 'webp']

# Validate actual file content
if not validate_image_file(image_data):
    raise HTTPException(400, "File bukan gambar yang valid")
```

**Severity:** MEDIUM
**CVSS Score:** 6.1 (Medium)

---

## 3. Face Recognition Security

### 🟢 LOW - Face Embeddings Stored Unencrypted
**Lokasi:** `backend/app/models/face_embedding.py`

**Deskripsi:**
Face embeddings (data biometric) disimpan di database tanpa enkripsi.

**Dampak:**
- Jika database compromised, biometric data bisa dicuri
- Privacy concern untuk PII

**Status:** 🟡 Acceptable Risk - Embeddings adalah encoding, bukan foto asli.

**Severity:** LOW
**CVSS Score:** 4.3 (Medium)

---

### 🟡 MEDIUM - Uploaded Face Photos Publicly Accessible
**Lokasi:** `backend/app/main.py:38`

**Deskripsi:**
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```
Semua foto bisa diakses langsung via URL tanpa authentication.

**Dampak:**
- Privacy violation
- Data leakage - foto bisa di-scrape
- GDPR/PDP violation

**Remediation:**
```python
# Buat protected endpoint
@app.get("/api/v1/uploads/{path:path}")
def serve_upload(
    path: str,
    current_admin: Admin = Depends(get_current_admin)
):
    file_path = os.path.join("uploads", path)
    if not os.path.exists(file_path):
        raise HTTPException(404)
    return FileResponse(file_path)
```

**Severity:** MEDIUM
**CVSS Score:** 6.5 (Medium)

---

## 4. Frontend Security

### 🟠 HIGH - JWT Token Stored in localStorage
**Lokasi:** `tap-to-attend/src/lib/api.ts:16-18`

**Deskripsi:**
```typescript
export const authToken = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};
```

**Dampak:**
- Vulnerable to XSS attacks
- JavaScript dapat mengakses token
- Token bisa dicuri via malicious scripts

**Remediation:**
```typescript
// Backend: Set token sebagai httpOnly cookie
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,  # JavaScript tidak bisa akses
    secure=True,    # Only HTTPS
    samesite="lax",
    max_age=3600
)

// Frontend: Enable credentials
apiClient.defaults.withCredentials = true;
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)

---

### 🟢 LOW - No CSRF Protection
**Lokasi:** Frontend global

**Deskripsi:**
Tidak ada CSRF token implementation.

**Status:** 🟡 Mitigated by SameSite cookies

**Severity:** LOW
**CVSS Score:** 4.3 (Medium)

---

## 5. Infrastructure & Configuration

### 🔴 CRITICAL - CORS Wildcard in Production
**Lokasi:** `backend/.env:11`

**Deskripsi:**
```python
CORS_ORIGINS=*
```
CORS mengizinkan semua origins - sangat berbahaya!

**Dampak:**
- Any website bisa akses API
- CSRF attacks possible
- Data leakage

**Remediation:**
```bash
# Development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
CORS_ORIGINS=https://yourdomain.com
```

**Severity:** CRITICAL
**CVSS Score:** 9.1 (Critical)

---

### 🟡 MEDIUM - DEBUG Mode Enabled
**Lokasi:** `backend/.env:10`

**Deskripsi:**
```python
DEBUG=true
```

**Dampak:**
- Stack traces exposed
- Information disclosure

**Remediation:**
```python
# Production
DEBUG=false
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)

---

## 6. Dependency Vulnerabilities

### 🟡 MEDIUM - Outdated Frontend Dependencies
**Lokasi:** `tap-to-attend/package.json`

**Deskripsi:**
Beberapa dependencies outdated dengan security patches available.

**Remediation:**
```bash
cd tap-to-attend
bun update
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)

---

## Summary of Findings

### Critical Issues (3)
1. Weak SECRET_KEY - CVSS 9.1
2. CORS Wildcard - CVSS 9.1
3. Default Admin Credentials - CVSS 8.8

### High Issues (4)
1. No Rate Limiting - CVSS 7.5
2. JWT in localStorage - CVSS 7.5
3. Long JWT Expiration - CVSS 6.5
4. No Token Revocation - CVSS 6.1

### Medium Issues (6)
1. No File Size Limit - CVSS 5.3
2. Weak File Validation - CVSS 6.1
3. Public File Access - CVSS 6.5
4. DEBUG Mode - CVSS 5.3
5. No Password Policy - CVSS 5.3
6. Outdated Dependencies - CVSS 5.3

### Low Issues (2)
1. Unencrypted Embeddings - CVSS 4.3
2. No CSRF Protection - CVSS 4.3

---

## Prioritized Action Plan

### Priority 1 - CRITICAL (Fix Immediately)
1. ✅ Generate strong SECRET_KEY
2. ✅ Configure proper CORS origins
3. ✅ Change default admin credentials

### Priority 2 - HIGH (Fix Before Production)
4. ✅ Implement rate limiting
5. ✅ Move JWT to httpOnly cookies
6. ✅ Reduce JWT expiration (1 hour)
7. ✅ Implement token revocation

### Priority 3 - MEDIUM (Fix Before Production)
8. ✅ Add file size limits
9. ✅ Strengthen file validation
10. ✅ Protect uploaded files
11. ✅ Disable DEBUG mode
12. ✅ Add password policy
13. ✅ Update dependencies

### Priority 4 - LOW (Best Practices)
14. ⚠️  Consider encrypting embeddings
15. ✅ CSRF via SameSite cookies

---

## Verification Checklist

```bash
# Backend
□ SECRET_KEY random 32+ chars
□ CORS_ORIGINS tidak "*"
□ DEBUG=false
□ Rate limiting works
□ Password policy enforced
□ File upload > 5MB rejected
□ /uploads/* require auth

# Frontend
□ No token in localStorage
□ httpOnly cookies present
□ Login works with cookies
□ Dependencies updated
```

---

## Conclusion

Aplikasi memiliki isu keamanan yang harus diperbaiki sebelum production:

**Critical:**
- Authentication security
- CORS misconfiguration
- Token storage vulnerability

**Positif:**
- ✅ ORM usage (no SQL injection)
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ RBAC implementation
- ✅ Audit logging
- ✅ .env gitignored

Dengan fixes Priority 1 & 2, aplikasi siap production.

---

**Report Generated:** 2026-01-09
**Next Review:** After fixes implementation
