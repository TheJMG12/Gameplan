# Gameplan

Soccer data hub for the top 5 European leagues — ingest, correlate, analyze, compare, predict, and follow news.

## Status

Planning complete. See **[docs/PLAN.md](docs/PLAN.md)** for architecture, phases, and open decisions.

## Top 5 leagues

- Premier League
- La Liga
- Bundesliga
- Serie A
- Ligue 1

## Stack (planned)

- **App:** Next.js (App Router) + TypeScript + Tailwind
- **Data:** Neon Postgres, Upstash Redis
- **Jobs / ML:** Python (`python/`)
- **Sources:** football-data.org (MVP) → API-Football / advanced metrics later; RSS for news

## Docs

| Doc | Purpose |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Product vision, architecture, phases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [AGENTS.md](AGENTS.md) | Guidance for Cursor agents |

## Next build slice

1. Scaffold the Next.js app + database schema
2. football-data.org client with caching
3. Ingest current-season fixtures & standings for the top 5
4. League hub UI + RSS news strip

## Local secrets

Copy `.env.example` → `.env.local` when implementation starts. Never commit real keys.
