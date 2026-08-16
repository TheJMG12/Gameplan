"""soccerdata slices that do not overlap API-Football fixtures/standings.

Authority (docs/DATA_SOURCES.md):
- ClubElo → Elo ratings
- Understat → top-5 xG / shots
- FBref → Big-5 non-shooting season stats + UEFA advanced season stats
- SoFIFA → player attributes
"""

from __future__ import annotations

import argparse
import time
from typing import Any

from ingestion.paths import (
    CLUB_SEASONS,
    FBREF_BIG5,
    FBREF_UEFA,
    RAW_ROOT,
    UNDERSTAT_TOP5,
    df_to_records,
    write_json,
)


def _sleep() -> None:
    time.sleep(2.0)


def ingest_club_elo() -> dict[str, Any]:
    import soccerdata as sd

    out = RAW_ROOT / "soccerdata" / "clubelo"
    elo = sd.ClubElo()
    table = elo.read_by_date()
    path = write_json(out / "ratings_latest.json", df_to_records(table))
    return {"ok": True, "kind": "clubelo", "path": str(path), "rows": len(table)}


def ingest_understat(seasons: list[int] | None = None) -> list[dict[str, Any]]:
    import soccerdata as sd

    seasons = seasons or CLUB_SEASONS
    results: list[dict[str, Any]] = []
    out_root = RAW_ROOT / "soccerdata" / "understat"

    for league in UNDERSTAT_TOP5:
        for season in seasons:
            _sleep()
            try:
                us = sd.Understat(leagues=league, seasons=season)
                team_match = us.read_team_match_stats()
                shots = us.read_shot_events()
                base = out_root / league.replace(" ", "_") / str(season)
                p1 = write_json(base / "team_match_xg.json", df_to_records(team_match))
                p2 = write_json(base / "shot_events.json", df_to_records(shots))
                results.append(
                    {
                        "ok": True,
                        "kind": "understat",
                        "league": league,
                        "season": season,
                        "paths": [str(p1), str(p2)],
                        "team_match_rows": len(team_match),
                        "shot_rows": len(shots),
                    }
                )
            except Exception as exc:  # noqa: BLE001 — collect per-league failures
                results.append(
                    {
                        "ok": False,
                        "kind": "understat",
                        "league": league,
                        "season": season,
                        "error": str(exc),
                    }
                )
    return results


def ingest_fbref(seasons: list[int] | None = None) -> list[dict[str, Any]]:
    """Big-5 non-shooting stats + UEFA season stats. Never schedule/fixtures."""
    import soccerdata as sd

    seasons = seasons or CLUB_SEASONS
    results: list[dict[str, Any]] = []

    non_shooting = ["standard", "passing", "defense", "possession"]

    for season in seasons:
        _sleep()
        try:
            fb = sd.FBref(leagues=FBREF_BIG5, seasons=season)
            out = RAW_ROOT / "soccerdata" / "fbref" / "big5" / str(season)
            for stat_type in non_shooting:
                _sleep()
                stats = fb.read_team_season_stats(stat_type=stat_type)
                path = write_json(out / f"team_season_{stat_type}.json", df_to_records(stats))
                results.append(
                    {
                        "ok": True,
                        "kind": "fbref-big5",
                        "season": season,
                        "stat_type": stat_type,
                        "path": str(path),
                        "rows": len(stats),
                    }
                )
        except Exception as exc:  # noqa: BLE001
            results.append(
                {"ok": False, "kind": "fbref-big5", "season": season, "error": str(exc)}
            )

    for league in FBREF_UEFA:
        for season in seasons:
            _sleep()
            try:
                fb = sd.FBref(leagues=league, seasons=season)
                out = (
                    RAW_ROOT
                    / "soccerdata"
                    / "fbref"
                    / "uefa"
                    / league.replace(" ", "_")
                    / str(season)
                )
                # UEFA: shooting allowed (Understat does not cover these cups)
                for stat_type in ["standard", "shooting", "passing", "defense"]:
                    _sleep()
                    try:
                        stats = fb.read_team_season_stats(stat_type=stat_type)
                        path = write_json(
                            out / f"team_season_{stat_type}.json", df_to_records(stats)
                        )
                        results.append(
                            {
                                "ok": True,
                                "kind": "fbref-uefa",
                                "league": league,
                                "season": season,
                                "stat_type": stat_type,
                                "path": str(path),
                                "rows": len(stats),
                            }
                        )
                    except Exception as inner:  # noqa: BLE001
                        results.append(
                            {
                                "ok": False,
                                "kind": "fbref-uefa",
                                "league": league,
                                "season": season,
                                "stat_type": stat_type,
                                "error": str(inner),
                            }
                        )
            except Exception as exc:  # noqa: BLE001
                results.append(
                    {
                        "ok": False,
                        "kind": "fbref-uefa",
                        "league": league,
                        "season": season,
                        "error": str(exc),
                    }
                )

    return results


def ingest_sofifa() -> dict[str, Any]:
    import soccerdata as sd

    out = RAW_ROOT / "soccerdata" / "sofifa"
    sf = sd.SoFIFA()
    # Latest available ratings — unique vs operational APIs
    players = sf.read_player_ratings()
    path = write_json(out / "player_ratings_latest.json", df_to_records(players))
    return {"ok": True, "kind": "sofifa", "path": str(path), "rows": len(players)}


def run_soccerdata_ingest(seasons: list[int] | None = None) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    try:
        results.append(ingest_club_elo())
    except Exception as exc:  # noqa: BLE001
        results.append({"ok": False, "kind": "clubelo", "error": str(exc)})

    results.extend(ingest_understat(seasons))
    results.extend(ingest_fbref(seasons))

    try:
        results.append(ingest_sofifa())
    except Exception as exc:  # noqa: BLE001
        results.append({"ok": False, "kind": "sofifa", "error": str(exc)})

    write_json(RAW_ROOT / "soccerdata" / "ingest_manifest.json", results)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Required soccerdata ingest (non-overlapping)")
    parser.add_argument("--seasons", default="2023,2024,2025")
    args = parser.parse_args()
    seasons = [int(s.strip()) for s in args.seasons.split(",") if s.strip()]
    for row in run_soccerdata_ingest(seasons):
        status = "OK" if row.get("ok") else "FAIL"
        print(f"[{status}] {row}")


if __name__ == "__main__":
    main()
