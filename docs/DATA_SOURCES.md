# Data sources — authoritative ownership (no overlap)

Gameplan ingests **all** of these sources on every full run. Each dataset has **one owner**. Other providers must not rewrite the same facts.

## Authority matrix

| Dataset | Authoritative source | Stored under | Not ingested from |
|---|---|---|---|
| Fixtures / results / schedules | **API-Football** | `data/raw/api-football/{CODE}/{season}/fixtures.json` | football-data, FBref schedule, ESPN, Sofascore, Understat schedule |
| League / group standings | **API-Football** | `…/standings.json` | football-data standings |
| Competition + team ID crosswalk | **football-data.org** | `data/raw/football-data/{CODE}/{season}/crosswalk.json` | (IDs only — no fixtures/tables) |
| Club Elo ratings | **soccerdata ClubElo** | `data/raw/soccerdata/clubelo/` | — |
| Top-5 match xG / shots | **soccerdata Understat** | `data/raw/soccerdata/understat/` | FBref shooting (for top 5) |
| Big-5 non-xG advanced season stats (passing, defense, possession, standard) | **soccerdata FBref** | `data/raw/soccerdata/fbref/big5/` | Understat (different metrics) |
| UEFA cup advanced season stats | **soccerdata FBref** | `data/raw/soccerdata/fbref/uefa/` | Understat (no UEFA coverage) |
| Player attribute ratings | **soccerdata SoFIFA** | `data/raw/soccerdata/sofifa/` | — |
| Event-level match streams + lineups | **StatsBomb open-data** | `data/raw/statsbomb/` | API-Football events for the same open matches |

Correlation across sources happens later via `external_ids` (name/date matching), never by duplicating the same table from two APIs.

## Competitions in scope

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

Club seasons **2023–2025**. World Cup **2022, 2026**.

## Intentionally excluded (redundant)

- football-data.org fixtures & standings dumps  
- soccerdata ESPN / Sofascore / WhoScored / MatchHistory (scores & fixtures overlap API-Football)  
- FBref `schedule` / fixture lists  
- Understat schedule-only pulls  

## Full ingest

```bash
# From repo root — runs Node (AF + FD crosswalk) then Python (soccerdata + StatsBomb)
npm run ingest:all

# Or stepwise:
cd apps/web && npm run ingest -- --max-jobs=6
cd python && python -m ingestion.run_all
```

Protected HTTP (API keys + operational data only):

`POST /api/admin/ingest` with `Authorization: Bearer $CRON_SECRET`

## Attribution

- StatsBomb open-data: cite **StatsBomb** when publishing ([media pack](https://statsbomb.com/media-pack/))
- soccerdata scrapers: respect upstream site ToS / rate limits; we throttle between calls
