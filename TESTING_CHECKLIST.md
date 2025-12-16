# Testing Checklist - Frontend-Backend Integration

## 🚀 Pre-requisites

### Backend Setup
```bash
cd backend
# Activate virtual environment
source venv/bin/activate  # or: venv\Scripts\activate (Windows)

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Verify backend is running
# Open: http://localhost:8000/docs
```

### Frontend Setup
```bash
cd tap-to-attend
npm install  # if not done yet
npm run dev

# Verify frontend is running
# Open: http://localhost:5173
```

## ✅ Testing Scenarios

### 1. Public Attendance System (Camera)

**URL:** http://localhost:5173

#### Test Cases
- [ ] **TC1.1**: Page loads without errors
- [ ] **TC1.2**: Camera permission prompt appears
- [ ] **TC1.3**: Camera feed displays after permission granted
- [ ] **TC1.4**: Face detection frame appears
- [ ] **TC1.5**: Face detection works (observe status changes)
- [ ] **TC1.6**: Countdown appears when face detected (3-2-1)
- [ ] **TC1.7**: Auto-capture after countdown
- [ ] **TC1.8**: API call to `/api/v1/attendance/recognize` sent
  - Check Network tab in DevTools
  - Verify base64 image in request payload
- [ ] **TC1.9**: Success dialog appears with employee info
- [ ] **TC1.10**: Confidence score displayed
- [ ] **TC1.11**: Status shows "Hadir" or "Terlambat" correctly
- [ ] **TC1.12**: Confirm button saves attendance
- [ ] **TC1.13**: Toast notification appears
- [ ] **TC1.14**: Cancel button closes dialog without saving

**Expected Errors to Test:**
- [ ] **TC1.15**: Unknown face → Error toast displays
- [ ] **TC1.16**: Backend offline → Error toast displays
- [ ] **TC1.17**: Camera blocked → Error message shows with retry button

---

### 2. Attendance List Tab

**URL:** http://localhost:5173 (tab "Daftar Hadir")

#### Test Cases
- [ ] **TC2.1**: Switch to "Daftar Hadir" tab
- [ ] **TC2.2**: API call to `/api/v1/attendance/today` triggered
- [ ] **TC2.3**: Attendance records display correctly
- [ ] **TC2.4**: Status badges show correct colors:
  - Hadir = green
  - Terlambat = yellow
  - Belum = gray
  - Izin = blue
  - Sakit = orange
  - Alfa = red
- [ ] **TC2.5**: Time displays correctly (HH:mm format)
- [ ] **TC2.6**: Empty state shows when no records
- [ ] **TC2.7**: Auto-refresh works (every 30 seconds)
- [ ] **TC2.8**: After new attendance, list updates automatically

---

### 3. Admin Login

**URL:** http://localhost:5173/login

#### Test Cases
- [ ] **TC3.1**: Login page loads
- [ ] **TC3.2**: Form fields are present:
  - Username input
  - Password input (with show/hide toggle)
  - Login button
- [ ] **TC3.3**: Show/hide password toggle works
- [ ] **TC3.4**: Login with **valid credentials**:
  - [ ] API call to `POST /api/v1/auth/login`
  - [ ] Success toast appears
  - [ ] Redirects to `/admin` dashboard
  - [ ] JWT token stored in localStorage
- [ ] **TC3.5**: Login with **invalid credentials**:
  - [ ] Error toast displays
  - [ ] Stays on login page
  - [ ] No token in localStorage
- [ ] **TC3.6**: Empty form validation works
- [ ] **TC3.7**: Loading state during login (button disabled)
- [ ] **TC3.8**: "Kembali ke Halaman Utama" link works

**Check localStorage:**
```javascript
// In browser console
localStorage.getItem('auth_token')
// Should return JWT token after successful login
```

---

### 4. Protected Routes & Authorization

#### Test Cases
- [ ] **TC4.1**: Access `/admin` without login → Redirects to `/login`
- [ ] **TC4.2**: Access `/admin/pegawai` without login → Redirects to `/login`
- [ ] **TC4.3**: After login, can access all admin routes:
  - [ ] `/admin` (Dashboard)
  - [ ] `/admin/pegawai` (Employees)
  - [ ] `/admin/absensi` (Daily Attendance)
  - [ ] `/admin/riwayat` (History)
  - [ ] `/admin/pengaturan` (Settings)
  - [ ] `/admin/log` (Audit Logs)
- [ ] **TC4.4**: JWT token added to request headers:
  - Check Network tab
  - Verify `Authorization: Bearer <token>` header
- [ ] **TC4.5**: Logout functionality:
  - [ ] Click "Keluar" button in sidebar
  - [ ] Token removed from localStorage
  - [ ] Redirects to `/login`
  - [ ] Cannot access admin pages after logout

---

### 5. Admin Sidebar & Navigation

**URL:** http://localhost:5173/admin

#### Test Cases
- [ ] **TC5.1**: Sidebar displays correctly
- [ ] **TC5.2**: All menu items visible:
  - Beranda
  - Pegawai
  - Absensi Harian
  - Riwayat & Laporan
  - Pengaturan
  - Log Aktivitas
- [ ] **TC5.3**: Active menu item highlighted
- [ ] **TC5.4**: Menu items navigate correctly
- [ ] **TC5.5**: "Ke Mesin Absensi" link goes to `/`
- [ ] **TC5.6**: "Keluar" button logs out
- [ ] **TC5.7**: Mobile responsive:
  - [ ] Hamburger menu on mobile
  - [ ] Sidebar slides in/out
  - [ ] Overlay appears on mobile
- [ ] **TC5.8**: Desktop sidebar collapse/expand works

---

### 6. API Integration (Network Monitoring)

#### Public Endpoints
- [ ] **TC6.1**: `POST /api/v1/attendance/recognize`
  - Request: `{ image: "base64..." }`
  - Response: `{ employee_id, employee_name, position, status, confidence }`
- [ ] **TC6.2**: `GET /api/v1/attendance/today`
  - Response: Array of attendance records

#### Admin Endpoints (Require Auth)
- [ ] **TC6.3**: `GET /api/v1/employees`
  - Headers include: `Authorization: Bearer <token>`
- [ ] **TC6.4**: `POST /api/v1/employees`
  - Creates new employee
- [ ] **TC6.5**: `PATCH /api/v1/employees/{id}`
  - Updates employee
- [ ] **TC6.6**: `DELETE /api/v1/employees/{id}`
  - Soft deletes employee
- [ ] **TC6.7**: `GET /api/v1/admin/attendance/today`
  - Returns records + summary
- [ ] **TC6.8**: `PATCH /api/v1/admin/attendance/{id}`
  - Corrects attendance
- [ ] **TC6.9**: 401 Response handling:
  - [ ] Auto-logout on 401
  - [ ] Redirect to login

---

### 7. Error Handling & Edge Cases

#### Network Errors
- [ ] **TC7.1**: Backend offline:
  - [ ] Attendance recognition shows error
  - [ ] Login shows error
  - [ ] Admin pages show error
- [ ] **TC7.2**: Slow network:
  - [ ] Loading states display
  - [ ] Requests eventually complete or timeout

#### Data Errors
- [ ] **TC7.3**: Empty attendance list handles gracefully
- [ ] **TC7.4**: Invalid face image handles error
- [ ] **TC7.5**: Duplicate attendance prevented (backend logic)

#### Token Expiration
- [ ] **TC7.6**: Expired token:
  - [ ] 401 response from API
  - [ ] Auto-logout
  - [ ] Redirect to login
  - [ ] Toast notification

---

### 8. Environment Configuration

#### Test Cases
- [ ] **TC8.1**: `.env` file exists
- [ ] **TC8.2**: `VITE_API_BASE_URL` is set correctly
- [ ] **TC8.3**: API calls use correct base URL:
  ```javascript
  // In browser console
  console.log(import.meta.env.VITE_API_BASE_URL)
  // Should output: http://localhost:8000
  ```
- [ ] **TC8.4**: Change API URL in `.env`:
  ```env
  VITE_API_BASE_URL=http://192.168.1.100:8000
  ```
  - [ ] Restart dev server
  - [ ] API calls use new URL

---

### 9. Developer Experience

#### TypeScript
- [ ] **TC9.1**: No TypeScript errors in IDE
- [ ] **TC9.2**: Build succeeds: `npm run build`
- [ ] **TC9.3**: Type inference works in hooks
- [ ] **TC9.4**: Autocomplete for API methods

#### Console
- [ ] **TC9.5**: No errors in browser console (except expected ones)
- [ ] **TC9.6**: Network requests logged correctly
- [ ] **TC9.7**: Error messages are descriptive

---

### 10. Production Build

#### Test Cases
- [ ] **TC10.1**: Build command succeeds:
  ```bash
  npm run build
  # ✓ built in ~5s
  ```
- [ ] **TC10.2**: `dist/` folder created
- [ ] **TC10.3**: Preview build works:
  ```bash
  npm run preview
  # Open: http://localhost:4173
  ```
- [ ] **TC10.4**: All features work in production build
- [ ] **TC10.5**: Bundle size acceptable (~976 KB / 293 KB gzipped)

---

## 📊 Test Results Summary

| Category | Total | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Camera & Recognition | 17 | - | - | |
| Attendance List | 8 | - | - | |
| Admin Login | 8 | - | - | |
| Protected Routes | 5 | - | - | |
| Admin Navigation | 8 | - | - | |
| API Integration | 9 | - | - | |
| Error Handling | 6 | - | - | |
| Environment Config | 4 | - | - | |
| Developer Experience | 7 | - | - | |
| Production Build | 5 | - | - | |
| **TOTAL** | **77** | - | - | |

---

## 🐛 Common Issues & Solutions

### Issue: CORS Error
**Symptom:** API calls blocked by CORS policy

**Solution:**
- Check backend CORS configuration
- Ensure `http://localhost:5173` is allowed
- Check backend logs

### Issue: 401 Unauthorized
**Symptom:** API calls return 401 even after login

**Solution:**
- Check token in localStorage: `localStorage.getItem('auth_token')`
- Verify token is valid (not expired)
- Check Authorization header in Network tab
- Re-login to get fresh token

### Issue: Face Recognition Fails
**Symptom:** Always returns "Wajah tidak dikenali"

**Solution:**
- Check backend has face encodings in database
- Verify image quality from camera
- Check backend logs for detailed error
- Test with enrolled face

### Issue: Camera Not Working
**Symptom:** Black screen or permission denied

**Solution:**
- Check browser permissions (Settings > Site Settings > Camera)
- Use HTTPS or localhost (required for camera access)
- Try different browser
- Check if camera is being used by another app

### Issue: Auto-refresh Not Working
**Symptom:** Attendance list doesn't update

**Solution:**
- Check console for errors
- Verify interval is set (30 seconds)
- Manually refresh browser
- Check API endpoint is working

---

## 📝 Testing Checklist Progress

Date: ___________
Tester: ___________
Backend Version: ___________
Frontend Version: ___________

### Quick Checklist
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Can access admin dashboard
- [ ] Camera works and captures face
- [ ] Attendance records display
- [ ] Logout works correctly
- [ ] Build succeeds without errors
- [ ] All critical paths tested

### Sign-off
**Developer:** ___________  
**Date:** ___________

**QA/Tester:** ___________  
**Date:** ___________

---

**Document Version:** 1.0  
**Last Updated:** December 16, 2024
