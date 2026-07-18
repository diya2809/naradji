#!/usr/bin/env node
/**
 * Replace garbage stock photos with IndiaMART product pack shots.
 *
 * Strategy:
 * 1) Open dir.indiamart.com/impcat/{slug}.html when possible
 * 2) Else open search.mp?ss=... and dismiss login modal
 * 3) Pull largest 5.imimg.com product image from DOM
 * 4) Download to public/media/catalog and update CSV
 *
 * Usage: node scripts/scrape-indiamart-images.mjs [--limit N] [--force]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CSV_PATH = path.join(ROOT, 'docs/seller-product-catalog.csv')
const OUT_DIR = path.join(ROOT, 'public/media/catalog')

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const limitIdx = process.argv.indexOf('--limit')
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity

function parseCsv(text) {
  const rows = []
  let i = 0
  let field = ''
  let row = []
  let inQuotes = false
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i += 2
        continue
      }
      if (c === '"') {
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const header = rows[0]
  return rows.slice(1).map((r) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? ''
    })
    return obj
  })
}

function toCsv(rows) {
  const header = [
    'category',
    'title',
    'brand',
    'pack_size',
    'unit',
    'price_inr',
    'inventory',
    'short_description',
    'aliases',
    'image_path',
    'image_url',
    'image_source',
  ]
  const esc = (v) => {
    const s = String(v ?? '')
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  return [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n') + '\n'
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function imageKey(row) {
  let title = row.title || ''
  const pack = (row.pack_size || '').trim()
  if (pack) title = title.replace(new RegExp(pack.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '')
  title = title
    .replace(/\b(\d+(\.\d+)?\s?(kg|g|ml|l|pcs?|pack|bags?|dozen|piece|tray|set|box|tin|jar|cup|bottle|can))\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const brand = (row.brand || '').trim()
  const base =
    brand && title.toLowerCase().startsWith(brand.toLowerCase())
      ? title
      : `${brand} ${title}`.trim() || row.title
  return slugify(base)
}

function searchQuery(row) {
  const brand = (row.brand || '').trim()
  let title = row.title || ''
  const pack = (row.pack_size || '').trim()
  if (pack) title = title.replace(pack, '').trim()
  const skip = new Set(['local', 'local fresh', 'local premium', 'imported', 'assorted'])
  const words = title.split(/\s+/).filter(Boolean).slice(0, 6).join(' ')
  if (brand && !skip.has(brand.toLowerCase()) && !words.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} ${words}`.trim()
  }
  return words || row.title
}

function candidateSlugs(row) {
  const q = searchQuery(row)
  const brand = (row.brand || '').trim()
  const out = new Set()
  out.add(slugify(q))
  // brand + first meaningful product words
  const words = q.split(/\s+/).filter((w) => w.length > 2)
  if (words.length >= 2) out.add(slugify(words.slice(0, 3).join(' ')))
  if (words.length >= 2) out.add(slugify(words.slice(0, 2).join(' ')))
  if (brand && !['local', 'local fresh', 'local premium', 'imported', 'assorted'].includes(brand.toLowerCase())) {
    out.add(slugify(brand))
  }
  return [...out].filter(Boolean)
}

function scoreImage(img, query) {
  const src = img.src || ''
  if (!/imimg\.com/i.test(src)) return -1
  if (/logo|icon|sprite|placeholder|noimage|default-img/i.test(src)) return -1
  const alt = (img.alt || '').toLowerCase()
  const q = query.toLowerCase()
  const tokens = q.split(/\s+/).filter((t) => t.length > 2)
  let score = (img.w || 0) + (img.h || 0)
  for (const t of tokens) {
    if (alt.includes(t)) score += 200
    if (src.toLowerCase().includes(t)) score += 80
  }
  if (/1000x1000|500x500|800x800/i.test(src)) score += 100
  if (/250x250|125x125/i.test(src)) score -= 150
  return score
}

async function dismissModals(page) {
  for (const sel of [
    'button:has-text("Close")',
    '[aria-label="Close"]',
    'button:has-text("×")',
    '.close',
  ]) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 500 })) await el.click({ timeout: 1000 }).catch(() => {})
    } catch {
      /* ignore */
    }
  }
  await page.keyboard.press('Escape').catch(() => {})
}

async function collectImages(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('img')]
      .map((i) => ({
        src: i.currentSrc || i.src || i.getAttribute('data-src') || '',
        alt: i.alt || '',
        w: i.naturalWidth || i.width || 0,
        h: i.naturalHeight || i.height || 0,
      }))
      .filter((x) => x.src && /^https?:/i.test(x.src))
  })
}

async function findImageForProduct(page, row) {
  const query = searchQuery(row)
  const slugs = candidateSlugs(row)

  for (const slug of slugs) {
    const url = `https://dir.indiamart.com/impcat/${slug}.html`
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await dismissModals(page)
      await page.waitForTimeout(1200)
      const title = await page.title()
      if (resp && resp.status() >= 400) continue
      if (/not found|404/i.test(title)) continue
      const imgs = await collectImages(page)
      const ranked = imgs
        .map((img) => ({ img, score: scoreImage(img, query) }))
        .filter((x) => x.score > 100)
        .sort((a, b) => b.score - a.score)
      if (ranked[0]) {
        return { url: ranked[0].img.src, via: `impcat:${slug}`, alt: ranked[0].img.alt }
      }
    } catch {
      /* try next */
    }
  }

  // Search fallback
  const searchUrl = `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(query)}`
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await dismissModals(page)
    await page.waitForTimeout(1500)
    await dismissModals(page)
    // Prefer clicking first proddetail-looking link if present
    const detail = page.locator('a[href*="/proddetail/"]').first()
    if (await detail.count()) {
      await detail.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(1500)
      await dismissModals(page)
    }
    const imgs = await collectImages(page)
    const ranked = imgs
      .map((img) => ({ img, score: scoreImage(img, query) }))
      .filter((x) => x.score > 80)
      .sort((a, b) => b.score - a.score)
    if (ranked[0]) {
      return { url: ranked[0].img.src, via: 'search', alt: ranked[0].img.alt }
    }
  } catch {
    /* ignore */
  }

  // Direct Google-less proddetail guess via IndiaMART search page cards sometimes lazy-load
  return null
}

async function downloadImage(url, destBase) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://www.indiamart.com/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 2000) throw new Error('image too small')
  const ctype = (res.headers.get('content-type') || '').toLowerCase()
  let ext = '.jpg'
  if (ctype.includes('png')) ext = '.png'
  else if (ctype.includes('webp')) ext = '.webp'
  else if (ctype.includes('jpeg') || ctype.includes('jpg')) ext = '.jpg'
  else {
    const m = url.toLowerCase().match(/\.(jpg|jpeg|png|webp)(?:\?|$)/)
    if (m) ext = m[1] === 'jpeg' ? '.jpg' : `.${m[1]}`
  }
  const dest = `${destBase}${ext}`
  // remove prior extensions for this key
  for (const oldExt of ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']) {
    const p = `${destBase}${oldExt}`
    if (p !== dest && fs.existsSync(p)) fs.unlinkSync(p)
  }
  fs.writeFileSync(dest, buf)
  return { dest, ext, bytes: buf.length }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'))
  const byKey = new Map()
  for (const row of rows) {
    const key = imageKey(row)
    if (!byKey.has(key)) byKey.set(key, row)
  }

  let keys = [...byKey.keys()]
  if (!force) {
    keys = keys.filter((key) => {
      const row = byKey.get(key)
      const existing = row.image_source === 'indiamart' && row.image_path
      const fileOk =
        existing && fs.existsSync(path.join(ROOT, 'public', row.image_path.replace(/^\//, '')))
      return !fileOk
    })
  }
  keys = keys.slice(0, Number.isFinite(limit) ? limit : keys.length)

  console.log(`Unique products to scrape: ${keys.length} (of ${byKey.size})`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
    locale: 'en-IN',
  })
  const page = await context.newPage()

  const cache = new Map() // key -> meta
  let ok = 0
  let fail = 0

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const row = byKey.get(key)
    process.stdout.write(`[${i + 1}/${keys.length}] ${row.title.slice(0, 55)} … `)
    try {
      const found = await findImageForProduct(page, row)
      if (!found?.url) throw new Error('no image in DOM')
      const destBase = path.join(OUT_DIR, key)
      const { dest, bytes } = await downloadImage(found.url, destBase)
      const rel = `/media/catalog/${path.basename(dest)}`
      cache.set(key, {
        image_path: rel,
        image_url: found.url,
        image_source: 'indiamart',
      })
      ok++
      console.log(`✓ ${path.basename(dest)} (${bytes}b via ${found.via})`)
    } catch (err) {
      fail++
      console.log(`✗ ${err.message || err}`)
    }
    // checkpoint CSV every 10
    if ((i + 1) % 10 === 0) {
      applyCache(rows, cache)
      fs.writeFileSync(CSV_PATH, toCsv(rows))
    }
  }

  applyCache(rows, cache)
  fs.writeFileSync(CSV_PATH, toCsv(rows))
  await browser.close()

  const filled = rows.filter((r) => r.image_source === 'indiamart').length
  console.log(`\nDone. scraped_ok=${ok} failed=${fail} csv_indiamart_rows=${filled}/${rows.length}`)
}

function applyCache(rows, cache) {
  for (const row of rows) {
    const key = imageKey(row)
    const meta = cache.get(key)
    if (!meta) continue
    row.image_path = meta.image_path
    row.image_url = meta.image_url
    row.image_source = meta.image_source
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
