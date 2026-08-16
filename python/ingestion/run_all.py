"""Full non-overlapping Python ingest: soccerdata + StatsBomb."""

from __future__ import annotations

import argparse
import json

from ingestion.paths import RAW_ROOT, write_json
from ingestion.soccerdata_bridge import run_soccerdata_ingest
from ingestion.statsbomb_open import ingest_statsbomb


def main() -> None:
    parser = argparse.ArgumentParser(description="Run all Python ingest owners")
    parser.add_argument("--seasons", default="2023,2024,2025")
    parser.add_argument(
        "--limit-matches",
        type=int,
        default=None,
        help="Optional StatsBomb match cap for smoke tests",
    )
    parser.add_argument(
        "--skip-soccerdata",
        action="store_true",
        help="Emergency escape hatch only — not the default path",
    )
    parser.add_argument(
        "--skip-statsbomb",
        action="store_true",
        help="Emergency escape hatch only — not the default path",
    )
    args = parser.parse_args()
    seasons = [int(s.strip()) for s in args.seasons.split(",") if s.strip()]

    report: dict = {"soccerdata": [], "statsbomb": None}

    if not args.skip_soccerdata:
        report["soccerdata"] = run_soccerdata_ingest(seasons)

    if not args.skip_statsbomb:
        report["statsbomb"] = ingest_statsbomb(limit_matches=args.limit_matches)

    write_json(RAW_ROOT / "python_ingest_report.json", report)

    sd_ok = sum(1 for r in report["soccerdata"] if r.get("ok"))
    sd_fail = sum(1 for r in report["soccerdata"] if not r.get("ok"))
    print(f"soccerdata: ok={sd_ok} fail={sd_fail}")
    if report["statsbomb"]:
        print(
            "statsbomb:",
            json.dumps(
                {
                    k: report["statsbomb"][k]
                    for k in (
                        "relevant_competitions",
                        "matches_processed",
                        "event_files",
                        "lineup_files",
                    )
                }
            ),
        )


if __name__ == "__main__":
    main()
