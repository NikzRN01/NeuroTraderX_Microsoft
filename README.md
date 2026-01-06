# NeuroTraderX

NeuroTraderX is a full-stack web app for exploring markets, analyzing portfolios, and generating AI-assisted investing insights.

This repo contains two services:
- **frontend**: Vite + React (served on `http://localhost:8080` in dev, `http://localhost:4173` in preview/Docker)
- **backend**: Flask API (served on `http://localhost:5000`)

## Features

UI features (React):
- **Portfolio dashboard** (overview, allocation, holdings, performance metrics)
- **Markets** (market widgets/data views)
- **News** (ticker-based and general market news)
- **Insights** (stock insights & recommendations)
- **Forecasting** (basic future price / investment projection)
- **Tax tools** (tax liability / optimization views)
- **Auth + onboarding** (register/login + preferences)
- **AI chat** (assistant-style Q&A)

Backend capabilities (Flask):
- Portfolio storage & retrieval (via SQLAlchemy)
- Market/news/insights endpoints consumed by the frontend
- Optional integrations via API keys (see Environment Variables)

## Tech stack

Frontend:
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router, TanStack Query, Recharts

Backend:
- Python 3.11
- Flask + Flask-CORS
- SQLAlchemy / Flask-SQLAlchemy
- pandas, numpy, yfinance

DevOps:
- Docker + Docker Compose
- Azure Container Apps deployment script: `scripts/deploy-aca.ps1`

## Quickstart (Docker Compose — works on any OS)

Prereqs:
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)

1) (Optional but recommended) Create a project-root `.env`:

```dotenv
# OpenRouter (AI chat / strategy)
OPENROUTER_API_KEY=

# Steady API (news)
STEADY_API_TOKEN=

# Database connection string for the backend (preferred). If empty, backend falls back to SQLite.
DB=
```

You can start from the example file:

```bash
cp .env.example .env
```

2) Run the stack:

```bash
docker compose up --build
```

3) Open:
- Frontend: `http://localhost:4173`
- Backend: `http://localhost:5000`

## Local development (no Docker)

### Prereqs

- Node.js 18+ (or Bun) for the frontend
- Python 3.11+ for the backend
- (Optional) PostgreSQL if you want a shared DB; otherwise SQLite works out-of-the-box

### 1) Backend (Flask API)

Environment variables:
- The backend reads the DB connection string from `DB` (preferred) or `DATABASE_URL` (legacy).

Create `server/.env` (recommended):

```bash
cp server/.env.example server/.env
```

Install dependencies:

Windows (PowerShell):

```powershell
cd server
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Initialize tables / verify DB connection (optional but helpful):

```bash
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables created successfully!')"
```

Run the API:

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

### 2) Frontend (Vite + React)

From the repo root:

Using npm:

```bash
npm install
npm run dev
```

Using bun (optional):

```bash
bun install
bun run dev
```

The dev server runs at `http://localhost:8080` (see `vite.config.ts`).

#### Point the frontend at a different API base URL

The frontend uses `VITE_API_BASE_URL` (defaults to `http://localhost:5000`).

Example:

```bash
# macOS/Linux
export VITE_API_BASE_URL="http://localhost:5000"
npm run dev
```

```powershell
# Windows PowerShell
$env:VITE_API_BASE_URL = "http://localhost:5000"
npm run dev
```

## Configuration

### Backend environment variables

Common keys:
- `DB`: SQLAlchemy connection string (PostgreSQL recommended for multi-user; SQLite works for local dev)
- `DATABASE_URL`: legacy alias (optional)
- `CORS_ALLOWED_ORIGINS`: comma-separated list for deployed frontends

Optional integrations:
- `OPENROUTER_API_KEY`: enables AI chat endpoints
- `STEADY_API_TOKEN`: enables news integration
- `FINNHUB_API_KEY`, `TWELVEDATA_API_KEY`, `UPSTOX_ACCESS_TOKEN`, `UPSTOX_INSTRUMENT_MAP`: used by some market data paths

### Database options

- **SQLite (default)**: If `DB` is not set, the backend uses a local SQLite database.
- **PostgreSQL**: Set `DB=postgresql://...`.

For more details, see `server/DATABASE_SETUP.md` and `server/setup.md`.

## Useful scripts

- `npm run build`: builds the frontend
- `npm run preview`: serves the built frontend (default `http://localhost:4173`)
- `npm run lint`: lints the frontend
- `npm run server:pycheck`: basic Python syntax check for key backend files

## Deploy (Azure Container Apps)

See `AZURE_CONTAINER_APPS.md` for the end-to-end PowerShell deployment flow.

## Troubleshooting

- **CORS errors in browser**: ensure backend allows your frontend origin via `CORS_ALLOWED_ORIGINS`.
- **Frontend can’t reach API**: confirm backend is on `http://localhost:5000`, or set `VITE_API_BASE_URL`.
- **Database connection issues**: validate `DB` string and (for Azure/Postgres) include `?sslmode=require` if needed.
