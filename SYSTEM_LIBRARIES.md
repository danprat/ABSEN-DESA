# 📦 System Libraries yang Diperlukan di CloudPanel

## 📋 Ringkasan

Aplikasi ini menggunakan **Face Recognition** yang memerlukan library `dlib` dan OpenCV. Berikut adalah semua system libraries yang harus diinstall di server CloudPanel sebelum install Python packages.

---

## 🖥️ Install Semua System Libraries (Ubuntu/Debian)

### Copy-Paste Command Ini di SSH:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install build tools (WAJIB untuk compile dlib)
sudo apt install -y build-essential cmake pkg-config git

# Install BLAS/LAPACK (untuk operasi matematika numpy/scipy)
sudo apt install -y libopenblas-dev liblapack-dev libatlas-base-dev

# Install Boost libraries (diperlukan dlib)
sudo apt install -y libboost-all-dev

# Install X11 dan GTK (diperlukan OpenCV)
sudo apt install -y libx11-dev libgtk-3-dev

# Install video/image processing libraries (OpenCV dependencies)
sudo apt install -y \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev

# Install image format libraries
sudo apt install -y \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libwebp-dev

# Install MySQL client libraries (untuk PyMySQL)
sudo apt install -y libmysqlclient-dev

# Install Python development files
sudo apt install -y python3-dev python3-pip python3-venv

# Install other utilities
sudo apt install -y wget curl unzip
```

---

## ⚙️ Urutan Install Dependencies

### 1. System Libraries (di atas) ✓

### 2. Python Virtual Environment

```bash
cd /home/USERNAME/htdocs/yourdomain.com/backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Upgrade pip, setuptools, wheel

```bash
pip install --upgrade pip setuptools wheel
```

### 4. Install dlib DULU (yang paling lama!)

```bash
# Install dlib secara terpisah (compile bisa 10-30 menit!)
pip install dlib==19.24.0 --no-cache-dir
```

**⚠️ PERHATIAN:**
- Compile `dlib` memakan waktu **10-30 menit** tergantung CPU server
- Butuh minimal **2GB RAM** saat compile
- Jika server RAM kecil (<2GB), tambahkan SWAP dulu (lihat bawah)

### 5. Install requirements.txt

```bash
pip install -r requirements.txt
```

---

## 💾 Tambah SWAP (Jika RAM Server < 2GB)

```bash
# Buat SWAP file 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verifikasi SWAP aktif
free -h

# (Optional) Permanentkan SWAP
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📊 Cek Instalasi Berhasil

### 1. Cek Python packages terinstall

```bash
source venv/bin/activate
pip list | grep -E "dlib|face-recognition|opencv|numpy|scipy"
```

**Output yang diharapkan:**
```
dlib                      19.24.0
face-recognition          1.3.0
opencv-python-headless    4.12.0.88
numpy                     2.0.2
scipy                     1.13.1
```

### 2. Test import Python

```bash
python3 -c "import dlib; print('dlib:', dlib.__version__)"
python3 -c "import face_recognition; print('face_recognition: OK')"
python3 -c "import cv2; print('OpenCV:', cv2.__version__)"
```

**Output yang diharapkan:**
```
dlib: 19.24.0
face_recognition: OK
OpenCV: 4.12.0.88
```

---

## 🐛 Troubleshooting

### ❌ Error: `dlib` gagal compile

**Error message:**
```
ERROR: Could not build wheels for dlib
```

**Solusi:**

1. **Pastikan CMake terinstall:**
   ```bash
   cmake --version
   # Jika error, install: sudo apt install cmake
   ```

2. **Pastikan g++ terinstall:**
   ```bash
   g++ --version
   # Jika error, install: sudo apt install build-essential
   ```

3. **Coba install dengan flag khusus:**
   ```bash
   pip install dlib==19.24.0 --no-cache-dir --verbose
   ```

4. **Tambah SWAP jika RAM kurang** (lihat cara di atas)

---

### ❌ Error: `face_recognition` import error

**Error message:**
```
ImportError: libopenblas.so.0: cannot open shared object file
```

**Solusi:**
```bash
sudo apt install -y libopenblas-dev
```

---

### ❌ Error: OpenCV import error

**Error message:**
```
ImportError: libGL.so.1: cannot open shared object file
```

**Solusi:**
```bash
sudo apt install -y libgl1-mesa-glx
```

---

### ❌ Error: MySQL connection error

**Error message:**
```
ModuleNotFoundError: No module named 'MySQLdb'
```

**Solusi:**
```bash
sudo apt install -y libmysqlclient-dev
pip install pymysql
```

---

## 📝 Daftar Lengkap Package Requirements

### System Packages (via apt):
- build-essential
- cmake
- pkg-config
- git
- libopenblas-dev
- liblapack-dev
- libatlas-base-dev
- libboost-all-dev
- libx11-dev
- libgtk-3-dev
- libavcodec-dev
- libavformat-dev
- libswscale-dev
- libv4l-dev
- libxvidcore-dev
- libx264-dev
- libjpeg-dev
- libpng-dev
- libtiff-dev
- libwebp-dev
- libmysqlclient-dev
- python3-dev
- python3-pip
- python3-venv

### Python Packages (via pip):
Lihat file `requirements.txt`

---

## 🚀 Quick Install Script

Buat file `install_dependencies.sh`:

```bash
#!/bin/bash

echo "🚀 Installing system dependencies for Sistem Absensi Desa..."

# Update
sudo apt update

# Install all system libraries
sudo apt install -y \
    build-essential cmake pkg-config git \
    libopenblas-dev liblapack-dev libatlas-base-dev \
    libboost-all-dev \
    libx11-dev libgtk-3-dev \
    libavcodec-dev libavformat-dev libswscale-dev \
    libv4l-dev libxvidcore-dev libx264-dev \
    libjpeg-dev libpng-dev libtiff-dev libwebp-dev \
    libmysqlclient-dev \
    python3-dev python3-pip python3-venv \
    wget curl unzip

echo "✅ System dependencies installed!"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

echo "📦 Installing Python packages..."

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dlib first (takes time!)
echo "⏳ Installing dlib (this may take 10-30 minutes)..."
pip install dlib==19.24.0 --no-cache-dir

# Install other requirements
pip install -r requirements.txt

echo "🎉 All dependencies installed successfully!"
echo "✅ Run: source venv/bin/activate"
```

Jalankan:
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

---

## ⚡ Estimasi Waktu Install

| Package | Waktu Estimasi | Catatan |
|---------|----------------|---------|
| System libraries | 2-5 menit | Tergantung koneksi internet |
| pip upgrade | 30 detik | |
| dlib | **10-30 menit** | Paling lama! Tergantung CPU |
| face_recognition | 1-2 menit | |
| opencv-python | 2-3 menit | |
| Other packages | 2-3 menit | |
| **TOTAL** | **15-45 menit** | |

---

## 💡 Tips

1. **Gunakan `screen` atau `tmux`** saat install di SSH (biar tidak terputus):
   ```bash
   screen -S install
   ./install_dependencies.sh
   # Ctrl+A, D untuk detach
   # screen -r install untuk attach kembali
   ```

2. **Monitor resource usage** saat compile dlib:
   ```bash
   htop
   ```

3. **Simpan log** saat install:
   ```bash
   ./install_dependencies.sh 2>&1 | tee install.log
   ```

---

**🎯 Semua library ini WAJIB terinstall sebelum aplikasi bisa jalan!**
