# Deploy Frontend ke Cloudflare Pages

Panduan lengkap untuk hosting frontend aplikasi Absensi Desa ke Cloudflare Pages.

## 📋 Yang Dibutuhkan Frontend

### Environment Variables

| Variable | Nilai | Wajib |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://api-absen-desa.monika.id` | ✅ Ya |

> **Catatan**: Frontend TIDAK membutuhkan JWT secret. Token autentikasi disimpan di localStorage browser dan dikirim ke backend untuk validasi.

### Build Configuration

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `18` atau `20` |

---

## 🚀 Cara Deploy ke Cloudflare Pages

### Metode 1: Connect GitHub (Recommended)

1. **Login ke Cloudflare Dashboard**
   - Buka [dash.cloudflare.com](https://dash.cloudflare.com)
   - Pilih akun Anda

2. **Buat Pages Project**
   - Klik **Workers & Pages** di sidebar
   - Klik **Create application** → **Pages** → **Connect to Git**

3. **Connect Repository**
   - Pilih **GitHub**
   - Authorize Cloudflare
   - Pilih repository `ABSEN-DESA`
   - Pilih branch `deploy-frontend-cloudflare`

4. **Konfigurasi Build**
   ```
   Project name: absen-desa (atau nama lain)
   Production branch: deploy-frontend-cloudflare
   Framework preset: None (atau Vite)
   Build command: cd tap-to-attend && npm install && npm run build
   Build output directory: tap-to-attend/dist
   Root directory: / (leave empty)
   ```

5. **Set Environment Variables**
   - Klik **Environment variables** → **Add variable**
   - Name: `VITE_API_BASE_URL`
   - Value: `https://api-absen-desa.monika.id`
   - Environment: **Production** (dan **Preview** jika perlu)

6. **Deploy!**
   - Klik **Save and Deploy**
   - Tunggu build selesai (sekitar 1-2 menit)

---

### Metode 2: Direct Upload (Manual)

Jika tidak mau connect GitHub:

1. **Build di lokal**
   ```bash
   cd tap-to-attend
   npm install
   npm run build
   ```

2. **Upload folder `dist`**
   - Di Cloudflare Pages, pilih **Upload assets**
   - Drag & drop isi folder `dist`

---

## ⚙️ Konfigurasi Tambahan

### Custom Domain

1. Di dashboard Cloudflare Pages, buka project
2. Klik tab **Custom domains**
3. Klik **Set up a custom domain**
4. Masukkan domain (misal: `absen.desa.example.com`)
5. Cloudflare akan otomatis setup SSL

### SPA Routing Fix

Buat file `tap-to-attend/public/_redirects`:
```
/*    /index.html   200
```

Atau buat `tap-to-attend/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

---

## 🔄 CI/CD Otomatis

Setelah connect GitHub, setiap push ke branch `deploy-frontend-cloudflare` akan otomatis trigger deployment!

### Workflow:
```
git push → Cloudflare detect → Build → Deploy → Live!
```

---

## 🐛 Troubleshooting

### Error: CORS

Pastikan backend sudah mengizinkan domain Cloudflare:
```python
# Di backend/app/main.py
origins = [
    "http://localhost:8080",
    "https://absen-desa.pages.dev",  # Domain Cloudflare Pages
    "https://your-custom-domain.com",
]
```

### Error: API tidak terhubung

1. Cek environment variable sudah benar
2. Pastikan NO trailing slash: `https://api-absen-desa.monika.id` (BUKAN `https://api-absen-desa.monika.id/`)
3. Re-deploy setelah update environment variable

### Build gagal

1. Pastikan Node.js version compatible (18 atau 20)
2. Cek build command path sudah benar

---

## ✅ Checklist Deployment

- [ ] Environment variable `VITE_API_BASE_URL` sudah di-set
- [ ] Build command dan output directory sudah benar
- [ ] Backend CORS sudah mengizinkan domain Cloudflare
- [ ] Test login berfungsi
- [ ] Test face recognition berfungsi
- [ ] Custom domain sudah di-setup (opsional)
