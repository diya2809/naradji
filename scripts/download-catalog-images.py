#!/usr/bin/env python3
"""Fill missing catalog images from free/open sources (no API key).

Primary: Open Food Facts (structured product DB with images)
Fallback: Lorem Flickr tag photos

Note: Zepto/Blinkit do NOT expose schema.org/Product or a public catalog API.
Their CDN images are commercial assets — do not mass-scrape for redistributing
in another storefront.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "seller-product-catalog.csv"
OUT_DIR = ROOT / "public" / "media" / "catalog"
USER_AGENT = "NaradjiCatalogBot/1.0 (grocery demo; openfoodfacts-compatible)"
TIMEOUT = 25
SLEEP = 0.4

CATEGORY_TAGS = {
    "Dairy Items": "milk,dairy,cheese,butter",
    "Fruits and Vegetables": "fruit,vegetables,produce",
    "Cold and Juices": "juice,soda,beverage",
    "Masalas and Oils": "spices,cooking,oil",
    "Sauces and Spreads": "ketchup,sauce,jam",
    "Tea": "tea,chai,cup",
    "Coffee": "coffee,beans,cup",
    "Cleaning Essentials": "cleaning,detergent,household",
    "Aata": "flour,wheat,grain",
    "Rice Daal": "rice,lentils,dal",
    "Snacks and Munchies": "snacks,chips,cookies",
    "Personal Care": "soap,shampoo,toothpaste",
    "Chicken and Meat and Fish": "chicken,meat,fish",
    "Gift Store": "gift,chocolate,dryfruit",
    "Perfumes": "perfume,fragrance,bottle",
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80] or "product"


def image_key(row: dict) -> str:
    title = row["title"]
    pack = (row.get("pack_size") or "").strip()
    if pack:
        title = re.sub(re.escape(pack), "", title, flags=re.I)
    title = re.sub(
        r"\b(\d+(\.\d+)?\s?(kg|g|ml|l|pcs?|pack|bags?|dozen|piece|tray|set|box|tin|jar|cup|bottle|can)\b)",
        "",
        title,
        flags=re.I,
    )
    title = re.sub(r"\s+", " ", title).strip(" -")
    brand = (row.get("brand") or "").strip()
    if brand and title.lower().startswith(brand.lower()):
        base = title
    else:
        base = f"{brand} {title}".strip() or row["title"]
    return slugify(base)


def search_query(row: dict) -> str:
    brand = (row.get("brand") or "").strip()
    title = row["title"]
    pack = (row.get("pack_size") or "").strip()
    if pack:
        title = title.replace(pack, "").strip()
    words = [w for w in re.split(r"\s+", title) if w]
    core = " ".join(words[:6])
    skip = {"local", "local fresh", "local premium", "imported", "assorted"}
    if brand and brand.lower() not in skip and brand.lower() not in core.lower():
        return f"{brand} {core}".strip()
    return core or row["title"]


def http_get(url: str, binary: bool = False):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        data = resp.read()
        if binary:
            return data, resp.headers.get_content_type() or "application/octet-stream", resp.geturl()
        return data.decode("utf-8", errors="replace"), resp.headers.get_content_type(), resp.geturl()


def find_openfoodfacts(query: str) -> str | None:
    params = urllib.parse.urlencode(
        {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": 10,
            "fields": "product_name,brands,image_front_url,image_url",
        }
    )
    url = f"https://world.openfoodfacts.org/cgi/search.pl?{params}"
    try:
        body, _, _ = http_get(url)
        data = json.loads(body)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    for product in data.get("products") or []:
        img = product.get("image_front_url") or product.get("image_url")
        if img and img.startswith("http"):
            return img
    return None


def find_loremflickr(row: dict) -> str:
    tags = CATEGORY_TAGS.get(row["category"], "grocery,food,product")
    q = search_query(row)
    extra = ",".join(re.findall(r"[A-Za-z]{3,}", q)[:2])
    tag = ",".join(t for t in f"{extra},{tags}".split(",") if t)[:80]
    lock = int(hashlib.md5(image_key(row).encode()).hexdigest()[:8], 16) % 100000
    return f"https://loremflickr.com/800/800/{urllib.parse.quote(tag)}/all?lock={lock}"


def ext_from_type_or_url(content_type: str, url: str) -> str:
    ct = (content_type or "").split(";")[0].strip().lower()
    mapping = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/avif": ".avif",
    }
    if ct in mapping:
        return mapping[ct]
    path = urllib.parse.urlparse(url).path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"


def local_path_exists(image_path: str) -> bool:
    if not image_path:
        return False
    return (ROOT / "public" / image_path.lstrip("/")).exists()


def write_csv(rows: list[dict]) -> None:
    fieldnames = [
        "category",
        "title",
        "brand",
        "pack_size",
        "unit",
        "price_inr",
        "inventory",
        "short_description",
        "aliases",
        "image_path",
        "image_url",
        "image_source",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in fieldnames})


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    cache: dict[str, dict[str, str]] = {}
    total = len(rows)
    ok = 0
    fail = 0
    skipped = 0

    for i, row in enumerate(rows):
        key = image_key(row)
        print(f"[{i + 1}/{total}] {row['title'][:60]} → {key}")

        if local_path_exists(row.get("image_path", "")):
            cache[key] = {
                "image_path": row["image_path"],
                "image_url": row.get("image_url", ""),
                "image_source": row.get("image_source") or "existing",
            }
            skipped += 1
            continue

        if key in cache and cache[key].get("image_path"):
            meta = cache[key]
        else:
            existing = list(OUT_DIR.glob(f"{key}.*"))
            if existing:
                meta = {
                    "image_path": f"/media/catalog/{existing[0].name}",
                    "image_url": row.get("image_url", ""),
                    "image_source": "existing",
                }
                cache[key] = meta
            else:
                candidates: list[tuple[str, str]] = []
                off = find_openfoodfacts(search_query(row))
                if off:
                    candidates.append((off, "openfoodfacts"))
                candidates.append((find_loremflickr(row), "loremflickr"))

                meta = None
                last_err: Exception | None = None
                for url, source in candidates:
                    try:
                        data, content_type, final_url = http_get(url, binary=True)
                        if not data or len(data) < 800:
                            raise ValueError("empty image")
                        ext = ext_from_type_or_url(content_type, final_url)
                        file_path = OUT_DIR / f"{key}{ext}"
                        file_path.write_bytes(data)
                        meta = {
                            "image_path": f"/media/catalog/{file_path.name}",
                            "image_url": url if source == "loremflickr" else final_url,
                            "image_source": source,
                        }
                        print(f"  ✓ {source} → {file_path.name}")
                        ok += 1
                        break
                    except Exception as exc:
                        last_err = exc
                        print(f"  … {source} failed: {exc}")
                        time.sleep(SLEEP)

                if meta is None:
                    print(f"  ✗ {last_err}")
                    meta = {"image_path": "", "image_url": "", "image_source": "failed"}
                    fail += 1
                cache[key] = meta
                time.sleep(SLEEP)

        row["image_path"] = cache[key].get("image_path", "")
        row["image_url"] = cache[key].get("image_url", "")
        row["image_source"] = cache[key].get("image_source", "")

        if (i + 1) % 25 == 0:
            write_csv(rows)

    write_csv(rows)
    filled = sum(1 for r in rows if r.get("image_path"))
    print(f"\nDone. filled={filled}/{total} downloaded={ok} skipped={skipped} failed={fail}")
    print(f"CSV: {CSV_PATH}")
    print(f"Images: {OUT_DIR}")


if __name__ == "__main__":
    main()
