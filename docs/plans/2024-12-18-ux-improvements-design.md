# Desain Perbaikan UX Sistem Absensi (2025-12-18)

## Ringkasan Masalah

1. Konfirmasi kehadiran muncul lagi setelah sudah absen
2. Halaman absensi memerlukan login admin untuk akses settings
3. Belum ada ganti password admin di setting dashboard
4. Setting dashboard belum ada upload logo desa
5. Nama desa di admin panel belum ikut inputan setting
6. Belum ada pengaturan jam kerja per hari

---

## Solusi

### 1. UX Absensi (Check-in & Checkout)

**Flow baru:**

| Status Pegawai | Tampilan |
|----------------|----------|
| Belum absen | Dialog konfirmasi "Hadir" + tombol konfirmasi |
| Sudah check-in, belum checkout | Dialog konfirmasi "Pulang" + tombol checkout |
| Sudah lengkap (check-in & checkout) | Info "Sudah absen lengkap hari ini" tanpa tombol |

**Perubahan Backend:**
- Update `POST /api/v1/attendance/recognize` untuk return status absensi hari ini
- Update `POST /api/v1/attendance/confirm` untuk support checkout

**Perubahan Frontend:**
- Update `AttendanceResult` component untuk tampilkan UI sesuai status

---

### 2. Endpoint Publik Settings

**Endpoint baru:** `GET /api/v1/public/settings`

**Response:**
```json
{
  "village_name": "Desa Sukamaju",
  "officer_name": "Pak Budi",
  "logo_url": "/uploads/logo.png",
  "today_schedule": {
    "is_workday": true,
    "check_in_start": "07:00",
    "check_in_end": "08:00",
    "check_out_start": "16:00"
  }
}
```

---

### 3. Ganti Password Admin

**Endpoint baru:** `PATCH /api/v1/admin/change-password`

**Request:**
```json
{
  "current_password": "xxx",
  "new_password": "xxx",
  "confirm_password": "xxx"
}
```

**Validasi:**
- Password lama harus benar
- Password baru minimal 8 karakter
- Konfirmasi harus sama dengan password baru

**UI:**
- Section "Keamanan" di halaman Pengaturan
- Form dengan 3 input field

---

### 4. Upload Logo Desa

**Endpoint baru:** `POST /api/v1/admin/settings/logo`
- Multipart form upload
- Simpan ke folder `uploads/`
- Update `logo_url` di WorkSettings

**Endpoint hapus:** `DELETE /api/v1/admin/settings/logo`

**UI:**
- Field upload di section "Informasi Organisasi"
- Preview logo yang sudah diupload
- Tombol hapus logo

---

### 5. Nama Desa di Sidebar Admin

**Perubahan:**
- Sidebar admin fetch settings saat mount
- Tampilkan `village_name` dan `logo_url` di header sidebar

---

### 6. Jam Kerja Per Hari

**Model baru:** `DailyWorkSchedule`

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| day_of_week | Integer | 0=Senin, 1=Selasa, ..., 6=Minggu |
| is_workday | Boolean | True=hari kerja, False=libur |
| check_in_start | Time | Jam mulai absen masuk |
| check_in_end | Time | Jam akhir absen masuk |
| check_out_start | Time | Jam pulang |

**Default:**
- Senin-Kamis: 07:00-08:00 masuk, 16:00 pulang
- Jumat: 07:00-08:00 masuk, 11:30 pulang
- Sabtu-Minggu: is_workday = false

**Endpoint baru:**
- `GET /api/v1/admin/settings/schedules` - List semua jadwal
- `PATCH /api/v1/admin/settings/schedules` - Update jadwal (batch)

**UI:**
- Tabel 7 hari dengan toggle "Hari Kerja"
- Input jam masuk & pulang per hari
- Row disabled jika hari libur

**Logic Absensi:**
- Cek jadwal hari ini sebelum proses absensi
- Jika hari libur → tolak dengan pesan "Hari ini libur"
- Gunakan jam kerja hari tersebut untuk cek terlambat
