# NeuroTraderX

NeuroTraderX is a full-stack web app for exploring markets, analyzing portfolios, and generating AI-assisted investing insights.

This repo contains two services:
- **frontend**: Vite + React (served on `http://localhost:8080` in dev, `http://localhost:4173` in preview/Docker)
- **backend**: Flask API (served on `http://localhost:5000`)

## Highlights

✅ **Unified Platform:** Portfolio tracking, AI insights, tax optimization, news, and chat in one interface  
✅ **AI-Powered:** Stock predictions with Buy/Hold/Sell recommendations, risk levels, and confidence scores  
✅ **Tax Intelligence:** Advanced capital gains analysis, wash-sale detection, and optimization strategies  
✅ **Smart Search:** Sentiment-enriched news with Azure AI Search (autocomplete, facets, filters)  
✅ **Modern Stack:** React + TypeScript, Flask + SQLAlchemy, Azure AI integrations, Docker-ready  
✅ **Production-Ready:** Clean API contracts, smart caching, graceful fallbacks, cloud-deployable  

## Features

Frontend (React):
- **Portfolio dashboard:** summary, performance trends, asset allocation, top holdings.
- **Markets:** indices overview, mutual fund explorer (CSV or API), TradingView widget.
- **News:** sentiment-enriched feed with Intelligent Search (autocomplete, facets).
- **Insights:** ticker analysis with prediction, recommendation, risk, and confidence; PDF export.
- **Tax Optimization:** capital gains summary, wash-sale detection, lot strategies (FIFO/LIFO/Specific ID), optimization recommendations.
- **AI Chat:** conversational assistant for investment Q&A.
- **Auth + Onboarding:** profile preferences and protected routes.

Backend (Flask):
- **Portfolio & holdings APIs** with SQLAlchemy models (`User`, `Portfolio`, `Watchlist`).
- **Insights pipeline:** Yahoo Finance → Finnhub → mock, plus AI JSON analysis.
- **Market data:** indices overview, stock price, mutual fund price, mutual funds CSV service.
- **News & Search:** fetch from Finnhub, Azure AI Language sentiment, Azure AI Search indexing, search, suggestions, and facets.
- **AI services:** OpenRouter-powered chat and personalized investment strategy.
- **Resilience:** 1-hour symbol cache and configurable CORS.

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

## API Endpoints (selected)

- Portfolio:
  - `GET /portfolio` — list user holdings
  - `POST /portfolio` — add/update holdings
  - `POST /api/holdings/sync` — bulk sync holdings from frontend
- Insights:
  - `POST /api/insights` — ticker insights (live/cached/mock + AI JSON)
  - `POST /investment_strategy` — personalized strategy (OpenRouter)
- Market Data:
  - `GET /market-data` — indices overview
  - `GET /api/stock-price` — current stock price (yfinance)
  - `GET /api/mutual-fund-price` — mutual fund NAV (yfinance)
  - `GET /api/mutual-funds` — mutual funds CSV service
- News & Search:
  - `GET /news` — market/company news with optional sentiment & indexing
  - `GET /api/search/news` — full-text search with filters
  - `GET /api/search/suggestions` — autocomplete suggestions
  - `GET /api/search/facets` — available facets
  - `POST /api/search/init` / `/api/search/recreate` — index management
- AI & Sentiment:
  - `POST /api/chat` — AI assistant Q&A (OpenRouter)
  - `POST /api/sentiment/analyze` — single-text sentiment (Azure AI Language)

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

Core:
- `DB`: SQLAlchemy connection string (PostgreSQL recommended for multi-user; SQLite works for local dev)
- `DATABASE_URL`: legacy alias (optional)
- `CORS_ALLOWED_ORIGINS`: comma-separated list for deployed frontends

AI & Data:
- `OPENROUTER_API_KEY`: enables AI chat, insights, and strategy endpoints
- `FINNHUB_API_KEY`: enables live market news and data fallbacks
- `AI_SEARCH_ENDPOINT`, `AI_SEARCH_KEY`: Azure AI Search (index, search, suggestions, facets)
- `AI_LANGUAGE` (key), `AI_ENDPOINT`: Azure AI Language (news sentiment analysis)
- `TWELVEDATA_API_KEY` (optional), `UPSTOX_ACCESS_TOKEN`, `UPSTOX_INSTRUMENT_MAP` (optional): future broker/data integrations
- `STEADY_API_TOKEN` (optional): placeholder for news providers

Frontend build-time:
- `VITE_API_BASE_URL`: frontend API base URL used at build time

### Database options

- **SQLite (default)**: If `DB` is not set, the backend uses a local SQLite database.
- **PostgreSQL**: Set `DB=postgresql://...`.

For more details, see `server/DATABASE_SETUP.md` and `server/setup.md`.

## Useful scripts

- `npm run build`: builds the frontend
- `npm run preview`: serves the built frontend (default `http://localhost:4173`)
- `npm run lint`: lints the frontend
- `npm run server:pycheck`: basic Python syntax check for key backend files

## Demo Flow

**5-Minute Walkthrough:**

1. **Onboarding** → Sign up and set investment preferences (risk tolerance, goals)
2. **Portfolio** → View summary, performance chart, asset allocation, and top holdings
3. **Insights** → Enter ticker (e.g., AAPL) → get prediction, recommendation, risk level → export PDF
4. **News** → Browse sentiment-enriched feed → use Intelligent Search with autocomplete and filters
5. **Tax Optimization** → Add holdings → view capital gains summary → check wash-sale detection → export CSV
6. **AI Chat** → Ask "Should I increase tech exposure?" → get concise, actionable response

**Practical Outcomes:**
- Faster research with unified data and AI insights
- Clearer decisions with confidence scores and sentiment analysis
- Tax-aware planning with actionable optimization strategies

## Deploy (Azure Container Apps)

See `AZURE_CONTAINER_APPS.md` for the end-to-end PowerShell deployment flow.

## Troubleshooting

- **CORS errors in browser**: ensure backend allows your frontend origin via `CORS_ALLOWED_ORIGINS`.
- **Frontend can’t reach API**: confirm backend is on `http://localhost:5000`, or set `VITE_API_BASE_URL`.
- **Database connection issues**: validate `DB` string and (for Azure/Postgres) include `?sslmode=require` if needed.
