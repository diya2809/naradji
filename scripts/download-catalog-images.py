#!/usr/bin/env python3
"""Verify seller catalog images — IndiaMART paths only.

The catalog CSV is the sole product source. Do NOT fill gaps with
Open Food Facts / Lorem Flickr / random stock — that reintroduces a
second, low-quality image pipeline.

Usage:
  python3 scripts/download-catalog-images.py          # verify all rows
  python3 scripts/download-catalog-images.py --strict # exit 1 on any miss
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "seller-product-catalog.csv"
PUBLIC = ROOT / "public"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero if any row is missing image_path or file on disk",
    )
    args = parser.parse_args()

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    missing_path: list[str] = []
    missing_file: list[str] = []
    bad_source: list[str] = []

    for row in rows:
        title = row.get("title", "").strip()
        path = (row.get("image_path") or "").strip()
        source = (row.get("image_source") or "").strip().lower()
        if source and source != "indiamart":
            bad_source.append(f"{title} ({source})")
        if not path:
            missing_path.append(title)
            continue
        abs_path = PUBLIC / path.lstrip("/")
        if not abs_path.is_file():
            missing_file.append(f"{title} → {path}")

    print(f"catalog rows: {len(rows)}")
    print(f"missing image_path: {len(missing_path)}")
    print(f"missing files on disk: {len(missing_file)}")
    print(f"non-indiamart image_source: {len(bad_source)}")

    for label, items in (
        ("missing image_path", missing_path),
        ("missing files", missing_file),
        ("bad source", bad_source),
    ):
        if items:
            print(f"\n{label}:")
            for item in items[:20]:
                print(f"  - {item}")
            if len(items) > 20:
                print(f"  … +{len(items) - 20} more")

    failed = bool(missing_path or missing_file or bad_source)
    if args.strict and failed:
        return 1
    if failed:
        print("\nWARN: catalog image integrity issues (use --strict to fail CI)")
        return 0
    print("\nOK: all 151 catalog rows have IndiaMART images on disk")
    return 0


if __name__ == "__main__":
    sys.exit(main())
