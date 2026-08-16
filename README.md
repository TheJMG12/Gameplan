# Gameplan

Soccer data hub — ingest, correlate, analyze, compare, predict, and follow news.

## Status

Stack, seasons, auth, **Night Match** visual, and **non-overlapping multi-source ingest** are locked.

See **[docs/PLAN.md](docs/PLAN.md)** and **[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)**.

## Competitions

Premier League · La Liga · Bundesliga · Serie A · Ligue 1  
UEFA Champions League · Europa League · Conference League  
FIFA World Cup (2022, 2026)  
Club seasons: **2023, 2024, 2025**

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind
- **Auth:** Clerk
- **Data:** Neon Postgres, Upstash Redis
- **Ingest:** Node (API-Football + football-data crosswalk) + Python (soccerdata + StatsBomb) — **all required**

## Docs

| Doc | Purpose |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Product vision, architecture, phases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [docs/API_KEYS.md](docs/API_KEYS.md) | Where to get API tokens |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | **Authority matrix (no overlap)** |
| [docs/VISUAL_DIRECTION.md](docs/VISUAL_DIRECTION.md) | Night Match |
| [AGENTS.md](AGENTS.md) | Guidance for Cursor agents |

## Run locally

```bash
cd apps/web
cp .env.example .env.local   # add API_FOOTBALL_KEY + FOOTBALL_DATA_API_TOKEN
npm install
npm run dev
```

## Full ingest (recommended)

```bash
# From repo root — operational APIs + soccerdata + StatsBomb
npm run ingest:all

# Smaller operational smoke test first:
cd apps/web && npm run ingest -- --max-jobs=4 --codes=PL,CL,WC
```

Writes under `data/raw/{api-football|football-data|soccerdata|statsbomb}/…` with **one owner per dataset**.

## App

Lives in `apps/web`. Visual: **Night Match**.
