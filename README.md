# Gameplan

Soccer data hub for the top 5 European leagues — ingest, correlate, analyze, compare, predict, and follow news.

## Status

Decisions locked for stack, seasons, auth, and **Night Match** visual. Add API keys to start live ingest.

See **[docs/PLAN.md](docs/PLAN.md)**.

## Top 5 leagues · last 3 seasons

Premier League · La Liga · Bundesliga · Serie A · Ligue 1  
Seasons (start years): **2023, 2024, 2025**

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind
- **Auth:** Clerk
- **Data:** Neon Postgres, Upstash Redis
- **Jobs / ML:** Python (`python/`)
- **Sources:** API-Football (multi-season) + football-data.org + RSS

## Docs

| Doc | Purpose |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Product vision, architecture, phases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [docs/API_KEYS.md](docs/API_KEYS.md) | **Where to get API tokens** |
| [docs/VISUAL_DIRECTION.md](docs/VISUAL_DIRECTION.md) | Design options A / B / C |
| [AGENTS.md](AGENTS.md) | Guidance for Cursor agents |

## Before we scaffold

1. Create tokens per [docs/API_KEYS.md](docs/API_KEYS.md) and add them as secrets
2. ~~Pick a visual direction~~ → **A Night Match** locked

## App

Phase 0 lives in `apps/web` (Next.js).

## Local secrets

Copy `.env.example` → `.env.local` when implementation starts. Never commit real keys.
