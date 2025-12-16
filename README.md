# ABSEN DESA

Sistem presensi digital untuk desa dengan fitur face recognition dan backend API modern.

## struktur Project

```
ABSEN-DESA/
├── backend/            # FastAPI backend application
├── tap-to-attend/      # Frontend React/Next.js application
├── docs/              # Dokumentasi project
├── INTEGRATION_SUMMARY.md
├── TESTING_CHECKLIST.md
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate ke backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Mac/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env dengan konfigurasi database dan secret key
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate ke frontend directory:
   ```bash
   cd tap-to-attend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Backend memerlukan environment variables berikut:

- `DATABASE_URL`: MySQL database connection string
- `SECRET_KEY`: JWT secret key untuk authentication
- `DEBUG`: Development mode flag
- `CORS_ORIGINS`: Allowed origins untuk CORS

## Features

- Authentication dengan JWT tokens
- Face recognition integration
- Digital attendance system
- Admin dashboard
- Real-time presence tracking

## Dokumentasi

Lihat file berikut untuk informasi lebih detail:
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- [docs/](./docs/) folder untuk dokumentasi teknis

## Contributing

1. Create fork dari repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request
