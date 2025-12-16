# Backend Design - Sistem Absensi Desa

**Tanggal:** 2025-12-16
**Status:** Approved

---

## Overview

Backend untuk sistem absensi pegawai desa berbasis face recognition. Digunakan bersama frontend React yang sudah ada di `tap-to-attend/`.

## Keputusan Arsitektur

| Aspek | Keputusan |
|-------|-----------|
| Check-in/Check-out | Otomatis berdasarkan waktu |
| Admin | Single admin (tanpa multi-user) |
| Hari Libur | Input manual per tanggal |
| Registrasi Perangkat | Tidak diperlukan |
| Face Recognition | InsightFace lokal (VPS nanti, mock untuk dev lokal) |
| Database | MySQL (XAMPP lokal) |

---

## Arsitektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   FastAPI       │────▶│     MySQL       │
│  (tap-to-attend)│     │   Backend       │     │   (XAMPP)       │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Face Recognition│
                        │  (VPS - nanti)   │
                        └─────────────────┘
```

## Struktur Project

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings & environment
│   ├── database.py          # MySQL connection
│   ├── models/              # SQLAlchemy models
│   │   ├── employee.py
│   │   ├── attendance.py
│   │   ├── admin.py
│   │   └── holiday.py
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   │   ├── auth.py
│   │   ├── employees.py
│   │   ├── attendance.py
│   │   ├── reports.py
│   │   └── settings.py
│   ├── services/            # Business logic
│   │   ├── face_recognition.py
│   │   └── attendance.py
│   └── utils/               # Helpers
├── requirements.txt
└── .env
```

**Stack:**
- FastAPI + Uvicorn
- SQLAlchemy ORM + Alembic migrations
- JWT untuk auth admin (python-jose)
- InsightFace untuk face recognition (nanti di VPS)
- Pillow untuk image processing

---

## Database Schema

```sql
-- Admin (single user)
admins
├── id (PK)
├── username (unique)
├── password_hash
├── name
├── created_at
└── updated_at

-- Pegawai
employees
├── id (PK)
├── nip (unique, nullable)
├── name
├── position
├── phone (nullable)
├── email (nullable)
├── photo_url (nullable)
├── is_active (default: true)
├── created_at
└── updated_at

-- Face Embeddings (multi foto per pegawai)
face_embeddings
├── id (PK)
├── employee_id (FK → employees)
├── embedding (BLOB - vector 512 float)
├── photo_url
├── created_at
└── is_primary (default: false)

-- Attendance Logs
attendance_logs
├── id (PK)
├── employee_id (FK → employees)
├── date (tanggal)
├── check_in_at (datetime, nullable)
├── check_out_at (datetime, nullable)
├── status (enum: hadir, terlambat, izin, sakit, alfa)
├── confidence_score (float, nullable)
├── corrected_by (nullable)
├── correction_notes (nullable)
├── created_at
└── updated_at

-- Work Settings (single row config)
work_settings
├── id (PK)
├── village_name
├── officer_name
├── logo_url (nullable)
├── check_in_start (time: 07:00)
├── check_in_end (time: 08:00)
├── late_threshold_minutes (int: 15)
├── check_out_start (time: 16:00)
├── min_work_hours (float: 8)
└── updated_at

-- Holidays
holidays
├── id (PK)
├── date (unique)
├── name
└── created_at

-- Audit Logs
audit_logs
├── id (PK)
├── action (enum: create, update, delete, correct)
├── entity_type (employee, attendance, settings)
├── entity_id
├── description
├── performed_by
├── details (JSON, nullable)
└── created_at
```

---

## API Endpoints

### Auth (1 endpoint)
```
POST /api/v1/auth/login     → Login admin, return JWT
```

### Employees (5 endpoints)
```
GET    /api/v1/employees              → List pegawai + search
POST   /api/v1/employees              → Tambah pegawai
GET    /api/v1/employees/{id}         → Detail pegawai
PATCH  /api/v1/employees/{id}         → Update pegawai
DELETE /api/v1/employees/{id}         → Soft delete (is_active=false)
```

### Face Enrollment (3 endpoints)
```
POST   /api/v1/employees/{id}/face    → Upload & simpan embedding
GET    /api/v1/employees/{id}/face    → List foto wajah
DELETE /api/v1/employees/{id}/face/{face_id} → Hapus foto
```

### Attendance - Tablet (2 endpoints)
```
POST   /api/v1/attendance/recognize   → Kirim foto, return pegawai + catat absen
GET    /api/v1/attendance/today       → List absensi hari ini (untuk display tablet)
```

### Attendance - Admin (3 endpoints)
```
GET    /api/v1/admin/attendance           → Riwayat dengan filter
PATCH  /api/v1/admin/attendance/{id}      → Koreksi manual
GET    /api/v1/admin/attendance/today     → Absensi harian + summary
```

### Reports (2 endpoints)
```
GET    /api/v1/admin/reports/monthly      → Rekap bulanan
GET    /api/v1/admin/reports/export       → Export CSV
```

### Settings (5 endpoints)
```
GET    /api/v1/admin/settings             → Ambil config
PATCH  /api/v1/admin/settings             → Update config
GET    /api/v1/admin/settings/holidays    → List hari libur
POST   /api/v1/admin/settings/holidays    → Tambah hari libur
DELETE /api/v1/admin/settings/holidays/{id} → Hapus
```

### Audit Logs (1 endpoint)
```
GET    /api/v1/admin/audit-logs           → List aktivitas
```

**Total: 22 endpoints**

---

## Flow Absensi

```
1. Terima foto dari tablet (base64/multipart)

2. Deteksi wajah dengan InsightFace (atau mock untuk dev lokal)
   ├── Tidak ada wajah → return error "Wajah tidak terdeteksi"
   └── Ada wajah → lanjut

3. Generate embedding & bandingkan dengan database
   ├── Tidak cocok (similarity < 0.6) → return error "Wajah tidak dikenali"
   └── Cocok → dapat employee_id + confidence_score

4. Cek apakah hari ini hari libur atau bukan hari kerja
   └── Ya → return error "Hari libur"

5. Cek waktu sekarang untuk tentukan mode:
   │
   ├── 06:00 - 12:00 (pagi) → MODE CHECK-IN
   │   ├── Sudah ada check_in hari ini? → return "Sudah absen masuk"
   │   └── Belum → simpan check_in_at
   │       ├── Jam <= check_in_end + threshold → status: "hadir"
   │       └── Jam > threshold → status: "terlambat"
   │
   └── 12:00 - 22:00 (sore) → MODE CHECK-OUT
       ├── Tidak ada check_in hari ini? → return "Belum absen masuk"
       └── Sudah check_in → simpan check_out_at

6. Catat ke audit_log

7. Return: {
     employee: { id, name, position, photo },
     attendance: { status, check_in_at, check_out_at },
     message: "Selamat datang, Pak Budi" / "Sampai jumpa besok"
   }
```

### Job Harian (Cron/Scheduler)
```
Jam 23:59 setiap hari:
- Pegawai aktif yang tidak ada record hari ini → buat record status: "alfa"
```

---

## Perubahan Frontend

### Halaman baru:
```
/login                    → Form login admin
/admin/pengaturan/libur   → Kelola hari libur (atau tab di pengaturan)
```

### Integrasi API:

| File | Perubahan |
|------|-----------|
| `src/data/mockData.ts` | Hapus, ganti dengan API calls |
| `src/lib/api.ts` | **Baru** - Axios/fetch wrapper + JWT handling |
| `src/hooks/useAuth.ts` | **Baru** - Auth context + protected routes |
| `src/pages/admin/*.tsx` | Ganti useState → React Query mutations |
| `src/components/CameraView.tsx` | Kirim foto ke `/attendance/recognize` |

### Auth Flow:
```
1. Buka /admin/* tanpa JWT → redirect ke /login
2. Login sukses → simpan JWT di localStorage
3. Setiap request API → attach JWT di header
4. JWT expired → redirect ke /login
```

---

## Yang TIDAK Dibangun

- Multi admin/operator dengan role
- Registrasi perangkat/tablet
- Endpoint identify terpisah
- Kalender libur nasional otomatis

---

## Development Notes

- Face recognition di-mock untuk development lokal
- Integrasi face recognition ke VPS dilakukan setelah backend core selesai
- Database development menggunakan MySQL via XAMPP
