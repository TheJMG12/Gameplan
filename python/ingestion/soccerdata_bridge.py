"""Optional soccerdata enrichment bridge.

https://github.com/probberechts/soccerdata

Scrapes Club Elo / FBref / Understat / etc. Enable only when you accept
each site's ToS and rate limits. Not used by the default Node ingest cron.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Optional soccerdata enrichment")
    parser.add_argument(
        "--league",
        default="ENG-Premier League",
        help="soccerdata league name, e.g. ENG-Premier League",
    )
    parser.add_argument("--season", default="2425", help="soccerdata season code, e.g. 2425")
    parser.add_argument(
        "--out",
        default="../../data/raw/soccerdata",
        help="Output directory relative to python/",
    )
    args = parser.parse_args()

    try:
        import soccerdata as sd
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "soccerdata is not installed. Run: pip install soccerdata\n"
            "See https://github.com/probberechts/soccerdata"
        ) from exc

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    # ClubElo is a lightweight, analytics-friendly starter.
    elo = sd.ClubElo()
    table = elo.read_by_date()
    target = out_dir / "clubelo_latest.json"
    table.reset_index().to_json(target, orient="records", date_format="iso")
    print(f"Wrote {target}")

    meta = {
        "source": "soccerdata",
        "note": "Optional enrichment only; cite upstream sites; respect ToS.",
        "league_requested": args.league,
        "season_requested": args.season,
        "repo": "https://github.com/probberechts/soccerdata",
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
