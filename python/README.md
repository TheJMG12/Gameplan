# Python ingest (required)

Part of the full Gameplan pipeline — **not optional**.

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m ingestion.run_all
```

Or from repo root (also runs Node operational ingest first):

```bash
npm run ingest:all
```

| Module | Owns |
|---|---|
| `soccerdata_bridge` | ClubElo, Understat (top-5 xG), FBref (non-overlapping advanced), SoFIFA |
| `statsbomb_open` | Event streams + lineups for relevant open competitions |
| `run_all` | Orchestrates both |

See `docs/DATA_SOURCES.md` for the anti-overlap matrix.
