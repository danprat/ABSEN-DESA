# ABSEN DESA

## Project Snapshot
Dual-stack attendance system with face recognition: FastAPI backend + React/Vite frontend. Backend handles authentication, face recognition, attendance tracking. Frontend provides employee/admin interfaces. See sub-AGENTS.md in `backend/` and `tap-to-attend/` for detailed guidance.

## Root Setup Commands
```bash
# Backend setup
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend setup
cd tap-to-attend && npm install && npm run dev
```

## Universal Conventions
- **Commits**: Use conventional commits (feat:, fix:, docs:, refactor:)
- **Branches**: feature/*, bugfix/*, hotfix/*
- **Code Style**: Backend uses Black/isort style, Frontend uses ESLint config
- **API**: All endpoints prefixed with `/api/v1`
- **Imports**: Frontend uses `@/` absolute imports

## Security & Secrets
- NEVER commit `.env` files or database credentials
- Backend `.env` must have: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
- Frontend uses `VITE_API_URL` for backend connection
- Face embeddings stored securely, never expose raw face data in API responses

## JIT Index

### Directory Structure
- **Backend API**: `backend/` → [see backend/AGENTS.md](backend/AGENTS.md)
- **Frontend App**: `tap-to-attend/` → [see tap-to-attend/AGENTS.md](tap-to-attend/AGENTS.md)
- **Documentation**: `docs/` (business analysis, design docs)

### Quick Find Commands
```bash
# Find API endpoint
rg -n "router\.(get|post|put|delete)" backend/app/routers/

# Find React component
rg -n "export (function|const) \w+.*=>" tap-to-attend/src/

# Find React hooks
rg -n "export.*use[A-Z]" tap-to-attend/src/hooks/

# Find database models
rg -n "class \w+\(Base\)" backend/app/models/

# Find Pydantic schemas
rg -n "class \w+\(BaseModel\)" backend/app/schemas/
```

### Key Integration Points
- Backend API runs on `http://localhost:8000`
- Frontend dev server runs on `http://localhost:8080`
- API docs available at `http://localhost:8000/docs` (Swagger UI)
- CORS configured in `backend/app/main.py:22-28`

## Definition of Done
Before creating PR:
1. Backend: No breaking API changes without version bump
2. Frontend: `npm run lint` passes with no errors
3. Backend: Alembic migration created if schema changed
4. All new endpoints documented in router docstrings
5. Test both frontend and backend integration locally
6. Update relevant AGENTS.md if patterns change

## Common Workflows

### Adding New Feature
1. Create feature branch: `git checkout -b feature/your-feature`
2. Backend changes: Add router → schema → model → service
3. Frontend changes: Add page → hook → component
4. Test integration between frontend and backend
5. Commit with conventional format: `feat: add your feature`

### Database Changes
1. Edit models in `backend/app/models/`
2. Generate migration: `cd backend && alembic revision --autogenerate -m "description"`
3. Review migration file in `backend/alembic/versions/`
4. Apply: `alembic upgrade head`
5. Update schemas in `backend/app/schemas/` if needed

### Debugging
- Backend logs: Check uvicorn console output
- Frontend errors: Check browser console and network tab
- Database: Connect to MySQL, check `alembic_version` table
- API testing: Use Swagger UI at `/docs` or curl/Postman
