# Overview

This project is a social media metrics collection platform for content operations and analytics workflows.  
Its core goal is to standardize the full flow: link collection -> metrics fetching -> result review -> CSV export.  
The current version is a working MVP foundation with local end-to-end execution, and it is now in the feature expansion phase (as of 2026-04-15).

## Technology Stack

### Backend

- `FastAPI`: API endpoints and background job triggering
- `SQLAlchemy` + `PostgreSQL`: job/result persistence
- `Alembic`: database migrations
- `uv`: Python dependency/runtime management
- `yt-dlp` (optional mode): real YouTube metadata fetching
- `python-jose`: JWT signing and verification
- `bcrypt`: password hashing

### Frontend

- `Next.js` (App Router, with route groups for auth/dashboard separation)
- `React`
- `Tailwind CSS`
- `TypeScript`
- `recharts`: performance trend charts

## Project Structure

```text
media-metrics-lab/
├── .github/                             # GitHub config directory
│   └── workflows/                       # CI workflow definitions
│       └── ci.yml                       # Backend tests + frontend lint/build CI
├── backend/                             # Backend service
│   ├── app/                             # Main backend application code
│   │   ├── api/                         # HTTP routes (auth/jobs/system)
│   │   ├── core/                        # Configuration, logging, and security (JWT/bcrypt)
│   │   ├── db/                          # DB session and ORM models
│   │   └── services/                    # Business logic (upload/jobs/fetchers)
│   ├── alembic/                         # Migration scripts and config
│   ├── test/                            # Pytest tests and fixtures
│   ├── main.py                          # Uvicorn entry point (main:app)
│   ├── pyproject.toml                   # Python project dependencies
│   ├── uv.lock                          # Locked Python dependencies
│   ├── Dockerfile                       # Backend container image
│   └── README.md                        # Backend-specific documentation
├── frontend/                            # Frontend service
│   ├── app/                             # Next.js route pages
│   │   ├── (dashboard)/                 # Dashboard routes (with sidebar layout)
│   │   └── (auth)/                      # Auth routes: /login, /register (no sidebar)
│   ├── components/                      # Page and UI components
│   ├── hooks/                           # React hooks
│   ├── lib/                             # Config/helpers
│   ├── public/                          # Static assets
│   ├── package.json                     # Frontend dependencies/scripts
│   ├── Dockerfile                       # Frontend container image (3-stage standalone build)
│   └── README.md                        # Frontend README (currently default template)
├── docker-compose.yml                   # Local orchestration (db + backend + frontend)
├── .env.example                         # Environment variable template for Docker
└── README.md                            # Project overview (this file)
```

## Quick Start

### Option A — Docker (recommended)

Requires Docker Desktop.

```bash
cp .env.example .env
```

Edit `.env`: set `POSTGRES_PASSWORD`, update `DATABASE_URL` to use the same password, and generate a `JWT_SECRET_KEY`:

```bash
openssl rand -hex 32
```

```bash
docker compose up --build
```

Services start at:

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`
- Postgres: `localhost:5432` (host-exposed for local DB tools)

Database data persists in a named Docker volume (`postgres_data`) across restarts.  
Use `docker compose down -v` only if you want to wipe the database.

### Option B — Local (manual)

### Prerequisites

- Python `>=3.14`
- Node.js `>=20`
- PostgreSQL (local or managed)
- `uv` installed

1. Start the backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Create `backend/.env` with at minimum:

```env
DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/mediametrics
JWT_SECRET_KEY=<output of: openssl rand -hex 32>
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

2. Start the frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000" > .env.local
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

3. Access services

- Frontend: `http://127.0.0.1:3000`
- Backend docs: `http://127.0.0.1:8000/docs`

4. Suggested first paths

- Register: `/register`
- Single fetch: `/`
- Bulk fetch: `/bulk`
- Job history: `/history` (requires login)

## Environment Variables

Copy `.env.example` to `.env` (Docker) or the service-level `.env.example` (local) and fill in the values.

| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | db | Postgres password (required) |
| `POSTGRES_USER` | db | Postgres user (default: `app`) |
| `POSTGRES_DB` | db | Database name (default: `mediametrics`) |
| `DATABASE_URL` | backend | Full SQLAlchemy connection string |
| `FRONTEND_ORIGIN` | backend | CORS allowed origin for the frontend |
| `YOUTUBE_FETCHER_IMPL` | backend | `stub` / `yt_dlp` / `youtube_api` |
| `YOUTUBE_API_KEY` | backend | Required when `YOUTUBE_FETCHER_IMPL=youtube_api` |
| `JWT_SECRET_KEY` | backend | Secret for signing JWTs — generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_API_BASE` | frontend | Backend URL as seen by the browser |

## Testing & CI/CD

The current testing and CI focus is protecting the main workflow from regressions.

### What is covered locally

Current backend `pytest` coverage includes:

- CSV/XLSX upload parsing
- Required-column and row-level validation (`platform` + `url`)
- Invalid file-type rejection

Run locally:

```bash
cd backend
uv sync
PYTHONPATH=. uv run pytest -q
```

### What CI achieves

GitHub Actions (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`.

Backend Job:

- Starts a PostgreSQL service container
- Installs dependencies and runs `alembic upgrade head`
- Runs `pytest -q`

Frontend Job:

- Runs `npm ci`
- Runs `npm run lint`
- Runs `npm run build`

CI goals:

- Catch backend parsing regressions before merge
- Ensure frontend code passes lint and remains buildable
- Reduce local-vs-CI environment mismatches

## Implemented Features

### Core
- CSV/XLSX bulk upload and job creation
- Job lifecycle: `queued -> running -> completed/failed`
- Async processing via FastAPI `BackgroundTasks`
- Job list, job detail, and paginated result queries
- CSV export for job results
- System metadata endpoint: `GET /system/meta`

### Fetchers
- YouTube fetcher with `stub`, `yt_dlp`, and `youtube_api` (YouTube Data API v3) modes

### Auth
- JWT authentication (username/password, 8-hour token)
- `POST /auth/register` and `POST /auth/login` endpoints
- Protected routes: Job History and related endpoints require a valid token
- Login (`/login`) and Register (`/register`) pages
- Next.js proxy (route guard) redirects unauthenticated users to `/login`

### Frontend Pages
- Single Fetch (`/`) and Bulk Fetch (`/bulk`)
- Job History (`/history`) and Job Detail (`/jobs/[job_id]`)
- Campaigns list (`/campaigns`) and Campaign Detail (`/campaigns/[campaignId]`) — static UI, not yet wired to backend

### Infrastructure
- Docker support: `docker-compose.yml` with PostgreSQL, backend, and frontend services
- Backend deployed on Railway (persistent process, resolves Vercel Serverless BackgroundTasks limitation)
- Alembic migrations run automatically on backend startup

## Planned Features

- Campaign backend: `campaigns` and `campaign_items` tables, CRUD API, "Add to Campaign" flow
- Instagram Graph API fetcher (pending API key)
- Production-grade TikTok fetcher (currently stub)
- Queued execution + retry strategy (e.g., Redis/Celery)
- Broader automated tests (backend integration tests, frontend E2E)
- Observability improvements (structured logs, alerts, performance metrics)
- Deployment hardening (release and rollback strategy)
