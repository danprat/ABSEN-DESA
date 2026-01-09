# 📘 Panduan Deploy ke CloudPanel - Sistem Absensi Desa

## 🎯 Arsitektur Deployment (All-in-One)

```
yourdomain.com → Backend Python (FastAPI)
                 └── Serve Frontend (Static Files)
                 └── API Endpoints: /api/v1/*
                 └── Static Assets: /assets/*
                 └── Uploads: /uploads/*
```

---

## 📋 Persiapan Sebelum Deploy

### 1. Build Frontend di Lokal

```bash
cd tap-to-attend
npm install
npm run build
```

Hasil build akan ada di folder `tap-to-attend/dist/`

### 2. Update Environment Variables

**Backend `.env`** (sesuaikan dengan CloudPanel):
```env
# Database (sesuaikan dengan MySQL CloudPanel)
DATABASE_URL=mysql+pymysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App
DEBUG=false
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Face Recognition
FACE_RECOGNITION_ENABLED=true
FACE_RECOGNITION_URL=http://localhost:8001
```

**Frontend `.env`** (untuk build):
```env
VITE_API_BASE_URL=https://yourdomain.com
VITE_RECOGNITION_MODE=auto
```

---

## 🖥️ Setup di CloudPanel

### Step 1: Buat Python Site

1. Login ke CloudPanel
2. **Sites** → **Add Site**
3. Pilih **Python**
4. Isi form:
   - **Domain Name**: `yourdomain.com`
   - **Python Version**: `3.9` atau lebih tinggi
   - **Application Port**: `8000` (default FastAPI)
   - **Document Root**: `/home/USERNAME/htdocs/yourdomain.com/backend`

### Step 2: Upload Files

Upload ke server via SFTP/SSH:

```
/home/USERNAME/htdocs/yourdomain.com/
├── backend/                    # Semua file backend
│   ├── app/
│   ├── alembic/
│   ├── uploads/               # Folder untuk uploads
│   │   ├── faces/
│   │   ├── logos/
│   │   └── backgrounds/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env
└── frontend_dist/             # Hasil build frontend (dari tap-to-attend/dist)
    ├── assets/
    ├── index.html
    └── ...
```

### Step 3: Buat Database MySQL

1. **Databases** → **Add Database**
2. Catat credentials:
   - Database Name: `absen_desa`
   - Username: `absen_user`
   - Password: (auto-generated)

---

## 📦 Install Dependencies di Server

### 1. SSH ke Server

```bash
ssh USERNAME@your-server-ip
cd /home/USERNAME/htdocs/yourdomain.com/backend
```

### 2. Install System Libraries (PENTING!)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build tools
sudo apt install -y build-essential cmake pkg-config

# Install image processing libraries
sudo apt install -y libopenblas-dev liblapack-dev
sudo apt install -y libx11-dev libgtk-3-dev

# Install OpenCV dependencies
sudo apt install -y libavcodec-dev libavformat-dev libswscale-dev
sudo apt install -y libv4l-dev libxvidcore-dev libx264-dev
sudo apt install -y libjpeg-dev libpng-dev libtiff-dev

# Install face_recognition dependencies (dlib)
sudo apt install -y libboost-all-dev

# Install MySQL client libraries
sudo apt install -y libmysqlclient-dev

# Install Python dev
sudo apt install -y python3-dev python3-pip python3-venv
```

### 3. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Python Packages

```bash
# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dlib (face_recognition dependency) - ini yang lama!
pip install dlib==19.24.0

# Install semua dependencies
pip install -r requirements.txt
```

**⚠️ CATATAN PENTING untuk `dlib`:**
- Compile dlib memakan waktu 10-30 menit
- Butuh minimal 2GB RAM
- Jika server RAM kecil, tambah SWAP:

```bash
# Buat SWAP file 2GB (jika RAM kurang)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 5. Setup Folder Permissions

```bash
# Buat folder uploads jika belum ada
mkdir -p uploads/faces uploads/logos uploads/backgrounds

# Set permissions
chmod -R 755 uploads/
chown -R USERNAME:USERNAME uploads/
```

---

## 🔧 Konfigurasi Backend untuk Serve Frontend

Edit file `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ... (import routers dll)

app = FastAPI(
    title="Sistem Absensi Desa",
    description="Backend API untuk sistem absensi pegawai desa",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_config.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads folder (untuk foto wajah, logo, dll)
os.makedirs("uploads/faces", exist_ok=True)
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/backgrounds", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API Routes
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
# ... (semua routers lainnya)

# Mount frontend static files (SETELAH semua API routes!)
FRONTEND_PATH = "../frontend_dist"
if os.path.exists(FRONTEND_PATH):
    # Serve static assets (CSS, JS, images)
    app.mount("/assets", StaticFiles(directory=f"{FRONTEND_PATH}/assets"), name="assets")

    # Serve index.html untuk semua routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Jika request ke API, skip (sudah di-handle routes di atas)
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return {"detail": "Not Found"}

        # Serve file jika ada
        file_path = f"{FRONTEND_PATH}/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        # Default ke index.html (untuk SPA routing)
        return FileResponse(f"{FRONTEND_PATH}/index.html")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
```

---

## 🚀 Run Migration & Start Application

### 1. Run Database Migration

```bash
cd /home/USERNAME/htdocs/yourdomain.com/backend
source venv/bin/activate

# Run migration
alembic upgrade head

# Atau buat tables manual
python setup_db.py
```

### 2. Test Aplikasi

```bash
# Test run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Buka browser: `http://your-server-ip:8000`

### 3. Setup Systemd Service (Production)

Buat file `/etc/systemd/system/absen-desa.service`:

```ini
[Unit]
Description=Sistem Absensi Desa - FastAPI Application
After=network.target mysql.service

[Service]
Type=simple
User=USERNAME
WorkingDirectory=/home/USERNAME/htdocs/yourdomain.com/backend
Environment="PATH=/home/USERNAME/htdocs/yourdomain.com/backend/venv/bin"
ExecStart=/home/USERNAME/htdocs/yourdomain.com/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable & start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable absen-desa
sudo systemctl start absen-desa
sudo systemctl status absen-desa
```

---

## 🔐 Setup Nginx Reverse Proxy (CloudPanel Auto)

CloudPanel biasanya auto-setup Nginx. Tapi jika perlu manual, edit:

`/etc/nginx/sites-enabled/yourdomain.com.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (CloudPanel auto-manage)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Client max body size (untuk upload foto)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts untuk face recognition
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

Test & reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Checklist Sebelum Live

- [ ] Database MySQL sudah dibuat
- [ ] File `.env` sudah diupdate (DATABASE_URL, SECRET_KEY, CORS_ORIGINS)
- [ ] Frontend sudah di-build (`npm run build`)
- [ ] Semua system libraries sudah terinstall
- [ ] Python dependencies sudah terinstall (terutama `dlib` dan `face_recognition`)
- [ ] Folder `uploads/` sudah dibuat dengan permissions yang benar
- [ ] Migration database sudah dijalankan
- [ ] Service systemd sudah running
- [ ] Nginx config sudah benar
- [ ] SSL certificate sudah aktif (HTTPS)
- [ ] Test upload foto wajah ✓
- [ ] Test absensi ✓
- [ ] Test export PDF/Excel ✓

---

## 🐛 Troubleshooting

### 1. Error: `dlib` gagal install

**Solusi:**
```bash
# Install cmake dulu
sudo apt install cmake

# Install dengan flag khusus
pip install dlib==19.24.0 --no-cache-dir
```

### 2. Error: Upload file gagal (413 Request Entity Too Large)

**Solusi:** Edit Nginx config, tambah:
```nginx
client_max_body_size 50M;
```

### 3. Error: Face recognition timeout

**Solusi:** Increase proxy timeouts di Nginx:
```nginx
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;
```

### 4. Error: MySQL connection refused

**Solusi:** Cek DATABASE_URL di `.env`:
```env
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/dbname
```

### 5. Frontend tidak load (404)

**Solusi:**
- Pastikan folder `frontend_dist` ada
- Check path di `main.py`: `FRONTEND_PATH = "../frontend_dist"`
- Pastikan mounting order benar (API routes dulu, baru frontend)

---

## 📊 Monitoring & Logs

### Cek logs aplikasi:
```bash
sudo journalctl -u absen-desa -f
```

### Cek logs Nginx:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Cek resource usage:
```bash
htop
df -h
free -h
```

---

## 🔄 Update Aplikasi (After Deploy)

```bash
# SSH ke server
cd /home/USERNAME/htdocs/yourdomain.com/backend
source venv/bin/activate

# Pull latest code (jika pakai git)
git pull

# Install new dependencies (jika ada)
pip install -r requirements.txt

# Run migration (jika ada)
alembic upgrade head

# Restart service
sudo systemctl restart absen-desa
```

**Untuk update frontend:**
```bash
# Di lokal, build ulang
cd tap-to-attend
npm run build

# Upload folder dist/ ke server (overwrite frontend_dist/)
```

---

## 💡 Tips Optimasi Production

1. **Gunakan Gunicorn** dengan worker process:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

2. **Enable Gzip** di Nginx untuk static files

3. **Setup Backup Database** otomatis:
   ```bash
   # Crontab daily backup
   0 2 * * * mysqldump -u user -p'password' absen_desa | gzip > /backup/absen_desa_$(date +\%Y\%m\%d).sql.gz
   ```

4. **Monitor disk space** untuk folder `uploads/`

5. **Setup logrotate** untuk application logs

---

## 📞 Support

Jika ada masalah saat deployment, cek:
- CloudPanel documentation
- FastAPI deployment guide
- Nginx configuration guide

---

**🎉 Selamat! Aplikasi Absensi Desa siap production!**
