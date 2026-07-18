import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export type SellerProductRow = {
  category: string
  title: string
  brand: string
  packSize: string
  unit: string
  priceInr: number
  inventory: number
  shortDescription: string
  aliases: string[]
  slug: string
  imagePath: string
  imageUrl: string
}

/** Prefer CSV next to this module (traced into Vercel functions). docs/ is secondary. */
const BUNDLED_CSV = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  './seller-product-catalog.csv',
)
const DOCS_CSV = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../docs/seller-product-catalog.csv',
)

/** Resolve CSV on local + Vercel without crashing serverless boot. */
function resolveCsvPath(preferred?: string): string | null {
  const candidates = [
    preferred,
    BUNDLED_CSV,
    DOCS_CSV,
    path.join(process.cwd(), 'docs/seller-product-catalog.csv'),
    path.join(process.cwd(), 'src/lib/catalog/seller-product-catalog.csv'),
  ].filter((p): p is string => Boolean(p))

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate
    } catch {
      // ignore
    }
  }
  return null
}

/** Slugify a title/category into a stable URL segment. */
export function slugifyLabel(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function splitAliases(raw: string): string[] {
  return raw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

/** Pure CSV → rows. Assigns unique slugs. */
export function parseSellerCatalogCsv(text: string): SellerProductRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)

  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  const idx = (name: string) => header.indexOf(name)

  const iCategory = idx('category')
  const iTitle = idx('title')
  const iBrand = idx('brand')
  const iPack = idx('pack_size')
  const iUnit = idx('unit')
  const iPrice = idx('price_inr')
  const iInv = idx('inventory')
  const iDesc = idx('short_description')
  const iAliases = idx('aliases')
  const iImagePath = idx('image_path')
  const iImageUrl = idx('image_url')

  const usedSlugs = new Set<string>()
  const rows: SellerProductRow[] = []

  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li])
    const title = (cols[iTitle] || '').trim()
    if (!title) continue

    let slug = slugifyLabel(title) || `product-${li}`
    if (usedSlugs.has(slug)) {
      let n = 2
      while (usedSlugs.has(`${slug}-${n}`)) n++
      slug = `${slug}-${n}`
    }
    usedSlugs.add(slug)

    const priceInr = Number.parseInt(cols[iPrice] || '0', 10)
    const inventory = Number.parseInt(cols[iInv] || '0', 10)

    rows.push({
      category: (cols[iCategory] || 'General').trim(),
      title,
      brand: (cols[iBrand] || '').trim(),
      packSize: (cols[iPack] || '').trim(),
      unit: (cols[iUnit] || 'pack').trim(),
      priceInr: Number.isFinite(priceInr) ? priceInr : 0,
      inventory: Number.isFinite(inventory) ? inventory : 0,
      shortDescription: (cols[iDesc] || '').trim(),
      aliases: splitAliases(cols[iAliases] || ''),
      slug,
      imagePath: (cols[iImagePath] || '').trim(),
      imageUrl: (cols[iImageUrl] || '').trim(),
    })
  }

  return rows
}

/**
 * Load authoritative seller catalog from disk (seed / server only).
 * Never throws on missing file — Vercel serverless must boot even if CSV
 * was not traced into the bundle (Payload DB is the runtime source of truth).
 */
export function loadSellerCatalog(csvPath?: string): SellerProductRow[] {
  const resolved = resolveCsvPath(csvPath)
  if (!resolved) {
    console.warn('[sellerCatalog] CSV not found — returning empty fallback')
    return []
  }
  try {
    const text = fs.readFileSync(resolved, 'utf8')
    return parseSellerCatalogCsv(text)
  } catch (err) {
    console.warn('[sellerCatalog] CSV read failed — returning empty fallback', err)
    return []
  }
}

export function uniqueCategories(rows: SellerProductRow[]): string[] {
  return [...new Set(rows.map((r) => r.category).filter(Boolean))]
}
