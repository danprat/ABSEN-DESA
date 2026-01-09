# ✅ Checklist Deploy ke CloudPanel - All-in-One

## 📝 Sebelum Deploy

### Di Lokal (Mac):

- [ ] **Build Frontend**
  ```bash
  cd tap-to-attend
  npm install
  npm run build
  ```
  ✅ Hasil: Folder `tap-to-attend/dist/` berisi file HTML, CSS, JS

- [ ] **Update .env Frontend** (sebelum build!)
  ```env
  VITE_API_BASE_URL=https://yourdomain.com
  VITE_RECOGNITION_MODE=auto
  ```

- [ ] **Update .env Backend**
  ```env
  DATABASE_URL=mysql+pymysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
  SECRET_KEY=ganti-dengan-secret-key-yang-kuat-minimal-32-karakter
  CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  DEBUG=false
  ```

- [ ] **Test Backend Lokal**
  ```bash
  cd backend
  source venv/bin/activate
  uvicorn app.main:app --reload
  ```

- [ ] **Zip Files untuk Upload**
  ```bash
  # Zip backend
  cd backend
  zip -r ../backend.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc"

  # Zip frontend (hasil build)
  cd ../tap-to-attend/dist
  zip -r ../../frontend_dist.zip .
  ```

---

## 🖥️ Setup di CloudPanel

### 1. Buat Python Site

- [ ] Login CloudPanel
- [ ] **Sites** → **Add Site**
- [ ] Pilih: **Python**
- [ ] Domain: `yourdomain.com`
- [ ] Python Version: **3.9** atau lebih tinggi
- [ ] Application Port: **8000**
- [ ] Document Root: `/home/USERNAME/htdocs/yourdomain.com/backend`
- [ ] Klik **Create**

### 2. Buat Database MySQL

- [ ] **Databases** → **Add Database**
- [ ] Database Name: `absen_desa`
- [ ] Username: `absen_user`
- [ ] Klik **Create**
- [ ] **SIMPAN credentials** (username, password, database name)

### 3. Upload Files

**Via SFTP (FileZilla/Cyberduck) atau CloudPanel File Manager:**

- [ ] Upload `backend.zip` ke `/home/USERNAME/htdocs/yourdomain.com/`
- [ ] Upload `frontend_dist.zip` ke `/home/USERNAME/htdocs/yourdomain.com/`
- [ ] Unzip di server:
  ```bash
  cd /home/USERNAME/htdocs/yourdomain.com
  unzip backend.zip -d backend/
  unzip frontend_dist.zip -d frontend_dist/
  ```

**Struktur folder harus seperti ini:**
```
/home/USERNAME/htdocs/yourdomain.com/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
└── frontend_dist/
    ├── assets/
    ├── index.html
    └── ...
```

---

## 📦 Install Dependencies

### SSH ke Server:

```bash
ssh USERNAME@server-ip
cd /home/USERNAME/htdocs/yourdomain.com/backend
```

### Install System Libraries:

- [ ] **Install semua dependencies** (copy-paste dari `SYSTEM_LIBRARIES.md`):
  ```bash
  sudo apt update
  sudo apt install -y build-essential cmake pkg-config git \
      libopenblas-dev liblapack-dev libatlas-base-dev \
      libboost-all-dev libx11-dev libgtk-3-dev \
      libavcodec-dev libavformat-dev libswscale-dev \
      libv4l-dev libxvidcore-dev libx264-dev \
      libjpeg-dev libpng-dev libtiff-dev libwebp-dev \
      libmysqlclient-dev python3-dev python3-pip python3-venv
  ```

### Setup Python Environment:

- [ ] **Buat virtual environment:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

- [ ] **Upgrade pip:**
  ```bash
  pip install --upgrade pip setuptools wheel
  ```

- [ ] **Install dlib** (⏳ 10-30 menit):
  ```bash
  pip install dlib==19.24.0 --no-cache-dir
  ```

- [ ] **Install requirements:**
  ```bash
  pip install -r requirements.txt
  ```

### Setup Folders:

- [ ] **Buat folder uploads:**
  ```bash
  mkdir -p uploads/faces uploads/logos uploads/backgrounds
  chmod -R 755 uploads/
  ```

---

## 🗄️ Setup Database

- [ ] **Update .env dengan credentials MySQL:**
  ```bash
  nano .env
  ```

  Isi:
  ```env
  DATABASE_URL=mysql+pymysql://absen_user:PASSWORD_DARI_CLOUDPANEL@localhost:3306/absen_desa
  ```

- [ ] **Run database migration:**
  ```bash
  source venv/bin/activate

  # Opsi 1: Alembic
  alembic upgrade head

  # Opsi 2: Setup script
  python setup_db.py
  ```

- [ ] **Test koneksi database:**
  ```bash
  python3 -c "from app.database import engine; engine.connect(); print('✅ Database connected!')"
  ```

---

## 🚀 Start Application

### Test Run Manual:

- [ ] **Test aplikasi:**
  ```bash
  cd /home/USERNAME/htdocs/yourdomain.com/backend
  source venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```

- [ ] **Buka browser:** `http://server-ip:8000`
- [ ] **Cek frontend muncul** (bukan JSON API response)
- [ ] **Cek API:** `http://server-ip:8000/api/v1/...`
- [ ] Jika OK, **Ctrl+C** untuk stop

### Setup Systemd Service (Auto-Start):

- [ ] **Buat service file:**
  ```bash
  sudo nano /etc/systemd/system/absen-desa.service
  ```

  Isi (sesuaikan USERNAME):
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

- [ ] **Enable & start service:**
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable absen-desa
  sudo systemctl start absen-desa
  ```

- [ ] **Cek status:**
  ```bash
  sudo systemctl status absen-desa
  ```

  Harus: `Active: active (running)`

- [ ] **Cek logs:**
  ```bash
  sudo journalctl -u absen-desa -f
  ```

---

## 🌐 Setup Nginx (CloudPanel Biasanya Auto)

### Jika Perlu Setup Manual:

- [ ] **Edit Nginx config:**
  ```bash
  sudo nano /etc/nginx/sites-enabled/yourdomain.com.conf
  ```

- [ ] **Tambahkan/update:**
  ```nginx
  # Increase upload size (untuk foto wajah)
  client_max_body_size 50M;

  # Increase timeouts (untuk face recognition)
  proxy_connect_timeout 600s;
  proxy_send_timeout 600s;
  proxy_read_timeout 600s;
  ```

- [ ] **Test & reload Nginx:**
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```

---

## 🔐 Setup SSL (HTTPS)

- [ ] **CloudPanel → Sites → yourdomain.com**
- [ ] **SSL/TLS** tab
- [ ] **Let's Encrypt** → Install
- [ ] **Auto-Renewal**: Enable
- [ ] Test: `https://yourdomain.com`

---

## ✅ Testing Aplikasi

### Test Basic:

- [ ] **Homepage:** `https://yourdomain.com`
- [ ] **API Health:** `https://yourdomain.com/api/v1/...` (cek di docs)
- [ ] **Swagger Docs:** `https://yourdomain.com/docs`

### Test Fitur Utama:

- [ ] **Login admin** (default user jika ada seed data)
- [ ] **Upload foto pegawai** (test upload gambar)
- [ ] **Registrasi wajah** (test face recognition)
- [ ] **Absensi masuk/keluar**
- [ ] **Lihat laporan**
- [ ] **Export PDF/Excel**
- [ ] **Upload logo desa** (test upload)
- [ ] **Upload background kiosk** (test upload)

### Test Upload Files:

- [ ] Browse file di: `https://yourdomain.com/uploads/faces/...`
- [ ] Browse file di: `https://yourdomain.com/uploads/logos/...`
- [ ] Cek permissions folder uploads:
  ```bash
  ls -la /home/USERNAME/htdocs/yourdomain.com/backend/uploads
  ```

---

## 🐛 Troubleshooting

### Backend tidak start:

```bash
# Cek logs
sudo journalctl -u absen-desa -n 50

# Cek port
sudo netstat -tulpn | grep :8000

# Test manual
cd /home/USERNAME/htdocs/yourdomain.com/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend tidak muncul (404):

```bash
# Cek folder frontend_dist ada
ls -la /home/USERNAME/htdocs/yourdomain.com/frontend_dist

# Cek index.html ada
ls /home/USERNAME/htdocs/yourdomain.com/frontend_dist/index.html

# Restart aplikasi
sudo systemctl restart absen-desa
```

### Upload file error (413):

```bash
# Edit Nginx config, tambah:
client_max_body_size 50M;

# Reload Nginx
sudo systemctl reload nginx
```

### Face recognition timeout:

```bash
# Edit Nginx config, tambah:
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring

### Cek Resource Usage:

```bash
# CPU & Memory
htop

# Disk space
df -h

# Folder uploads size
du -sh /home/USERNAME/htdocs/yourdomain.com/backend/uploads
```

### Cek Logs:

```bash
# Application logs
sudo journalctl -u absen-desa -f

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 Selesai!

**Aplikasi sudah live di:** `https://yourdomain.com`

### Next Steps:

- [ ] Setup backup database otomatis
- [ ] Setup monitoring (Uptime, errors)
- [ ] Test dari berbagai device
- [ ] Training user
- [ ] Dokumentasi untuk user

---

## 📞 Kontak Support

Jika ada error saat deployment:
1. Screenshot error message
2. Copy logs: `sudo journalctl -u absen-desa -n 100 > error.log`
3. Cek SYSTEM_LIBRARIES.md dan CLOUDPANEL_DEPLOYMENT_GUIDE.md
