# Architecture decisions

## ADR-001: Monorepo app shape

- **Status:** Accepted
- **Context:** Draft plan proposed FastAPI + separate React SPA + Celery.
- **Decision:** Start with Next.js App Router as the primary app (UI + API routes), Neon Postgres, Upstash Redis, and Python jobs for heavy ingest/ML.
- **Consequences:** Faster MVP on Vercel; Python remains available for modeling without dual-frontend ops. Can extract a FastAPI service later if needed.

## ADR-002: Primary data source for MVP

- **Status:** Accepted
- **Context:** Multiple football APIs with different free tiers.
- **Decision:** Use football-data.org as the first structured data provider for the top 5 leagues; add API-Football when a key and quota plan exist.
- **Consequences:** Narrower live/player-stat coverage early; simpler free-tier bootstrap and cleaner competition coverage.

## ADR-003: Prediction complexity

- **Status:** Accepted
- **Context:** Ensemble XGBoost + Poisson is attractive but depends on clean historical features.
- **Decision:** Ship Elo + Poisson baseline first; only add ensembles if backtests beat the baseline.
- **Consequences:** Transparent early predictions; avoids shipping unvalidated ML.

## ADR-004: News

- **Status:** Accepted
- **Context:** Need league updates without a paid news API.
- **Decision:** Aggregate public RSS feeds; normalize, dedupe, and tag to leagues/teams.
- **Consequences:** Variable feed reliability; no guaranteed full-text article bodies.

## ADR-005: Stack confirmation

- **Status:** Accepted (2026-08-15)
- **Decision:** Next.js-first (App Router) + Neon + Redis + Python jobs. FastAPI-first rejected for MVP.

## ADR-006: Historical window = last 3 seasons

- **Status:** Accepted (2026-08-15)
- **Context:** User wants last 3 seasons for analysis/training. football-data.org free tier is often current-season-only.
- **Decision:** Target seasons labeled by start year: **2023, 2024, 2025** (i.e. 2023/24 → 2025/26 as of Aug 2026). Use **API-Football as the historical + multi-season source**; football-data.org remains useful for clean current competition metadata/standings where available.
- **Consequences:** `API_FOOTBALL_KEY` is effectively required for the 3-season goal. Free tier (100 req/day) forces batched, cached ingest. Verify per-league season availability on first pull; fall back to whatever recent seasons the free plan returns and document gaps.

## ADR-007: Authentication

- **Status:** Accepted (2026-08-15)
- **Decision:** Use **Clerk** (`@clerk/nextjs`) via Vercel Marketplace for sign-in/sign-up.
- **MVP auth uses:** protect saved comparisons, prediction preferences, and admin/ingest tools; browse leagues/fixtures can stay publicly readable with optional sign-in.
- **Consequences:** Need Clerk env keys; middleware on protected routes; user id linked to saved entities in Postgres.

## ADR-009: Competition expansion + multi-source ingest

- **Status:** Accepted (2026-08-16)
- **Decision:** Expand beyond top 5 to include **UEFA Champions League, Europa League, Conference League**, and **FIFA World Cup**. Ingest from **both** API-Football and football-data.org into `data/raw/{source}/…`.
- **Season rules:** Club competitions → 2023–2025; World Cup → tournament years 2022 & 2026.
- **Supplementary:** Optional Python bridges for [soccerdata](https://github.com/probberechts/soccerdata) (ToS-sensitive scrapers) and [StatsBomb open-data](https://github.com/statsbomb/open-data) (research events; cite StatsBomb).
- **Consequences:** Higher quota pressure on free tiers — batch ingest with delays; UI must tolerate empty cup standings.
