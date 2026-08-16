# Data sources

Gameplan ingests from multiple providers into a shared domain model, then correlates via `external_ids`.

## Live / scheduled providers (primary)

| Source | Env var | Best for | Notes |
|---|---|---|---|
| **API-Football** | `API_FOOTBALL_KEY` | Multi-season fixtures, standings, players | ~100 req/day on free — batch + cache |
| **football-data.org** | `FOOTBALL_DATA_API_TOKEN` | Clean competition metadata, standings | Free often current-season limited |

### Competitions in scope

| Code | Competition | API-Football ID | football-data code |
|---|---|---|---|
| PL | Premier League | 39 | PL |
| PD | La Liga | 140 | PD |
| BL1 | Bundesliga | 78 | BL1 |
| SA | Serie A | 135 | SA |
| FL1 | Ligue 1 | 61 | FL1 |
| CL | UEFA Champions League | 2 | CL |
| EL | UEFA Europa League | 3 | EL |
| ECL | UEFA Conference League | 848 | **UCL** (their code) |
| WC | FIFA World Cup | 1 | WC |

Club competitions use seasons **2023–2025**. World Cup uses tournament years **2022, 2026**.

## Supplementary / research providers

### [probberechts/soccerdata](https://github.com/probberechts/soccerdata)

Python scrapers for Club Elo, ESPN, FBref, Football-Data.co.uk, Sofascore, SoFIFA, Understat, WhoScored.

- Wired under `python/ingestion/soccerdata_bridge.py` as an **optional** enrichment path
- Respect site ToS / robots; prefer rate limits; do **not** enable in production cron by default
- Best for Elo ratings and advanced shot/xG where licensed APIs are missing

### [statsbomb/open-data](https://github.com/statsbomb/open-data) (Hudl/StatsBomb)

Open event-level JSON for selected competitions/seasons.

- Wired under `python/ingestion/statsbomb_open.py`
- Cite **StatsBomb** when publishing analysis (see their README / media pack)
- Excellent for model feature engineering — **not** a live scores feed
- Coverage is selective (not all top-5 matchweeks)

## Ingest flow

```
API-Football ─┐
football-data ┼─► normalize DTOs ─► data/raw/{source}/… ─► (later) Postgres upsert
soccerdata*  ─┤
StatsBomb*   ─┘
* optional / research
```

Run from repo:

```bash
# Node dual-source pull (writes data/raw)
cd apps/web
npm run ingest

# Optional Python enrichment
cd python
pip install -e .
python -m ingestion.statsbomb_open --list-competitions
```

Protected HTTP trigger (needs `CRON_SECRET`):

`POST /api/admin/ingest` with header `Authorization: Bearer $CRON_SECRET`
