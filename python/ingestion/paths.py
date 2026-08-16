"""Shared paths + helpers for Python ingest."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = REPO_ROOT / "data" / "raw"

# soccerdata league IDs used in this project
UNDERSTAT_TOP5 = [
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
]

FBREF_BIG5 = "Big 5 European Leagues Combined"

# FBref UEFA / international (advanced stats only — no schedules)
FBREF_UEFA = [
    "EUR-Champions League",
    "EUR-Europa League",
    "EUR-Europa Conference League",
]

CLUB_SEASONS = [2023, 2024, 2025]
# soccerdata often accepts int start year or "2324" style; we pass start years.


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_json(path: Path, payload: object) -> Path:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return path


def df_to_records(df) -> list[dict]:
    if df is None:
        return []
    reset = df.reset_index()
    return json.loads(reset.to_json(orient="records", date_format="iso"))
