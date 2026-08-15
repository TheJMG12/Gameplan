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
