# Media Metrics Lab

**Media Metrics Lab** is an extensible platform for collecting, analysing, and exporting social media performance data.

**One-line pitch:**  
Upload a spreadsheet → fetch social metrics → view results → export data.



## Project Vision

Media Metrics Lab is designed as a **long-term analytics platform** for working with social media data at scale.  
The current implementation focuses on a **narrow, reliable MVP** to establish a solid technical and product foundation.

Features beyond the MVP (advanced analytics, richer data models, automation, and integrations) are intentionally deferred.



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
- Storage: Postgre  
- Export: CSV  

## Run Services (Local)

Open two terminals and run:

### Backend
```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tests

### Overview
Backend tests use `pytest` to validate upload parsing (CSV/XLSX) and API behavior.

### Run
```bash
cd backend
uv sync
PYTHONPATH=. uv run pytest -q
```

## Planned structure (updated to current architecture)
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
|   |   `-- fixtures/upload/
|   |-- pyproject.toml
|   |-- uv.lock
|   `-- alembic.ini
|-- frontend/
|   |-- app/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   `-- globals.css
|   |-- public/
|   |-- package.json
|   |-- next.config.ts
|   `-- tsconfig.json
`-- README.md
```

## Project Status

- Repository initialised
- MVP scope defined and frozen
- Implementation in progress
