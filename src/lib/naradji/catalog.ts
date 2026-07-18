import { cache } from 'react'
import { loadSellerCatalog } from '@/lib/catalog/sellerCatalog'
import { minorToRupees } from '@/lib/currency'

export type LeanProduct = {
  /** Catalog match key (slug). UISpec items[].id uses this. */
  id: string
  /** Payload products document id — required for useCart.addItem. Null on CSV-only fallback. */
  productId: string | null
  title: string
  price: number
  unit: string
  category: string
  aliases: string[]
  slug: string
}

/** Map seller CSV rows → lean voice catalog (single source of truth). */
export function catalogFromSellerCsv(): LeanProduct[] {
  return loadSellerCatalog().map((row) => ({
    id: row.slug,
    productId: null,
    title: row.title,
    price: row.priceInr,
    unit: row.unit,
    category: row.category,
    slug: row.slug,
    aliases: [...new Set([row.title, ...row.aliases].filter(Boolean))],
  }))
}

/**
 * Sync catalog for tests / offline paths.
 * loadSellerCatalog never throws — empty array if CSV missing on Vercel.
 */
export function getFallbackCatalog(): LeanProduct[] {
  try {
    return catalogFromSellerCsv()
  } catch {
    return []
  }
}

export const FALLBACK_CATALOG: LeanProduct[] = getFallbackCatalog()

function normalizeAliases(aliases: unknown): string[] {
  if (!Array.isArray(aliases)) return []
  return aliases
    .map((a) => {
      if (typeof a === 'string') return a
      if (a && typeof a === 'object' && 'alias' in a && typeof (a as { alias: unknown }).alias === 'string') {
        return (a as { alias: string }).alias
      }
      return null
    })
    .filter((a): a is string => Boolean(a))
}

function categoryLabel(categories: unknown): string {
  if (!Array.isArray(categories) || !categories.length) return 'grocery'
  const first = categories[0]
  if (typeof first === 'object' && first && 'title' in first && typeof first.title === 'string') {
    return first.title
  }
  return 'grocery'
}

async function loadFromPayload(): Promise<LeanProduct[] | null> {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })

    const pageSize = 100
    let page = 1
    const lean: LeanProduct[] = []

    for (;;) {
      const result = await payload.find({
        collection: 'products',
        limit: pageSize,
        page,
        depth: 1,
        draft: false,
        overrideAccess: true,
        where: {
          _status: { equals: 'published' },
        },
        select: {
          title: true,
          slug: true,
          priceInINR: true,
          unit: true,
          aliases: true,
          categories: true,
        },
      })

      for (const doc of result.docs) {
        const d = doc as {
          id: string
          title?: string
          slug?: string | null
          priceInINR?: number | null
          unit?: string | null
          aliases?: unknown
          categories?: unknown
        }
        const slug = d.slug || String(d.id)
        const aliases = [...new Set([...normalizeAliases(d.aliases), d.title || ''].filter(Boolean))]
        lean.push({
          id: slug,
          productId: String(d.id),
          title: d.title || slug,
          price: typeof d.priceInINR === 'number' ? minorToRupees(d.priceInINR) : 0,
          unit: d.unit || 'unit',
          category: categoryLabel(d.categories),
          aliases,
          slug,
        })
      }

      if (!result.hasNextPage) break
      page += 1
    }

    return lean.length ? lean : null
  } catch {
    return null
  }
}

/** Load catalog once per request. Payload (CSV-seeded) is authoritative. */
export const getCatalog = cache(async (): Promise<LeanProduct[]> => {
  const fromDb = await loadFromPayload()
  return fromDb ?? getFallbackCatalog()
})

export function getCatalogSync(): LeanProduct[] {
  return getFallbackCatalog()
}
