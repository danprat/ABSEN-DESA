# Dokumentasi Lengkap - Sistem Absensi Digital Desa (ABSEN DESA)

**Versi Dokumen:** 1.0  
**Tanggal:** 24 Desember 2024  
**Status:** Aktif

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Latar Belakang & Permasalahan](#2-latar-belakang--permasalahan)
3. [Tujuan](#3-tujuan)
4. [Ruang Lingkup](#4-ruang-lingkup)
5. [Product Requirements Document (PRD)](#5-product-requirements-document-prd)
6. [Business Flow](#6-business-flow)
7. [User Stories](#7-user-stories)
8. [Arsitektur Sistem](#8-arsitektur-sistem)
9. [Spesifikasi Teknis](#9-spesifikasi-teknis)

---

## 1. Pendahuluan

### 1.1 Gambaran Umum

**ABSEN DESA** adalah sistem presensi digital berbasis **face recognition** (pengenalan wajah) yang dirancang khusus untuk memenuhi kebutuhan pencatatan kehadiran pegawai kantor desa. Sistem ini menggantikan metode absensi manual konvensional dengan teknologi modern yang lebih akurat, efisien, dan dapat dipertanggungjawabkan.

### 1.2 Definisi & Istilah

| Istilah | Definisi |
|---------|----------|
| **Face Recognition** | Teknologi pengenalan wajah menggunakan AI/Machine Learning |
| **Check-in** | Proses absensi masuk kerja |
| **Check-out** | Proses absensi pulang kerja |
| **Embedding** | Data vector numerik hasil ekstraksi fitur wajah |
| **InsightFace** | Library open-source untuk face recognition |
| **JWT** | JSON Web Token untuk autentikasi |
| **Confidence Score** | Tingkat kepercayaan hasil pencocokan wajah (0-100%) |

---

## 2. Latar Belakang & Permasalahan

### 2.1 Latar Belakang

Kantor desa merupakan unit pemerintahan terkecil yang melayani masyarakat secara langsung. Efektivitas pelayanan sangat bergantung pada kedisiplinan dan kehadiran pegawai. Sistem absensi yang baik menjadi fondasi penting untuk:

- Memastikan pelayanan publik berjalan optimal
- Menegakkan disiplin kerja pegawai
- Menyediakan data akurat untuk pelaporan ke pemerintah daerah
- Menunjang transparansi dan akuntabilitas

### 2.2 Permasalahan yang Dihadapi

#### 🔴 Permasalahan Utama

1. **Sistem Absensi Manual yang Tidak Efektif**
   - Penggunaan buku absensi fisik yang mudah dimanipulasi
   - Tidak ada validasi identitas saat menandatangani absensi
   - Rentan terhadap kecurangan (titip absen)

2. **Kesulitan dalam Rekapitulasi Data**
   - Proses rekap manual memakan waktu lama (harian, mingguan, bulanan)
   - Risiko kesalahan perhitungan tinggi
   - Tidak ada data historis yang terstruktur

3. **Keterbatasan Monitoring Real-time**
   - Admin/kepala desa tidak dapat memonitor kehadiran secara real-time
   - Sulit mendeteksi keterlambatan secara cepat
   - Tidak ada notifikasi untuk ketidakhadiran

4. **Pelaporan yang Tidak Optimal**
   - Format laporan tidak standar
   - Sulit menghasilkan statistik kehadiran
   - Tidak ada data untuk analisis produktivitas

#### 🟡 Permasalahan Sekunder

5. **Manajemen Data Pegawai Terfragmentasi**
   - Data pegawai tersebar di berbagai dokumen
   - Tidak ada sistem terpusat untuk mengelola informasi pegawai
   - Kesulitan update data saat ada mutasi/perubahan

6. **Tidak Ada Audit Trail**
   - Tidak ada catatan siapa yang melakukan perubahan data
   - Sulit menelusuri aktivitas administratif
   - Minim akuntabilitas

---

## 3. Tujuan

### 3.1 Tujuan Utama

1. **Memodernisasi Sistem Absensi**
   - Mengganti absensi manual dengan sistem digital berbasis face recognition
   - Memastikan validasi identitas yang akurat dan tidak dapat dimanipulasi
   - Menyediakan pencatatan waktu otomatis dan presisi

2. **Meningkatkan Efisiensi Administratif**
   - Otomatisasi proses rekapitulasi kehadiran
   - Mempercepat pembuatan laporan (dari jam menjadi detik)
   - Mengurangi beban kerja administratif

3. **Menyediakan Monitoring Real-time**
   - Dashboard kehadiran yang dapat diakses kapan saja
   - Statistik harian, mingguan, dan bulanan
   - Identifikasi cepat terhadap pegawai yang terlambat atau tidak hadir

### 3.2 Tujuan Spesifik

| No | Tujuan | Indikator Keberhasilan |
|----|--------|------------------------|
| 1 | Eliminasi manipulasi absensi | 0% kasus titip absen |
| 2 | Otomatisasi pencatatan | 100% absensi tercatat digital |
| 3 | Akurasi pengenalan wajah | > 95% confidence score |
| 4 | Kecepatan proses | < 3 detik per transaksi absensi |
| 5 | Ketersediaan laporan | Laporan tersedia dalam < 1 menit |
| 6 | Audit trail lengkap | 100% aktivitas tercatat |

---

## 4. Ruang Lingkup

### 4.1 Ruang Lingkup Fungsional

#### ✅ Termasuk dalam Sistem (In Scope)

| No | Modul | Deskripsi |
|----|-------|-----------|
| 1 | **Absensi Face Recognition** | Pengenalan wajah untuk check-in dan check-out otomatis |
| 2 | **Manajemen Pegawai** | CRUD data pegawai termasuk registrasi wajah |
| 3 | **Dashboard Admin** | Monitoring kehadiran real-time dan statistik |
| 4 | **Riwayat & Laporan** | Rekap kehadiran dengan filter dan export |
| 5 | **Pengaturan Sistem** | Konfigurasi jam kerja, threshold, dan hari libur |
| 6 | **Koreksi Manual** | Perbaikan data absensi oleh admin |
| 7 | **Log Aktivitas** | Audit trail semua perubahan data |
| 8 | **Autentikasi Admin** | Login dengan JWT token |

#### ❌ Tidak Termasuk dalam Sistem (Out of Scope)

| No | Fitur | Alasan |
|----|-------|--------|
| 1 | Multi admin/role-based access | Scope awal untuk single admin |
| 2 | Registrasi perangkat tablet | Tidak diperlukan saat ini |
| 3 | Kalender libur nasional otomatis | Input manual lebih fleksibel |
| 4 | Integrasi dengan sistem penggajian | Fase pengembangan selanjutnya |
| 5 | Mobile app (native) | Menggunakan web responsive |
| 6 | Absensi dengan NFC/fingerprint | Fokus pada face recognition |
| 7 | Notifikasi email/SMS | Fase pengembangan selanjutnya |

### 4.2 Ruang Lingkup Pengguna

| Tipe Pengguna | Deskripsi | Akses |
|---------------|-----------|-------|
| **Admin** | Kepala desa atau staf yang ditunjuk | Dashboard admin, semua fitur manajemen |
| **Pegawai** | Seluruh pegawai kantor desa | Mesin absensi (face recognition) |
| **Tamu** | Pengunjung/masyarakat | View only daftar kehadiran hari ini |

### 4.3 Ruang Lingkup Teknis

| Aspek | Spesifikasi |
|-------|-------------|
| **Platform** | Web-based (responsive untuk tablet dan desktop) |
| **Deployment** | On-premise (VPS) atau Cloud hosting |
| **Browser Support** | Chrome, Firefox, Safari, Edge (versi terbaru) |
| **Device Requirement** | Tablet dengan kamera atau PC + webcam |
| **Koneksi** | Internet stabil (minimal 1 Mbps) |

---

## 5. Product Requirements Document (PRD)

### 5.1 Ringkasan Produk

**Nama Produk:** ABSEN DESA  
**Jenis:** Sistem Informasi Presensi Digital  
**Target Pengguna:** Kantor Desa di Indonesia  
**Teknologi Utama:** Face Recognition dengan InsightFace

### 5.2 Fitur Utama

#### 5.2.1 Modul Absensi (Public/Tablet)

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-001 | Face Detection | High | Deteksi wajah otomatis dari kamera |
| F-002 | Face Recognition | High | Identifikasi pegawai dari database wajah |
| F-003 | Auto Check-in/Check-out | High | Tentukan mode berdasarkan waktu (pagi=masuk, sore=pulang) |
| F-004 | Confidence Display | Medium | Tampilkan tingkat kepercayaan pengenalan |
| F-005 | Daftar Kehadiran Hari Ini | Medium | Tampilan real-time pegawai yang sudah absen |
| F-006 | Auto Refresh | Low | Refresh otomatis setiap 30 detik |

#### 5.2.2 Modul Admin - Dashboard

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-010 | Statistik Harian | High | Jumlah hadir, terlambat, izin, sakit, alfa |
| F-011 | Grafik Kehadiran | Medium | Visualisasi data mingguan/bulanan |
| F-012 | Aktivitas Terbaru | Medium | Timeline aktivitas absensi terkini |
| F-013 | Quick Stats | Low | Ringkasan cepat status kehadiran |

#### 5.2.3 Modul Admin - Manajemen Pegawai

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-020 | Daftar Pegawai | High | List pegawai dengan search dan filter |
| F-021 | Tambah Pegawai | High | Form registrasi pegawai baru |
| F-022 | Edit Pegawai | High | Update data pegawai |
| F-023 | Nonaktifkan Pegawai | High | Soft delete (is_active = false) |
| F-024 | Registrasi Wajah | High | Upload dan simpan face embedding |
| F-025 | Multiple Face Photos | Medium | Simpan beberapa foto wajah per pegawai |

#### 5.2.4 Modul Admin - Absensi Harian

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-030 | Daftar Absensi Hari Ini | High | Semua absensi harian dengan detail |
| F-031 | Koreksi Absensi | High | Edit status dan catatan absensi |
| F-032 | Tambah Absensi Manual | Medium | Input manual untuk kasus khusus |
| F-033 | Filter dan Search | Medium | Filter berdasarkan status, pegawai |

#### 5.2.5 Modul Admin - Riwayat & Laporan

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-040 | Riwayat Kehadiran | High | Data historis dengan range tanggal |
| F-041 | Rekap Bulanan | High | Rekapitulasi per pegawai per bulan |
| F-042 | Export CSV | High | Download laporan format spreadsheet |
| F-043 | Filter Multi-kriteria | Medium | Filter tanggal, pegawai, status |
| F-044 | Statistik Per Pegawai | Low | Rincian kehadiran individual |

#### 5.2.6 Modul Admin - Pengaturan

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-050 | Pengaturan Umum | High | Nama desa, nama pejabat, logo |
| F-051 | Pengaturan Jam Kerja | High | Jam masuk, pulang, threshold terlambat |
| F-052 | Kelola Hari Libur | High | CRUD hari libur manual |
| F-053 | Threshold Face Recognition | Medium | Konfigurasi sensitivity pengenalan |

#### 5.2.7 Modul Admin - Audit Log

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| F-060 | Daftar Aktivitas | High | Log semua perubahan data |
| F-061 | Filter Berdasarkan Tanggal | Medium | Range tanggal untuk audit |
| F-062 | Detail Perubahan | Medium | Before/after data yang diubah |

### 5.3 Persyaratan Non-Fungsional

| Aspek | Requirement |
|-------|-------------|
| **Performance** | Response time < 3 detik untuk face recognition |
| **Availability** | Uptime 99% selama jam kerja |
| **Security** | JWT authentication, password hashing, HTTPS |
| **Scalability** | Support hingga 100 pegawai |
| **Usability** | Interface intuitif, minimal training required |
| **Reliability** | Auto-recovery untuk koneksi terputus |

### 5.4 Batasan Sistem

| Batasan | Deskripsi |
|---------|-----------|
| Pencahayaan | Membutuhkan pencahayaan yang memadai untuk face detection |
| Kamera | Resolusi minimal 720p untuk akurasi optimal |
| Browser | Membutuhkan browser modern dengan WebRTC support |
| Koneksi | Membutuhkan koneksi internet stabil |

---

## 6. Business Flow

### 6.1 Flow Utama - Proses Absensi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOW ABSENSI PEGAWAI                                 │
└─────────────────────────────────────────────────────────────────────────────┘

        ┌──────────────┐
        │  PEGAWAI     │
        │  DATANG      │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Berdiri di  │
        │  Depan Kamera│
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐     ┌─────────────────────┐
        │  Face        │────▶│  Wajah Tidak        │──▶ Tampilkan Error
        │  Detection   │ NO  │  Terdeteksi         │    "Posisikan wajah"
        └──────┬───────┘     └─────────────────────┘
               │ YES
               ▼
        ┌──────────────┐
        │  Countdown   │
        │  3-2-1       │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Capture     │
        │  Foto        │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐     ┌─────────────────────┐
        │  Face        │────▶│  Wajah Tidak        │──▶ Error "Wajah tidak
        │  Recognition │ NO  │  Dikenali           │    terdaftar"
        └──────┬───────┘     └─────────────────────┘
               │ YES (confidence ≥ threshold)
               ▼
        ┌──────────────┐
        │  Tampilkan   │
        │  Konfirmasi  │
        │  + Confidence│
        └──────┬───────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
  ┌─────────┐    ┌─────────┐
  │ CONFIRM │    │ CANCEL  │
  └────┬────┘    └────┬────┘
       │              │
       ▼              ▼
  ┌─────────────┐  ┌────────────┐
  │ Cek Waktu   │  │ Kembali ke │
  │ Sekarang    │  │ Kamera     │
  └──────┬──────┘  └────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ PAGI    │ │ SORE    │
│06:00-   │ │12:00-   │
│12:00    │ │22:00    │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────────┐ ┌─────────────┐
│ Sudah       │ │ Belum       │
│ Check-in?   │ │ Check-in?   │
└──────┬──────┘ └──────┬──────┘
       │               │
  ┌────┴────┐     ┌────┴────┐
  │         │     │         │
  ▼         ▼     ▼         ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ YES │ │ NO  │ │ NO  │ │ YES │
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   ▼       ▼       ▼       ▼
Error   Simpan   Error   Simpan
"Sudah  Check-in "Belum  Check-out
absen"  (Status)  masuk"
           │              │
           ▼              ▼
     ┌───────────┐   ┌───────────┐
     │ ≤ Batas   │   │  Catat    │
     │ Waktu?    │   │  Waktu    │
     └─────┬─────┘   │  Pulang   │
           │         └─────┬─────┘
      ┌────┴────┐          │
      │         │          ▼
      ▼         ▼    ┌───────────┐
  ┌─────┐   ┌─────┐  │ Sukses    │
  │ YES │   │ NO  │  │ Check-out │
  └──┬──┘   └──┬──┘  └───────────┘
     │         │
     ▼         ▼
 "HADIR"   "TERLAMBAT"
     │         │
     └────┬────┘
          │
          ▼
    ┌───────────┐
    │ Simpan ke │
    │ Database  │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Catat     │
    │ Audit Log │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Tampilkan │
    │ Sukses    │
    └───────────┘
```

### 6.2 Flow Admin - Manajemen Pegawai

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLOW MANAJEMEN PEGAWAI                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────┐
                    │    LOGIN       │
                    │    ADMIN       │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │   DASHBOARD    │
                    │   PEGAWAI      │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ TAMBAH BARU   │   │ EDIT PEGAWAI  │   │ NONAKTIFKAN   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Isi Form Data │   │ Pilih Pegawai │   │ Konfirmasi    │
│ • Nama        │   │ dari List     │   │ Nonaktifkan   │
│ • NIP         │   └───────┬───────┘   └───────┬───────┘
│ • Jabatan     │           │                   │
│ • Telepon     │           ▼                   ▼
│ • Email       │   ┌───────────────┐   ┌───────────────┐
└───────┬───────┘   │ Edit Data     │   │ Set is_active │
        │           │ di Form       │   │ = false       │
        ▼           └───────┬───────┘   └───────┬───────┘
┌───────────────┐           │                   │
│ Upload Foto   │           ▼                   │
│ Wajah         │   ┌───────────────┐           │
└───────┬───────┘   │ Simpan        │           │
        │           │ Perubahan     │           │
        ▼           └───────┬───────┘           │
┌───────────────┐           │                   │
│ Generate Face │           │                   │
│ Embedding     │           │                   │
└───────┬───────┘           │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────┐
│                     SIMPAN KE DATABASE                │
└───────────────────────────┬───────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│                     CATAT AUDIT LOG                   │
└───────────────────────────┬───────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│                   REFRESH DAFTAR PEGAWAI              │
└───────────────────────────────────────────────────────┘
```

### 6.3 Flow Harian - Scheduler Otomatis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULER HARIAN                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │ SETIAP HARI JAM 23:59                                               │
    └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ Ambil Semua Pegawai   │
                        │ Aktif                 │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ Loop Setiap Pegawai   │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ Ada Record Absensi    │
                        │ Hari Ini?             │
                        └───────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌───────────────┐               ┌───────────────┐
            │     YA        │               │     TIDAK     │
            │   (Skip)      │               │               │
            └───────────────┘               └───────┬───────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │ Hari Libur?           │
                                        └───────────┬───────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │                               │
                                    ▼                               ▼
                            ┌───────────────┐               ┌───────────────┐
                            │     YA        │               │     TIDAK     │
                            │   (Skip)      │               │               │
                            └───────────────┘               └───────┬───────┘
                                                                    │
                                                                    ▼
                                                    ┌───────────────────────┐
                                                    │ Buat Record dengan    │
                                                    │ Status: ALFA          │
                                                    └───────────────────────┘
```

---

## 7. User Stories

### 7.1 User Stories - Pegawai

#### US-001: Absensi Masuk dengan Face Recognition
```
SEBAGAI    seorang pegawai kantor desa
SAYA INGIN melakukan absensi masuk dengan menunjukkan wajah ke kamera
AGAR       kehadiran saya tercatat secara otomatis dan akurat

KRITERIA PENERIMAAN:
✓ Sistem dapat mendeteksi wajah dalam waktu < 2 detik
✓ Sistem menampilkan countdown sebelum capture
✓ Sistem menunjukkan nama dan foto saya untuk konfirmasi
✓ Sistem menampilkan confidence score
✓ Saya dapat mengkonfirmasi atau membatalkan absensi
✓ Sistem mencatat waktu dengan status "Hadir" atau "Terlambat"
```

#### US-002: Absensi Pulang dengan Face Recognition
```
SEBAGAI    seorang pegawai kantor desa
SAYA INGIN melakukan absensi pulang dengan menunjukkan wajah ke kamera
AGAR       waktu pulang saya tercatat secara otomatis

KRITERIA PENERIMAAN:
✓ Sistem mengenali bahwa ini adalah mode check-out (sore hari)
✓ Sistem mencatat waktu check-out
✓ Sistem menampilkan pesan "Sampai jumpa besok"
✓ Absensi gagal jika belum check-in hari itu
```

#### US-003: Melihat Status Kehadiran
```
SEBAGAI    seorang pegawai kantor desa
SAYA INGIN melihat siapa saja yang sudah absen hari ini
AGAR       saya mengetahui rekan kerja yang sudah hadir

KRITERIA PENERIMAAN:
✓ Daftar kehadiran tersedia di tab "Daftar Hadir"
✓ Menampilkan foto, nama, jabatan, dan status
✓ Menampilkan waktu check-in dan check-out
✓ Data ter-update otomatis setiap 30 detik
```

### 7.2 User Stories - Admin

#### US-010: Login ke Dashboard Admin
```
SEBAGAI    admin kantor desa
SAYA INGIN login ke dashboard dengan username dan password
AGAR       saya dapat mengakses fitur manajemen sistem

KRITERIA PENERIMAAN:
✓ Form login dengan field username dan password
✓ Fitur show/hide password
✓ Redirect ke dashboard setelah login sukses
✓ Menampilkan error untuk kredensial salah
✓ Session tersimpan untuk akses berikutnya
```

#### US-011: Melihat Dashboard Kehadiran
```
SEBAGAI    admin kantor desa
SAYA INGIN melihat ringkasan kehadiran hari ini
AGAR       saya dapat memantau kedisiplinan pegawai

KRITERIA PENERIMAAN:
✓ Menampilkan total pegawai dan yang sudah absen
✓ Statistik: hadir, terlambat, izin, sakit, alfa
✓ Grafik tren kehadiran
✓ Aktivitas absensi terbaru
```

#### US-012: Mengelola Data Pegawai
```
SEBAGAI    admin kantor desa
SAYA INGIN dapat menambah, mengedit, dan menonaktifkan pegawai
AGAR       data pegawai selalu up-to-date

KRITERIA PENERIMAAN:
✓ Form untuk menambah pegawai baru dengan validasi
✓ Fitur edit data pegawai existing
✓ Fitur menonaktifkan pegawai (bukan delete permanen)
✓ Upload foto pegawai
✓ Pencarian dan filter berdasarkan nama/jabatan
```

#### US-013: Mendaftarkan Wajah Pegawai
```
SEBAGAI    admin kantor desa
SAYA INGIN mendaftarkan wajah pegawai ke sistem
AGAR       pegawai dapat melakukan absensi dengan face recognition

KRITERIA PENERIMAAN:
✓ Upload foto wajah dari file atau capture langsung
✓ Sistem melakukan face embedding secara otomatis
✓ Dapat menyimpan beberapa foto wajah per pegawai
✓ Notifikasi sukses/gagal registrasi
```

#### US-014: Melakukan Koreksi Absensi
```
SEBAGAI    admin kantor desa
SAYA INGIN dapat mengoreksi data absensi yang salah
AGAR       data kehadiran akurat

KRITERIA PENERIMAAN:
✓ Dapat mengubah status absensi (hadir, terlambat, izin, sakit, alfa)
✓ Dapat menginput catatan koreksi
✓ Sistem mencatat siapa yang melakukan koreksi
✓ Perubahan tercatat di audit log
```

#### US-015: Melihat Riwayat dan Rekap Kehadiran
```
SEBAGAI    admin kantor desa
SAYA INGIN melihat riwayat kehadiran dalam periode tertentu
AGAR       saya dapat membuat laporan ke atasan

KRITERIA PENERIMAAN:
✓ Filter berdasarkan tanggal (range)
✓ Filter berdasarkan pegawai
✓ Rekap bulanan per pegawai
✓ Statistik kehadiran aggregate
```

#### US-016: Export Laporan ke CSV
```
SEBAGAI    admin kantor desa
SAYA INGIN export data kehadiran ke file CSV
AGAR       dapat diolah lebih lanjut atau dicetak

KRITERIA PENERIMAAN:
✓ Export dengan filter yang dipilih
✓ Format CSV compatible dengan Excel
✓ Kolom lengkap: tanggal, nama, NIP, status, waktu masuk/pulang
✓ File ter-download otomatis
```

#### US-017: Mengatur Waktu Kerja
```
SEBAGAI    admin kantor desa
SAYA INGIN mengatur jam kerja dan threshold keterlambatan
AGAR       sistem mencatat status dengan benar

KRITERIA PENERIMAAN:
✓ Set jam mulai check-in (default 07:00)
✓ Set batas check-in (default 08:00)
✓ Set threshold terlambat dalam menit
✓ Set jam mulai check-out
✓ Perubahan berlaku real-time
```

#### US-018: Mengelola Hari Libur
```
SEBAGAI    admin kantor desa
SAYA INGIN menandai tanggal tertentu sebagai hari libur
AGAR       sistem tidak menandai alfa pada hari tersebut

KRITERIA PENERIMAAN:
✓ Tambah hari libur dengan tanggal dan nama
✓ Daftar hari libur yang sudah diinput
✓ Hapus hari libur jika salah
✓ Sistem tidak memproses absensi pada hari libur
```

#### US-019: Melihat Log Aktivitas
```
SEBAGAI    admin kantor desa
SAYA INGIN melihat log semua perubahan yang terjadi di sistem
AGAR       ada akuntabilitas dan jejak audit

KRITERIA PENERIMAAN:
✓ Daftar aktivitas dengan timestamp
✓ Jenis aktivitas: create, update, delete, correct
✓ Detail perubahan data
✓ Filter berdasarkan tanggal
```

---

## 8. Arsitektur Sistem

### 8.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARSITEKTUR SISTEM                                │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌────────────────────┐
                           │     INTERNET       │
                           └─────────┬──────────┘
                                     │
                                     ▼
        ┌───────────────────────────────────────────────────────────┐
        │                    NGINX REVERSE PROXY                     │
        │                    (HTTPS/SSL Termination)                 │
        └───────────────────────────┬───────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
    │               │      │               │      │               │
    │  TABLET/PC    │      │  ADMIN PC     │      │  MOBILE       │
    │  (Kamera)     │      │  (Browser)    │      │  (Browser)    │
    │               │      │               │      │               │
    └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │                              │
                    │     FRONTEND APPLICATION    │
                    │        (React + Vite)        │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │ • Camera View          │  │
                    │  │ • Attendance List      │  │
                    │  │ • Admin Dashboard      │  │
                    │  │ • Settings Pages       │  │
                    │  └────────────────────────┘  │
                    │                              │
                    └──────────────┬───────────────┘
                                   │
                                   │ REST API (HTTP/JSON)
                                   ▼
                    ┌──────────────────────────────┐
                    │                              │
                    │     BACKEND APPLICATION     │
                    │        (FastAPI + Python)    │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │ • Auth Router          │  │
                    │  │ • Employees Router     │  │
                    │  │ • Attendance Router    │  │
                    │  │ • Settings Router      │  │
                    │  │ • Reports Router       │  │
                    │  │ • Audit Router         │  │
                    │  └────────────────────────┘  │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │ SERVICES               │  │
                    │  │ • Face Recognition     │  │
                    │  │ • Attendance Logic     │  │
                    │  └────────────────────────┘  │
                    │                              │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
                    ▼                              ▼
        ┌───────────────────┐          ┌───────────────────┐
        │                   │          │                   │
        │     DATABASE      │          │  FACE RECOGNITION │
        │      (MySQL)      │          │   (InsightFace)   │
        │                   │          │                   │
        │ ┌───────────────┐ │          │ ┌───────────────┐ │
        │ │ • admins      │ │          │ │ • Detection   │ │
        │ │ • employees   │ │          │ │ • Embedding   │ │
        │ │ • face_embed  │ │          │ │ • Comparison  │ │
        │ │ • attendance  │ │          │ │               │ │
        │ │ • work_setting│ │          │ └───────────────┘ │
        │ │ • holidays    │ │          │                   │
        │ │ • audit_logs  │ │          └───────────────────┘
        │ └───────────────┘ │
        │                   │
        └───────────────────┘
```

### 8.2 Komponen Utama

| Layer | Komponen | Teknologi | Deskripsi |
|-------|----------|-----------|-----------|
| **Frontend** | Web Application | React + TypeScript | SPA untuk UI responsif |
| | Build Tool | Vite | Fast build & HMR |
| | Styling | TailwindCSS + Shadcn/UI | Component library modern |
| | State | React Hooks | Local state management |
| | HTTP Client | Axios | API integration |
| **Backend** | Web Framework | FastAPI | Modern Python web framework |
| | ORM | SQLAlchemy | Database abstraction |
| | Migration | Alembic | Database versioning |
| | Auth | JWT (python-jose) | Token-based authentication |
| | Validation | Pydantic | Request/response schemas |
| **Database** | RDBMS | MySQL | Production database |
| **ML/AI** | Face Recognition | InsightFace | Face detection & embedding |
| | Image Processing | Pillow | Python imaging library |

---

## 9. Spesifikasi Teknis

### 9.1 Database Schema

```sql
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │                         DATABASE SCHEMA                                  │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Tabel Admin
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Pegawai
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nip VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Face Embeddings
CREATE TABLE face_embeddings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    embedding BLOB NOT NULL,
    photo_url VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Tabel Attendance Logs
CREATE TABLE attendance_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_at DATETIME,
    check_out_at DATETIME,
    status ENUM('hadir', 'terlambat', 'izin', 'sakit', 'alfa') NOT NULL,
    confidence_score FLOAT,
    corrected_by VARCHAR(100),
    correction_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, date)
);

-- Tabel Work Settings
CREATE TABLE work_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    village_name VARCHAR(100) NOT NULL,
    officer_name VARCHAR(100),
    logo_url VARCHAR(255),
    check_in_start TIME DEFAULT '07:00:00',
    check_in_end TIME DEFAULT '08:00:00',
    late_threshold_minutes INT DEFAULT 15,
    check_out_start TIME DEFAULT '16:00:00',
    min_work_hours FLOAT DEFAULT 8,
    face_threshold FLOAT DEFAULT 0.6,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Holidays
CREATE TABLE holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Audit Logs
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM('create', 'update', 'delete', 'correct', 'login') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    description TEXT,
    performed_by VARCHAR(100),
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 9.2 API Endpoints Summary

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| **Auth** ||||
| POST | `/api/v1/auth/login` | Login admin | - |
| **Public** ||||
| POST | `/api/v1/attendance/recognize` | Face recognition & absensi | - |
| POST | `/api/v1/attendance/confirm` | Konfirmasi absensi | - |
| GET | `/api/v1/attendance/today` | Daftar absensi hari ini | - |
| GET | `/api/v1/public/settings` | Pengaturan publik | - |
| **Employees** ||||
| GET | `/api/v1/employees` | List pegawai | JWT |
| POST | `/api/v1/employees` | Tambah pegawai | JWT |
| GET | `/api/v1/employees/{id}` | Detail pegawai | JWT |
| PATCH | `/api/v1/employees/{id}` | Update pegawai | JWT |
| DELETE | `/api/v1/employees/{id}` | Nonaktifkan pegawai | JWT |
| **Face Enrollment** ||||
| POST | `/api/v1/employees/{id}/face` | Upload foto wajah | JWT |
| GET | `/api/v1/employees/{id}/face` | List foto wajah | JWT |
| DELETE | `/api/v1/employees/{id}/face/{face_id}` | Hapus foto | JWT |
| **Admin Attendance** ||||
| GET | `/api/v1/admin/attendance` | Riwayat absensi | JWT |
| GET | `/api/v1/admin/attendance/today` | Absensi harian + summary | JWT |
| PATCH | `/api/v1/admin/attendance/{id}` | Koreksi absensi | JWT |
| **Reports** ||||
| GET | `/api/v1/admin/reports/monthly` | Rekap bulanan | JWT |
| GET | `/api/v1/admin/reports/export` | Export CSV | JWT |
| **Settings** ||||
| GET | `/api/v1/admin/settings` | Ambil pengaturan | JWT |
| PATCH | `/api/v1/admin/settings` | Update pengaturan | JWT |
| GET | `/api/v1/admin/settings/holidays` | List hari libur | JWT |
| POST | `/api/v1/admin/settings/holidays` | Tambah hari libur | JWT |
| DELETE | `/api/v1/admin/settings/holidays/{id}` | Hapus hari libur | JWT |
| **Audit** ||||
| GET | `/api/v1/admin/audit-logs` | List aktivitas | JWT |

### 9.3 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│           FRONTEND                 │
├────────────────────────────────────┤
│ Framework    : React 18            │
│ Language     : TypeScript          │
│ Build Tool   : Vite                │
│ Styling      : TailwindCSS         │
│ UI Library   : Shadcn/UI           │
│ Animation    : Framer Motion       │
│ HTTP Client  : Axios               │
│ Router       : React Router v6     │
│ Notifications: Sonner              │
│ Icons        : Lucide React        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│           BACKEND                  │
├────────────────────────────────────┤
│ Framework    : FastAPI             │
│ Language     : Python 3.10+        │
│ ASGI Server  : Uvicorn             │
│ ORM          : SQLAlchemy          │
│ Migration    : Alembic             │
│ Auth         : python-jose (JWT)   │
│ Validation   : Pydantic            │
│ Image Proc   : Pillow              │
│ Face Recog   : InsightFace         │
│ CORS         : FastAPI Middleware  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│          DATABASE                  │
├────────────────────────────────────┤
│ RDBMS        : MySQL 8.0           │
│ Driver       : pymysql             │
│ Pool         : SQLAlchemy Pool     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│        INFRASTRUCTURE              │
├────────────────────────────────────┤
│ VPS          : CloudPanel/Railway  │
│ Reverse Proxy: Nginx               │
│ SSL          : Let's Encrypt       │
│ CDN          : Cloudflare (optional)│
│ Container    : Docker (optional)   │
└────────────────────────────────────┘
```

---

## Lampiran

### A. Referensi Dokumen

| Dokumen | Lokasi |
|---------|--------|
| Backend Design | `docs/plans/2025-12-16-backend-design.md` |
| Integration Summary | `INTEGRATION_SUMMARY.md` |
| Testing Checklist | `TESTING_CHECKLIST.md` |
| Integration Guide | `tap-to-attend/INTEGRATION_GUIDE.md` |
| API Documentation | `http://localhost:8000/docs` (Swagger) |

### B. Kontak

| Role | Nama | Catatan |
|------|------|---------|
| Developer | - | Pengembang sistem |
| Admin Desa | - | Pengguna utama |

---

**Dokumen ini dibuat sebagai panduan lengkap untuk pengembangan dan implementasi sistem ABSEN DESA.**

*Terakhir diperbarui: 24 Desember 2024*
