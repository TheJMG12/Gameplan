# Gameplan — Soccer Data Hub Plan

Product vision: a hub that ingests multi-source soccer data for the **top 5 European leagues**, correlates entities across sources, surfaces news, enables **player/team comparison**, **match analysis**, and eventually **outcome prediction**.

This document is the working architecture and delivery plan. It deliberately avoids calendar estimates; scope is sequenced by dependency and risk.

---

## Product scope

### In scope (v1 → v2)

| Capability | MVP | Later |
|---|---|---|
| Top 5 leagues: PL, La Liga, Bundesliga, Serie A, Ligue 1 | Yes | Expand competitions |
| Fixtures, results, standings | Yes | Live minute-by-minute |
| Team & player profiles | Yes | Career history, transfers |
| News & updates (league-scoped) | Yes | Sentiment / entity tagging |
| Compare players / teams | Basic stats | Radar + xG / advanced |
| Analyze games | Box score + form context | Shot maps, xG timelines |
| Correlate sources (canonical IDs) | Dual-ID map | Full entity resolution |
| Predict match outcomes | Elo / Poisson baseline | Ensemble + scorelines |
| Multi-source ingestion | football-data.org + API-Football + RSS | Sportmonks, open xG |
| Auth (Clerk) | Sign-in; save comparisons / prefs | Orgs, social graph |
| Historical window | Last **3 seasons** (2023–2025 start years) | Deeper archive if paid |

### Out of scope (for now)

- Betting odds arbitrage / tipster product framing
- Scraping sites that disallow it (FBref/Understat only if ToS + rate limits allow, or via licensed APIs)
- Mobile native apps

---

## Recommended architecture (refined)

Three layers remain correct; implementation should stay **MVP-thin**.

```
┌─────────────────────────────────────────────────────────┐
│  Presentation — Next.js App Router (UI + BFF routes)    │
├─────────────────────────────────────────────────────────┤
│  Domain API — typed services (leagues, fixtures, news,  │
│               compare, analyze, predict)                │
├─────────────────────────────────────────────────────────┤
│  Data — Neon Postgres + Redis cache + raw JSON archive  │
│  Jobs — scheduled ingest (cron / queue), not on request │
└─────────────────────────────────────────────────────────┘
```

### Stack decision (vs. the draft FastAPI + separate React SPA)

| Option | Pros | Cons |
|---|---|---|
| **A. Next.js + Neon + Python worker (recommended)** | One deployable app on Vercel; Python for ML later; shared types at BFF | Split runtime for heavy ML |
| B. FastAPI + React SPA (original draft) | Clean Python-first ML path | Two apps, CORS, more ops |
| C. Next.js-only (TS ML) | Simplest | Weaker for serious modeling |

**Decision for Gameplan:** Option A.

- **App:** Next.js (App Router) + TypeScript + Tailwind
- **DB:** Neon Postgres (Marketplace) via Drizzle or Prisma
- **Cache:** Upstash Redis for API response caching
- **Ingest / train:** Python scripts + optional FastAPI or Vercel cron hitting Node ingest first; graduate to a Python service when models need it
- **Hosting:** Vercel (Fluid Compute / Node), cron for scheduled pulls
- **Auth:** Clerk (`@clerk/nextjs`) via Vercel Marketplace

This keeps the draft’s domain split (ingestion / analytics / prediction) without forcing Celery on day one.

**Confirmed (2026-08-15):** Next.js-first; last 3 seasons; Clerk auth. Visual direction still open (`docs/VISUAL_DIRECTION.md`).

---

## Data sources

### Primary (MVP)

1. **API-Football** — required for **last 3 seasons**, player stats, richer endpoints. Free tier is quota-tight (≈100 req/day); cache + batch ingest. Signup guide: `docs/API_KEYS.md`.
2. **football-data.org** — clean competition/standings/fixtures supplement for top 5; free tier often **current-season limited**. Still useful as a second correlated source.
3. **RSS news** — ESPN, Sky Sports, and league-official feeds where available. Filter/tag by league keywords + team names.

### Secondary (later)

4. **Sportmonks** — paid; prioritize when xG / advanced metrics are product-critical.

### Supplementary (careful)

5. **StatsBomb Open Data** — licensed open event data for research / feature engineering (not live).
6. FBref / Understat — only via allowed means; prefer paid APIs over scraping.

### Top 5 league IDs (reference)

| League | football-data.org | API-Football |
|---|---|---|
| Premier League | PL | 39 |
| La Liga | PD | 140 |
| Bundesliga | BL1 | 78 |
| Serie A | SA | 135 |
| Ligue 1 | FL1 | 61 |

---

## Hardest problem: correlation

Multiple sources use different IDs for the same team/player/match. Plan for this **before** analytics.

### Canonical model

- `Entity` tables with Gameplan UUIDs: `League`, `Season`, `Team`, `Player`, `Fixture`
- `ExternalId` mapping: `(source, external_id) → canonical_id`
- Match fixtures across sources by `(competition, kickoff ± window, home_name≈, away_name≈)` then lock IDs
- Player matching: `(team, season, normalized_name, birthdate?)` with manual override table for collisions

### Ingest contract

Every provider adapter returns the same internal DTOs:

```
FixtureDTO | TeamDTO | PlayerDTO | StandingRowDTO | NewsItemDTO
```

Raw payloads are stored (`raw_payloads`) for replay; processed rows are upserted idempotently.

### Caching policy

| Data | TTL |
|---|---|
| Live scores | 15–30s |
| Today’s fixtures | 5–15 min |
| Standings | 1 hr |
| Historical fixtures | 24 hr+ |
| News | 15–30 min |
| Static team metadata | 24 hr |

Track provider rate-limit headers and daily quota in logs/metrics.

---

## Domain capabilities

### 1. League hub

- Select league → standings, upcoming fixtures, recent results, news strip
- Season switcher

### 2. Compare

- **Teams:** form (last 5), GF/GA, points pace, home/away splits
- **Players:** goals, assists, minutes, rating (when available); radar only when enough shared metrics exist
- Side-by-side table first; charts second

### 3. Analyze games

- Pre-match: form, H2H, standings context, baseline prediction
- Post-match: score, scorers (if available), shot/xG when source supports it
- Avoid dashboard clutter: one match = one analysis composition

### 4. Predict

Phased modeling (accuracy before complexity):

1. **Elo + home advantage** — transparent baseline
2. **Independent Poisson scorelines** from attack/defense rates
3. **Gradient boosting / ensemble** on engineered features (form, elo, xG, H2H)
4. Backtest harness with log-loss / Brier / accuracy; never ship unmeasured models

Store predictions with `model_version` and fixture ID for auditability.

### 5. News

- Aggregate RSS → normalize → dedupe by URL/title similarity
- Attach `league_ids` / `team_ids` via keyword + roster dictionary
- Surface on league pages and match pages (related stories)

---

## Project structure (target)

```
Gameplan/
├── AGENTS.md
├── docs/
│   ├── PLAN.md                 ← this file
│   └── DECISIONS.md            ← ADR log
├── .cursor/rules/
│   ├── project-context.mdc
│   ├── backend-standards.mdc
│   ├── frontend-standards.mdc
│   └── data-pipeline.mdc
├── apps/web/                   ← Next.js app (UI + API routes)
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       │   ├── providers/      ← football-data, api-football, rss
│       │   ├── domain/
│       │   └── db/
│       └── ...
├── packages/                   ← optional shared types later
├── python/
│   ├── ingestion/              ← batch jobs
│   ├── analytics/
│   ├── prediction/
│   └── pyproject.toml
├── data/{raw,processed,models}/
├── notebooks/
├── scripts/
└── .env.example
```

Initial scaffold may flatten to `apps/web` + `python` only; avoid empty ceremony folders.

---

## Delivery phases (by dependency)

### Phase 0 — Foundations

- Repo rules (`AGENTS.md`, Cursor rules), env template, lint/format
- Next.js app shell branded **Gameplan**
- DB schema: leagues, teams, fixtures, standings snapshots, external_ids, news_items
- Provider interface + football-data.org adapter (read-only, cached)

**Exit criteria:** Can list top-5 leagues, standings, and fixtures from DB or live cache without UI polish.

### Phase 1 — League experience + news

- League pages: standings + fixtures + results
- RSS aggregator + league tagging
- Basic team page

**Exit criteria:** User can follow a league matchweek and scan news in one place.

### Phase 2 — Compare & analyze

- Player/team search + comparison tables
- Match detail: context + simple stats
- Canonical ID mapping UI/admin for mismatches (even if internal-only)

**Exit criteria:** Compare two teams or players with shared metrics; open a finished match and see structured analysis.

### Phase 3 — Prediction baseline

- Elo + Poisson services
- Pre-match prediction card on fixtures
- Backtest script on historical seasons
- Persist `predictions` with model version

**Exit criteria:** Measurable baseline metrics on holdout fixtures; UI shows probabilities without overclaiming accuracy.

### Phase 4 — Multi-source + advanced metrics

- API-Football (or Sportmonks) adapter + quota governor
- Merge player stats / live scores
- Optional xG features into models
- Ensemble only if it beats baseline on backtest

**Exit criteria:** Second source correlated; advanced metrics visible where licensed; model improved or baseline retained with evidence.

---

## API surface (sketch)

```
GET  /api/leagues
GET  /api/leagues/:code/standings?season=
GET  /api/leagues/:code/fixtures?from=&to=
GET  /api/teams/:id
GET  /api/players/:id
GET  /api/compare/teams?a=&b=
GET  /api/compare/players?a=&b=
GET  /api/fixtures/:id/analysis
GET  /api/fixtures/:id/prediction
GET  /api/news?league=
POST /api/admin/ingest/run          ← protected / cron
```

All public GETs are rate-limited; secrets never exposed to the client.

---

## Security & ops

- Secrets in env / Vercel env only (`.env.example` documents names, not values)
- No committed API keys
- Provider clients: retries with backoff, hard stop on quota exhaustion
- Idempotent upserts; ingest is scheduled, not user-triggered in production
- Sanitize news HTML; store plain text + link
- Prepared statements via ORM

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Free-tier rate limits | Cache aggressively; schedule off-peak batch pulls |
| Entity mismatch across sources | External ID table + manual overrides early |
| Scraping / ToS | Prefer APIs; treat scrape as last resort |
| Overbuilding ML before data quality | Ship Elo/Poisson first; gate ensemble on backtest |
| Dashboard clutter | One job per page/section; brand-first league hub |
| Scope creep beyond top 5 | Hard-code top 5 until Phase 4 |

---

## Decisions status

| Topic | Status |
|---|---|
| Stack | **Next.js-first** (accepted) |
| API keys | How-to in `docs/API_KEYS.md` — user registering |
| Seasons | **Last 3** (2023, 2024, 2025 start years) |
| Auth | **Clerk** — public browse + signed-in saves |
| Visual | **Open** — choose A/B/C in `docs/VISUAL_DIRECTION.md` |

---

## Immediate next implementation slice

When moving from plan → build (after API keys + visual pick):

1. Scaffold Next.js app + Clerk + DB schema
2. API-Football client (quota-aware) + football-data.org client + cache
3. Ingest top-5 leagues for seasons **2023–2025** (batched)
4. Ship league hub UI (standings + fixtures) in chosen visual direction
5. Add RSS news strip + auth-gated “save comparison”

Do **not** start XGBoost or radar charts until Phase 0–1 exit criteria pass.
