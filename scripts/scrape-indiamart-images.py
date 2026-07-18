#!/usr/bin/env python3
"""Scrape IndiaMART product pack shots using a logged-in session cookie file.

1) Log in at buyer.indiamart.com / dir.indiamart.com in a browser
2) Export cookies to /tmp/indiamart-cookies.json (Playwright storage_state)
   OR pass --cookie-header "name=value; ..."
3) Run:
   .venv-scrape/bin/python scripts/scrape-indiamart-images.py --cookie-header-file /tmp/im-cookies.txt

Cookies are never written into the repo.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "seller-product-catalog.csv"
OUT_DIR = ROOT / "public" / "media" / "catalog"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def slugify(text: str) -> str:
    text = text.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:80]


def image_key(row: dict) -> str:
    title = row.get("title") or ""
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
    title = row.get("title") or ""
    pack = (row.get("pack_size") or "").strip()
    if pack:
        title = title.replace(pack, "").strip()
    skip = {"local", "local fresh", "local premium", "imported", "assorted"}
    words = " ".join(title.split()[:6])
    if brand and brand.lower() not in skip and brand.lower() not in words.lower():
        return f"{brand} {words}".strip()
    return words or row["title"]


def candidate_slugs(row: dict) -> list[str]:
    q = search_query(row)
    words = [w for w in q.split() if len(w) > 2]
    out: list[str] = []
    for s in (
        slugify(q),
        slugify(" ".join(words[:2])) if len(words) >= 2 else "",
        slugify(words[-1]) if words else "",
    ):
        if s and s not in out:
            out.append(s)
    return out


def pick_image(html: str, query: str) -> str | None:
    imgs = re.findall(
        r"https?://[0-9]?\.?imimg\.com[^\"'\s>]+\.(?:jpg|jpeg|png|webp)", html, re.I
    )
    tokens = [t for t in query.lower().split() if len(t) > 2]
    best, best_score = None, -1
    for u in dict.fromkeys(imgs):
        url = u.replace("http://", "https://")
        if re.search(
            r"logo|icon|sprite|placeholder|250x250|125x125|whatsapp-image", url, re.I
        ):
            continue
        score = 0
        if re.search(r"1000x1000", url, re.I):
            score += 300
        if re.search(r"500x500", url, re.I):
            score += 120
        low = url.lower()
        for t in tokens:
            if t in low:
                score += 90
        if score > best_score:
            best_score, best = score, url
    if best_score >= 90:
        return best
    for u in dict.fromkeys(imgs):
        url = u.replace("http://", "https://")
        if not re.search(r"logo|icon|sprite|250x250|125x125", url, re.I):
            return url
    return None


def parse_cookie_header(header: str) -> list[dict]:
    cookies = []
    for part in header.split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        name, value = part.split("=", 1)
        cookies.append(
            {
                "name": name.strip(),
                "value": value.strip(),
                "domain": ".indiamart.com",
                "path": "/",
            }
        )
    return cookies


def download(url: str, key: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": "https://www.indiamart.com/", "Accept": "image/*"},
    )
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = resp.read()
        ctype = (resp.headers.get_content_type() or "").lower()
    if len(data) < 2000:
        raise ValueError("image too small")
    ext = ".jpg"
    if "png" in ctype or url.lower().endswith(".png"):
        ext = ".png"
    elif "webp" in ctype or ".webp" in url.lower():
        ext = ".webp"
    dest = OUT_DIR / f"{key}{ext}"
    for old in OUT_DIR.glob(f"{key}.*"):
        if old != dest:
            old.unlink(missing_ok=True)
    dest.write_bytes(data)
    return f"/media/catalog/{dest.name}"


def write_csv(rows: list[dict]) -> None:
    fields = [
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
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def find_image(page, row: dict) -> tuple[str, str] | None:
    """Use in-page fetch (credentials/cookies) — same method as browser DOM scrape."""
    q = search_query(row)
    urls = [f"https://dir.indiamart.com/impcat/{s}.html" for s in candidate_slugs(row)]
    urls.append(f"https://dir.indiamart.com/search.mp?ss={urllib.parse.quote(q)}")

    result = page.evaluate(
        """async ({ urls, query }) => {
      const pick = (imgs, query) => {
        const tokens = query.toLowerCase().split(/\\s+/).filter(t => t.length > 2);
        let best = null, bestScore = -1;
        for (const u of imgs) {
          const url = String(u).replace(/^http:/,'https:');
          if (/logo|icon|sprite|placeholder|250x250|125x125|whatsapp-image/i.test(url)) continue;
          let score = 0;
          if (/1000x1000/i.test(url)) score += 300;
          if (/500x500/i.test(url)) score += 120;
          const low = url.toLowerCase();
          for (const t of tokens) if (low.includes(t)) score += 90;
          if (score > bestScore) { bestScore = score; best = url; }
        }
        if (bestScore >= 90) return best;
        for (const u of imgs) {
          const url = String(u).replace(/^http:/,'https:');
          if (!/logo|icon|sprite|250x250|125x125/i.test(url)) return url;
        }
        return null;
      };
      for (const url of urls) {
        try {
          const res = await fetch(url, { credentials: 'include', headers: { 'Accept': 'text/html' } });
          if (!res.ok) continue;
          const html = await res.text();
          if (/page not found/i.test(html) && html.length < 20000) continue;
          const imgs = [...html.matchAll(/https?:\\/\\/[0-9]?\\.?imimg\\.com[^"'\\s>]+\\.(?:jpg|jpeg|png|webp)/gi)].map(m => m[0]);
          const img = pick([...new Set(imgs)], query);
          if (img) return { image: img, via: url.includes('/impcat/') ? 'impcat' : 'search' };
        } catch (e) {}
      }
      return null;
    }""",
        {"urls": urls, "query": q},
    )
    if result and result.get("image"):
        return result["image"], result.get("via") or "search"
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cookie-header-file", required=True, help="File with document.cookie text")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    cookie_header = Path(args.cookie_header_file).read_text(encoding="utf-8").strip()
    if not cookie_header:
        raise SystemExit("empty cookie header file")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    by_key: dict[str, dict] = {}
    for r in rows:
        by_key.setdefault(image_key(r), r)

    keys = list(by_key)
    if not args.force:
        keys = [
            k
            for k in keys
            if not (
                by_key[k].get("image_source") == "indiamart"
                and by_key[k].get("image_path")
                and (ROOT / "public" / by_key[k]["image_path"].lstrip("/")).exists()
            )
        ]
    if args.limit:
        keys = keys[: args.limit]

    print(f"Unique products to scrape: {len(keys)} (of {len(by_key)})")
    cache: dict[str, dict] = {}
    ok = fail = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=UA, locale="en-IN", viewport={"width": 1400, "height": 900})
        context.add_cookies(parse_cookie_header(cookie_header))
        page = context.new_page()
        page.goto("https://dir.indiamart.com/", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1000)
        # verify login-ish cookie present
        has_iss = page.evaluate("document.cookie.includes('im_iss=') || document.cookie.includes('ImeshVisitor=')")
        print(f"session_cookie_present={has_iss}")

        for i, key in enumerate(keys, 1):
            row = by_key[key]
            print(f"[{i}/{len(keys)}] {row['title'][:55]} …", end=" ", flush=True)
            try:
                found = find_image(page, row)
                if not found:
                    raise RuntimeError("no image")
                url, via = found
                path = download(url, key)
                cache[key] = {
                    "image_path": path,
                    "image_url": url,
                    "image_source": "indiamart",
                }
                ok += 1
                print(f"✓ {via}")
            except Exception as exc:
                fail += 1
                print(f"✗ {exc}")
            if i % 15 == 0:
                for r in rows:
                    m = cache.get(image_key(r))
                    if m:
                        r.update(m)
                write_csv(rows)
            time.sleep(0.05)

        browser.close()

    for r in rows:
        m = cache.get(image_key(r))
        if m:
            r.update(m)
    write_csv(rows)
    filled = sum(1 for r in rows if r.get("image_source") == "indiamart")
    print(f"\nDone. scraped_ok={ok} failed={fail} csv_indiamart_rows={filled}/{len(rows)}")


if __name__ == "__main__":
    main()
