"""StatsBomb open-data loader (research / event features).

https://github.com/statsbomb/open-data

Cite StatsBomb when publishing analysis based on this data.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

COMPETITIONS_URL = (
    "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json"
)


def fetch_json(url: str) -> object:
    with urllib.request.urlopen(url, timeout=60) as response:  # noqa: S310 - trusted GitHub raw
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="StatsBomb open-data helper")
    parser.add_argument("--list-competitions", action="store_true")
    parser.add_argument(
        "--out",
        default="../../data/raw/statsbomb",
        help="Output directory relative to python/",
    )
    args = parser.parse_args()

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    competitions = fetch_json(COMPETITIONS_URL)
    target = out_dir / "competitions.json"
    target.write_text(json.dumps(competitions, indent=2), encoding="utf-8")
    print(f"Wrote {target} ({len(competitions) if isinstance(competitions, list) else 'ok'})")

    if args.list_competitions and isinstance(competitions, list):
        for row in competitions:
            print(
                f"{row.get('competition_id')}/{row.get('season_id')}: "
                f"{row.get('competition_name')} — {row.get('season_name')}"
            )

    meta = {
        "source": "statsbomb-open-data",
        "attribution": "StatsBomb",
        "repo": "https://github.com/statsbomb/open-data",
        "note": "Research/event data; not a live feed. Cite StatsBomb in publications.",
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
