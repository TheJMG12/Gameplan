#!/usr/bin/env bash
# Full non-overlapping ingest: API-Football + FD crosswalk + soccerdata + StatsBomb
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Operational ingest (API-Football fixtures/standings + football-data crosswalk)"
cd "$ROOT/apps/web"
npm run ingest -- "$@"

echo "==> Advanced ingest (soccerdata + StatsBomb open-data)"
cd "$ROOT/python"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -e .
python -m ingestion.run_all

echo "==> Done. See data/raw/ and docs/DATA_SOURCES.md"
