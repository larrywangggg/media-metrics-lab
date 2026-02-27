# Media Metrics Lab

**Media Metrics Lab** is an extensible platform for collecting, analysing, and exporting social media performance data.

**One-line pitch:**  
Upload a spreadsheet → fetch social metrics → view results → export data.



## Project Vision

Media Metrics Lab is designed as a **long-term analytics platform** for working with social media data at scale.  
The current implementation focuses on a **narrow, reliable MVP** to establish a solid technical and product foundation.

Features beyond the MVP (advanced analytics, richer data models, automation, and integrations) are intentionally deferred.


## MVP Milestone

- Status: **Completed**
- Scope: **12 / 12 MVP issues closed** (as of **2026-02-23**)
- Outcome: end-to-end workflow is available (`upload -> create job -> run -> list/detail/results -> export CSV`)

### Delivered MVP items (12/12)
- Initialise monorepo + basic tooling
- Backend: project structure + configuration
- Backend: PostgreSQL setup + Alembic migrations
- Backend: define database models (Job + Result)
- Backend: file upload endpoint + CSV/XLSX parsing
- Backend: create job + persist queued result rows
- Backend: fetcher service interface (stub-first)
- Backend: job runner (background processing)
- Backend: job query APIs (list + detail + results)
- Backend: export results as CSV
- Frontend (Next.js): upload page + create job
- Frontend (Next.js): job list + job detail + results table + export



## Current MVP Scope

The MVP provides a job-based workflow for batch processing social media links.

### Core Capabilities
- Upload CSV / XLSX files
- Create background jobs with status tracking  
  (`queued → running → completed / failed`)
- Generate per-row results (success or failure)
- Display results in a table
- Export job results as CSV

### Required Input Columns
- `platform` (youtube / tiktok / instagram)
- `url` (post or video link)

### Result Fields
- platform, url  
- title (optional)  
- views, likes, comments  
- published_at (optional)  
- engagement_rate (optional, calculated if available)  
- status, error_message  



## Explicitly Out of Scope (for MVP only)

The following are **not part of the MVP**, but may be added later:
- Authentication and user management
- Caching, rate limiting, or distributed task queues
- Multi-tenant isolation
- Advanced UI and visualisations
- Deep analytics (followers, channel-level metrics)
- High-concurrency performance tuning



## Data Source Strategy (MVP)

- YouTube is prioritised for stability
- TikTok / Instagram are supported with best-effort fetching  
  (row-level failures do not fail the entire job)



## Tech Stack (Current Direction)

- Backend: FastAPI  
- Frontend: Next.js  
- Storage: PostgreSQL  
- Export: CSV  

## Run Services (Local)

### 1. Backend setup (env + DB migration)

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Notes:
- `backend/.env` must contain a valid `DATABASE_URL` (default in `.env.example`: `postgresql+psycopg://app:app@localhost:5432/mediametrics`).
- Make sure PostgreSQL is running and that DB exists before `alembic upgrade head`.

### 2. Frontend setup

```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000" > .env.local
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

### 3. Verify services

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:3000`

If you use `127.0.0.1:3000` for frontend, add this in `backend/.env` to avoid CORS issues:

```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## End-to-End Smoke Run (youtube_smoke.csv)

Fixture file added for reproducible local run:

- `backend/test/fixtures/youtube_smoke/youtube_smoke.csv`

Follow these exact steps:

1. Open `http://127.0.0.1:3000/upload`.
2. Upload `backend/test/fixtures/youtube_smoke/youtube_smoke.csv`.
3. After redirect to `http://127.0.0.1:3000/jobs/[job_id]`, copy the `job_id` from URL.
4. Open FastAPI docs at `http://127.0.0.1:8000/docs#/jobs/run_jobs__job_id__run_post`.
5. In `POST /jobs/{job_id}/run`, click `Try it out`, paste `job_id`, then `Execute`.
6. Confirm response is `202 Accepted` (job status should become `running`).
7. Go back to `http://127.0.0.1:3000/jobs/[job_id]` and refresh the page until status is `completed` and progress reaches `10/10`.
8. Click `Export CSV` and confirm the browser downloads `job_<job_id>_results.csv`.

**Expected result**: job detail page can fetch processed rows successfully and CSV export works.

## Tests

### Overview
Backend tests use `pytest`, currently focused on upload parsing (CSV/XLSX).

### Run
```bash
cd backend
uv sync
PYTHONPATH=. uv run pytest -q
```

## Current structure
```
media-metrics-lab/
|-- backend/
|   |-- main.py
|   |-- app/
|   |   |-- main.py
|   |   |-- core/                  # config, logging
|   |   |-- api/                   # routers and endpoints
|   |   |-- db/
|   |   |   |-- session.py
|   |   |   |-- base.py
|   |   |   `-- models/            # Job / Result models
|   |   `-- services/
|   |       |-- upload/            # file parsing + validation
|   |       |-- jobs/              # job workflow + export
|   |       `-- fetchers/          # platform metric fetchers
|   |-- alembic/
|   |   `-- versions/
|   |-- test/
|   |   |-- test_upload_parsing.py
|   |   `-- fixtures/
|   |-- pyproject.toml
|   |-- uv.lock
|   `-- alembic.ini
|-- frontend/
|   |-- app/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- globals.css
|   |   |-- upload/page.tsx
|   |   |-- jobs/page.tsx
|   |   `-- jobs/[job_id]/page.tsx
|   |-- components/ui/
|   |-- hooks/
|   |-- public/
|   |-- package.json
|   |-- next.config.ts
|   `-- tsconfig.json
`-- README.md
```

## Project Status

- Repository initialised
- MVP scope defined and frozen
- MVP implementation completed (12/12 issues)
- Current phase: stabilization and post-MVP planning
