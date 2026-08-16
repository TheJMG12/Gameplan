# Gameplan

Soccer data hub for the top 5 European leagues — ingest, correlate, analyze, compare, predict, and follow news.

## Status

Decisions locked for stack, seasons, auth, and **Night Match** visual. Add API keys to start live ingest.

See **[docs/PLAN.md](docs/PLAN.md)**.

## Top 5 leagues · UEFA · World Cup · last 3 club seasons

Premier League · La Liga · Bundesliga · Serie A · Ligue 1  
UEFA Champions League · Europa League · Conference League  
FIFA World Cup (2022, 2026)  
Club seasons (start years): **2023, 2024, 2025**

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind
- **Auth:** Clerk
- **Data:** Neon Postgres, Upstash Redis
- **Jobs / ML:** Python (`python/`) + Node ingest (`npm run ingest`)
- **Sources:** API-Football + football-data.org (+ optional soccerdata / StatsBomb open-data)

## Docs

| Doc | Purpose |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Product vision, architecture, phases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [docs/API_KEYS.md](docs/API_KEYS.md) | **Where to get API tokens** |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Multi-source ingest map |
| [docs/VISUAL_DIRECTION.md](docs/VISUAL_DIRECTION.md) | Design options (Night Match locked) |
| [AGENTS.md](AGENTS.md) | Guidance for Cursor agents |

## Run locally

```bash
cd apps/web
cp .env.example .env.local   # add API_FOOTBALL_KEY + FOOTBALL_DATA_API_TOKEN
npm install
npm run dev
```

Dual-source ingest (writes `data/raw/…`):

```bash
cd apps/web
npm run ingest -- --max-jobs=4 --codes=PL,CL,WC
```

## App

Phase 0+ lives in `apps/web` (Next.js). Visual: **Night Match**.
