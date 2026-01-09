# Production Deployment Guide

## Panduan Deploy ke Production

Dokumen ini menjelaskan langkah-langkah untuk deploy sistem ke production dengan konfigurasi keamanan yang benar.

## 1. Konfigurasi Environment Variables

### Development (`.env.development`)
```bash
# Database
DATABASE_URL=mysql+pymysql://root:@localhost:3306/absen_desa

# JWT - GANTI SECRET_KEY ini!
SECRET_KEY=your-development-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# App
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true

# Face Recognition
FACE_RECOGNITION_ENABLED=false
FACE_RECOGNITION_URL=http://localhost:8001
```

### Production (`.env.production`)
```bash
# Database - Gunakan credentials production Anda
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/absen_desa_prod

# JWT - WAJIB GANTI dengan secret key yang kuat!
# Generate dengan: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=GANTI-DENGAN-SECRET-KEY-PRODUCTION-YANG-KUAT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# App - PENTING: Set DEBUG=false di production!
DEBUG=false
CORS_ORIGINS=https://yourdomain.com

# Redis - Gunakan Redis production Anda
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true

# Face Recognition
FACE_RECOGNITION_ENABLED=true
FACE_RECOGNITION_URL=http://localhost:8001
```

## 2. Checklist Keamanan Production

### ⚠️ CRITICAL - Harus Dilakukan!

- [ ] **Generate SECRET_KEY baru** untuk production
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

- [ ] **Set DEBUG=false** di `.env` production

- [ ] **Update CORS_ORIGINS** ke domain production Anda (hapus localhost!)
  ```bash
  CORS_ORIGINS=https://yourdomain.com
  ```

- [ ] **Gunakan HTTPS** - Set `secure=True` di cookie settings (backend/app/routers/auth.py line 56):
  ```python
  response.set_cookie(
      key="access_token",
      value=access_token,
      httponly=True,
      secure=True,  # WAJIB True di production!
      samesite="lax",
      max_age=3600
  )
  ```

- [ ] **Ganti password database** production

- [ ] **Setup firewall** untuk protect port MySQL (3306) dan Redis (6379)

- [ ] **Backup database** secara berkala

### 🔐 Recommended

- [ ] Setup reverse proxy (Nginx/Apache) dengan SSL certificate (Let's Encrypt)

- [ ] Enable rate limiting di Nginx level

- [ ] Setup monitoring (sentry.io, loguru, dll)

- [ ] Setup automated backups

- [ ] Review audit logs secara berkala

## 3. Deploy Backend

### Menggunakan Uvicorn (Development)
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Menggunakan Gunicorn (Production)
```bash
cd backend

# Install gunicorn
pip install gunicorn

# Run dengan 4 worker processes
gunicorn app.main:app \\
  --workers 4 \\
  --worker-class uvicorn.workers.UvicornWorker \\
  --bind 0.0.0.0:8000 \\
  --access-logfile - \\
  --error-logfile -
```

### Menggunakan Systemd Service
Buat file `/etc/systemd/system/absen-desa.service`:

```ini
[Unit]
Description=Absen Desa API
After=network.target mysql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/ABSEN-DESA/backend
Environment="PATH=/path/to/venv/bin"
EnvironmentFile=/path/to/ABSEN-DESA/backend/.env.production
ExecStart=/path/to/venv/bin/gunicorn app.main:app \\
  --workers 4 \\
  --worker-class uvicorn.workers.UvicornWorker \\
  --bind 127.0.0.1:8000 \\
  --access-logfile /var/log/absen-desa/access.log \\
  --error-logfile /var/log/absen-desa/error.log

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable dan start service:
```bash
sudo systemctl enable absen-desa
sudo systemctl start absen-desa
sudo systemctl status absen-desa
```

## 4. Deploy Frontend

### Build Frontend
```bash
cd tap-to-attend
npm run build
```

Output akan ada di `tap-to-attend/dist/`

### Copy ke Backend (All-in-One Deployment)
```bash
# Dari root project
cp -r tap-to-attend/dist ../frontend_dist
```

Backend FastAPI sudah dikonfigurasi untuk serve frontend dari folder `../frontend_dist` (lihat `backend/app/main.py`)

### Atau Deploy Terpisah dengan Nginx
Jika ingin deploy frontend terpisah, gunakan Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /path/to/tap-to-attend/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy ke backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static uploads (dilindungi auth di backend)
    location /api/v1/uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 5. Database Migration

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 6. Initial Setup

### Create Admin Account
Setelah deploy pertama kali, buat admin account:

```bash
# Call setup endpoint (hanya bisa dipanggil sekali!)
curl -X POST http://yourdomain.com/api/v1/auth/setup
```

Response akan berisi username dan password random. **SIMPAN PASSWORD INI!**

```json
{
  "message": "Admin berhasil dibuat. SIMPAN password ini!",
  "username": "admin",
  "password": "randomly-generated-password",
  "warning": "Password ini hanya ditampilkan sekali. Segera ganti password setelah login!"
}
```

### Ganti Password Admin
Login dengan credentials di atas, lalu segera ganti password:

```bash
curl -X PATCH http://yourdomain.com/api/v1/auth/change-password \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "current_password": "old-password",
    "new_password": "NewStrongP@ssw0rd!",
    "confirm_password": "NewStrongP@ssw0rd!"
  }'
```

Password baru harus memenuhi kriteria:
- Minimal 8 karakter
- Minimal 1 huruf kapital
- Minimal 1 huruf kecil
- Minimal 1 angka
- Minimal 1 karakter spesial (!@#$%^&* dll)

## 7. Monitoring dan Logging

### View Logs
```bash
# Systemd service logs
sudo journalctl -u absen-desa -f

# Application logs
tail -f /var/log/absen-desa/error.log
tail -f /var/log/absen-desa/access.log
```

### Check Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy"
}
```

## 8. Backup Strategy

### Database Backup
```bash
# Backup script (simpan sebagai /opt/scripts/backup-absen-desa.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/absen-desa"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u username -p'password' absen_desa_prod > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/ABSEN-DESA/backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Cron Job untuk Automated Backup
```bash
# Edit crontab
crontab -e

# Add this line (backup setiap hari jam 2 pagi)
0 2 * * * /opt/scripts/backup-absen-desa.sh
```

## 9. Troubleshooting

### Issue: "Token has been revoked"
**Cause**: Redis cache down atau cleared
**Solution**: Restart Redis dan re-login

### Issue: "File harus berupa gambar"
**Cause**: Upload file type tidak sesuai atau file rusak
**Solution**: Cek magic bytes validation di backend

### Issue: "CORS policy blocked"
**Cause**: Frontend domain tidak ada di CORS_ORIGINS
**Solution**: Update CORS_ORIGINS di `.env` dan restart backend

### Issue: Face recognition lambat
**Cause**: Embedding cache cold start
**Solution**: Cache akan warm-up otomatis saat startup, tunggu beberapa detik

## 10. Security Updates

### Regular Maintenance
- Update dependencies setiap bulan
- Review audit logs setiap minggu
- Rotate SECRET_KEY setiap 6 bulan (akan logout semua user)
- Update SSL certificates sebelum expire

### Dependencies Update
```bash
# Backend
cd backend
pip list --outdated
pip install -U package-name

# Frontend
cd tap-to-attend
npm outdated
npm update
```

---

**IMPORTANT**: Jangan commit file `.env.production` ke git! Tambahkan ke `.gitignore`:
```
.env
.env.production
.env.local
```
