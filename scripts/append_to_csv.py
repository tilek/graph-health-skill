#!/usr/bin/env python3
"""Append medical lab rows to a CSV, deduplicating by (date, test_name).

Input format: a JSON array, either on stdin or from --input FILE. Each entry is
an object with the CSV columns as keys (see SKILL.md for the schema). Unknown
keys are ignored; missing keys default to empty. A row with no `flag` gets one
computed from `value` + `reference_low` + `reference_high`.

The CSV is rewritten sorted by (date, test_name). Existing rows with the same
(date, test_name) as an incoming row are overwritten — so re-running the
script on the same PDF is a no-op from the user's perspective.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

COLUMNS = [
    "date",
    "test_name",
    "value",
    "unit",
    "reference_low",
    "reference_high",
    "category",
    "flag",
    "source_file",
]


def _to_float(x):
    if x is None or x == "":
        return None
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def compute_flag(value, low, high):
    v = _to_float(value)
    lo = _to_float(low)
    hi = _to_float(high)
    if v is None:
        return ""
    if lo is not None and v < lo:
        return "L"
    if hi is not None and v > hi:
        return "H"
    if lo is not None or hi is not None:
        return "N"
    return ""


def load_existing(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def save(path: Path, rows: list[dict]) -> None:
    rows = sorted(rows, key=lambda r: (r.get("date", ""), r.get("test_name", "")))
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        for r in rows:
            writer.writerow({c: ("" if r.get(c) is None else r.get(c, "")) for c in COLUMNS})


def normalize_incoming(raw: list[dict]) -> list[dict]:
    normalized = []
    for r in raw:
        row = {c: r.get(c, "") for c in COLUMNS}
        if row["date"] == "" or row["test_name"] == "":
            raise SystemExit(
                f"row is missing required field date or test_name: {r!r}"
            )
        if not row["flag"]:
            row["flag"] = compute_flag(row["value"], row["reference_low"], row["reference_high"])
        normalized.append(row)
    return normalized


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", required=True, help="Path to the CSV file (created if missing)")
    ap.add_argument(
        "--input",
        help="Path to a JSON file with the incoming rows. If omitted, read from stdin.",
    )
    args = ap.parse_args()

    csv_path = Path(args.csv)

    if args.input:
        incoming_raw = json.loads(Path(args.input).read_text())
    else:
        incoming_raw = json.load(sys.stdin)

    if not isinstance(incoming_raw, list):
        raise SystemExit("expected a JSON array of rows")

    incoming = normalize_incoming(incoming_raw)
    existing = load_existing(csv_path)

    index: dict[tuple[str, str], dict] = {
        (r["date"], r["test_name"]): r for r in existing
    }
    new_count = 0
    updated_count = 0
    for r in incoming:
        key = (r["date"], r["test_name"])
        if key in index:
            updated_count += 1
        else:
            new_count += 1
        index[key] = r

    save(csv_path, list(index.values()))

    print(
        f"Wrote {len(index)} rows to {csv_path} "
        f"({new_count} new, {updated_count} updated, {len(incoming)} incoming)"
    )


if __name__ == "__main__":
    main()
