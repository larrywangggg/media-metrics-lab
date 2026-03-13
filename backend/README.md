# Backend Overview

This backend is a FastAPI service for job-based social metrics processing.  
It accepts CSV/XLSX uploads, validates rows, creates jobs, runs fetchers in the background, and exports processed results as CSV.

# Technology Stack

- `FastAPI`
- `SQLAlchemy`
- `PostgreSQL`
- `Alembic`
- `uv`
- `yt-dlp` (optional YouTube implementation mode)

# Project Structure

```text
backend/
├── app/
│   ├── api/                             # HTTP routes (`/jobs`, `/system`)
│   ├── core/                            # Config and logging helpers
│   ├── db/                              # Session setup + ORM models
│   └── services/
│       ├── upload/                      # File parsing and row validation
│       ├── jobs/                        # Job lifecycle/query/export logic
│       └── fetchers/                    # Platform fetcher implementations
├── alembic/                             # DB migration scripts
├── test/                                # Pytest tests and fixtures
├── main.py                              # Uvicorn entrypoint (`main:app`)
├── pyproject.toml                       # Python dependencies
├── uv.lock                              # Locked dependency versions
└── README.md                            # This document
```

# Quick Start

## Prerequisites

- Python `>=3.14`
- PostgreSQL (local or managed)
- `uv` installed

## Installation & Running

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

OpenAPI docs: `http://127.0.0.1:8000/docs`

## Environment Variables

Required:

- `DATABASE_URL` (preferred) or `POSTGRES_URL`

Optional:

- `CORS_ORIGINS` (comma-separated)
- `FRONTEND_ORIGIN` (single-origin fallback)
- `YOUTUBE_FETCHER_IMPL=stub|yt_dlp`
- `YOUTUBE_INNERTUBE_KEY`
- `YOUTUBE_PO_TOKEN`
- `YTDLP_PROXY`
- `YTDLP_COOKIES_FILE`

Example:

```env
DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/mediametrics
YOUTUBE_FETCHER_IMPL=yt_dlp
```

Notes:

- App startup also runs `alembic upgrade head` automatically.
- Startup fails if database connectivity is not available.

# API Surface

- `POST /jobs/upload`  
  Upload CSV/XLSX and create a queued job (invalid rows are returned in preview).
- `POST /jobs/{job_id}/run`  
  Mark job as running and execute processing in background.
- `GET /jobs`  
  Paginated job list.
- `GET /jobs/{job_id}`  
  Job detail.
- `GET /jobs/{job_id}/results`  
  Paginated result rows.
- `GET /jobs/{job_id}/export.csv`  
  CSV export for completed jobs only.
- `GET /system/meta`  
  Runtime metadata for active fetcher implementation.

# Input Contract

Supported upload types:

- `.csv`
- `.xlsx`

Upload constraints:

- Max file size: `10MB`
- Required columns (case-insensitive): `platform`, `url`
- Supported platform values: `youtube`, `tiktok`, `instagram`

Example:

```csv
platform,url
youtube,https://www.youtube.com/watch?v=xxxx
instagram,https://www.instagram.com/p/xxxx
tiktok,https://www.tiktok.com/@user/video/xxxx
```

# Testing & CI/CD

## Local Testing

```bash
cd backend
uv sync
PYTHONPATH=. uv run pytest -q
```

Current test coverage focuses on:

- Upload parsing for CSV/XLSX
- Row validation output shape
- Invalid file-type rejection

## CI Coverage

In `.github/workflows/ci.yml`, the backend CI job:

- Boots PostgreSQL service container
- Installs dependencies with `uv sync --frozen --all-groups`
- Runs migrations (`alembic upgrade head`)
- Executes `pytest -q`

Goal:

- Catch parsing/validation regressions before merge
- Ensure migrations and tests run in a clean environment

# Implemented Features

- Job-based processing pipeline (`queued -> running -> completed/failed`)
- Row-level validation and invalid-row preview on upload
- Background execution via FastAPI `BackgroundTasks`
- Job list/detail/results query APIs
- CSV result export endpoint
- `source_filename` persistence on jobs
- `channel` persistence on result rows
- YouTube fetcher with both `stub` and `yt_dlp` modes

# Planned Features

- Production-grade TikTok/Instagram fetchers (currently stubs)
- Distributed queue + retries/backoff (currently in-process background tasks)
- Authentication and tenant/user isolation
- Broader backend integration coverage beyond upload parsing
