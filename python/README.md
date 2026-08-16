# Python jobs

Enrichment + research ingest (not the primary live path).

```bash
cd python
python -m venv .venv
source .venv/bin/activate
pip install -e .

# StatsBomb open competitions list → data/raw/statsbomb
python -m ingestion.statsbomb_open --list-competitions

# Optional soccerdata (install extra first)
pip install -e '.[soccerdata]'
python -m ingestion.soccerdata_bridge
```

Primary dual-source ingest lives in `apps/web` (`npm run ingest`). See `docs/DATA_SOURCES.md`.
