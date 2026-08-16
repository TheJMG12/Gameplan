"""StatsBomb open-data ingest — event streams only (authoritative for events).

Downloads competitions relevant to Gameplan scope and all available
matches/events/lineups for those competition-season pairs.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from typing import Any

from ingestion.paths import RAW_ROOT, write_json

BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"

# Substring match against StatsBomb competition_name / competition_gender
RELEVANT_NAME_FRAGMENTS = (
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
    "Champions League",
    "Europa League",
    "Europa Conference",
    "FIFA World Cup",
    "World Cup",
)


def fetch_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "GameplanIngest/0.1"})
    with urllib.request.urlopen(req, timeout=120) as response:  # noqa: S310 — GitHub raw
        return json.loads(response.read().decode("utf-8"))


def is_relevant(row: dict[str, Any]) -> bool:
    name = f"{row.get('competition_name', '')} {row.get('competition_gender', '')}"
    return any(fragment.lower() in name.lower() for fragment in RELEVANT_NAME_FRAGMENTS)


def ingest_statsbomb(limit_matches: int | None = None) -> dict[str, Any]:
    out = RAW_ROOT / "statsbomb"
    competitions = fetch_json(f"{BASE}/competitions.json")
    write_json(out / "competitions.json", competitions)

    relevant = [row for row in competitions if is_relevant(row)]
    write_json(out / "competitions_relevant.json", relevant)

    match_count = 0
    event_files = 0
    lineup_files = 0
    errors: list[str] = []

    for row in relevant:
        comp_id = row["competition_id"]
        season_id = row["season_id"]
        label = f"{row.get('competition_name')}-{row.get('season_name')}"
        try:
            matches = fetch_json(f"{BASE}/matches/{comp_id}/{season_id}.json")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"matches {label}: {exc}")
            continue

        match_dir = out / "matches" / str(comp_id)
        write_json(match_dir / f"{season_id}.json", matches)

        for match in matches:
            if limit_matches is not None and match_count >= limit_matches:
                break
            match_id = match["match_id"]
            match_count += 1
            try:
                events = fetch_json(f"{BASE}/events/{match_id}.json")
                write_json(out / "events" / f"{match_id}.json", events)
                event_files += 1
            except Exception as exc:  # noqa: BLE001
                errors.append(f"events {match_id}: {exc}")
            try:
                lineups = fetch_json(f"{BASE}/lineups/{match_id}.json")
                write_json(out / "lineups" / f"{match_id}.json", lineups)
                lineup_files += 1
            except Exception as exc:  # noqa: BLE001
                errors.append(f"lineups {match_id}: {exc}")

        if limit_matches is not None and match_count >= limit_matches:
            break

    manifest = {
        "ok": True,
        "kind": "statsbomb",
        "relevant_competitions": len(relevant),
        "matches_processed": match_count,
        "event_files": event_files,
        "lineup_files": lineup_files,
        "errors": errors[:50],
        "attribution": "StatsBomb",
        "repo": "https://github.com/statsbomb/open-data",
    }
    write_json(out / "ingest_manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="StatsBomb open-data ingest")
    parser.add_argument(
        "--limit-matches",
        type=int,
        default=None,
        help="Cap matches for smoke tests (default: all relevant)",
    )
    parser.add_argument("--list-competitions", action="store_true")
    args = parser.parse_args()

    if args.list_competitions:
        competitions = fetch_json(f"{BASE}/competitions.json")
        for row in competitions:
            mark = "*" if is_relevant(row) else " "
            print(
                f"{mark} {row.get('competition_id')}/{row.get('season_id')}: "
                f"{row.get('competition_name')} — {row.get('season_name')}"
            )
        return

    manifest = ingest_statsbomb(limit_matches=args.limit_matches)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
