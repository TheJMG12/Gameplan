# Gameplan — Agent Guide

Soccer data hub for the top 5 European leagues: ingest, correlate, analyze, compare, predict, and surface news.

## Read first

- Product & architecture plan: `docs/PLAN.md`
- Architecture decision log: `docs/DECISIONS.md`
- Cursor rules under `.cursor/rules/`

## Product constraints

- **Top 5 + UEFA + World Cup:** PL/PD/BL1/SA/FL1, CL/EL/ECL, WC
- **Last 3 club seasons:** start years `2023,2024,2025` (`INGEST_SEASONS`); WC years `2022,2026`
- **Data quality before ML:** fixtures/standings/news/compare ship before ensemble models
- **Canonical IDs:** never assume provider IDs are global; use `external_ids` mapping
- **No scraping by default:** soccerdata is optional/off-cron; prefer APIs; StatsBomb open-data OK with attribution
- **Secrets:** never commit API keys; use `.env` / Vercel env from `.env.example`
- **Auth:** Clerk — public browse OK; saves/prefs/admin require sign-in

## Preferred stack

- Next.js App Router + TypeScript + Tailwind (UI + BFF)
- Clerk auth
- Neon Postgres + Upstash Redis
- Python under `python/` for ingestion batch jobs and prediction training
- Deploy on Vercel
- API keys guide: `docs/API_KEYS.md`
- Visual options: `docs/VISUAL_DIRECTION.md` — **Night Match (A) accepted**
- App lives in `apps/web`

If a change conflicts with `docs/PLAN.md`, update the plan or add an ADR in `docs/DECISIONS.md`.

## Coding norms

- Typed end-to-end (no implicit `any`; typed Python)
- Provider adapters behind interfaces; retry + rate-limit aware
- Cache external responses per TTL policy in the plan
- Ingest via scheduled jobs / cron, not on every page view
- Conventional Commits

## Do not

- Build Celery/XGBoost/radar UIs before Phase 0–1 foundations exist
- Hard-code provider IDs into UI routes (use Gameplan canonical IDs)
- Add card-heavy dashboard clutter on league/match heroes
- Estimate delivery in days/weeks in docs or commits
