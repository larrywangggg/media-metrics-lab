# Frontend Overview

This frontend is a Next.js dashboard for running and monitoring social-metrics fetch jobs.  
It supports single-link fetch, bulk-file fetch, job history browsing, and job detail inspection with CSV export.

# Technology Stack

- `Next.js` (App Router)
- `React`
- `TypeScript`
- `Tailwind CSS`
- `lucide-react`

# Project Structure

```text
frontend/
├── app/                                # Route pages (App Router)
│   ├── page.tsx                        # `/` -> Single Fetch
│   ├── bulk/page.tsx                   # `/bulk` -> Bulk Fetch
│   ├── history/page.tsx                # `/history` -> Job History
│   ├── jobs/[job_id]/page.tsx          # `/jobs/:job_id` -> Job Detail
│   ├── campaigns/page.tsx              # `/campaigns` (prototype UI)
│   ├── account/page.tsx                # `/account` (prototype UI)
│   ├── upload/page.tsx                 # Redirects to `/bulk`
│   ├── jobs/page.tsx                   # Redirects to `/bulk`
│   └── layout.tsx                      # Root layout and shell wiring
├── components/
│   ├── dashboard/                      # Main layout, sidebar, page components
│   └── ui/                             # Reusable UI primitives
├── hooks/                              # Shared React hooks
├── lib/                                # App config helpers (API base URL, utils)
├── public/                             # Static assets
├── package.json                        # npm scripts and dependencies
└── README.md                           # This document
```

# Quick Start

## Prerequisites

- Node.js `>=20`
- npm
- Running backend service (default expected at `http://127.0.0.1:8000`)

## Installation & Running

```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000" > .env.local
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open: `http://127.0.0.1:3000`

## Required Environment Variable

- `NEXT_PUBLIC_API_BASE`  
  Base URL for backend API.  
  Example: `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`

The app throws at runtime if this variable is missing.

# Route Status

Working routes:

- `/` (Single Fetch)
- `/bulk` (Bulk Fetch)
- `/history` (Job History)
- `/jobs/[job_id]` (Job Detail)

Redirect routes:

- `/upload` -> `/bulk`
- `/jobs` -> `/bulk`

Prototype/UI-only routes:

- `/campaigns`
- `/account`

# Backend API Dependency

This frontend currently depends on:

- `POST /jobs/upload`
- `POST /jobs/{job_id}/run`
- `GET /jobs`
- `GET /jobs/{job_id}`
- `GET /jobs/{job_id}/results`
- `GET /jobs/{job_id}/export.csv`
- `GET /system/meta` (optional metadata display support)

# Testing & CI/CD

## Local Checks

```bash
cd frontend
npm run lint
npm run build
```

Current state:

- No dedicated frontend unit/E2E test suite is configured yet.
- Lint + production build are used as the quality gate.

## CI Coverage

In `.github/workflows/ci.yml`, the frontend CI job:

- Runs `npm ci`
- Runs `npm run lint`
- Runs `npm run build`

Goal:

- Keep codebase lint-clean
- Prevent merge of code that fails production build

# Implemented Features

- Single-link fetch workflow from UI
- Bulk file upload workflow with progress polling
- Job history listing grouped by recency
- Job detail table view and CSV export action
- Responsive dashboard shell (desktop sidebar + mobile bottom nav)

# Planned Features

- Connect `Campaigns` page to real backend persistence
- Connect `Account` page to real user/account services
- Add frontend automated tests (unit/integration/E2E)
- Improve error states and retry UX for network/fetch failures
- Add richer analytics visualizations beyond table views

# Known Gap

- The bulk-page "Download Template" currently generates a `url`-only CSV,
  while backend upload requires both `platform` and `url`.
