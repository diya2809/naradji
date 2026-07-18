import { cache } from 'react'

export type LeanProduct = {
  id: string
  title: string
  price: number
  unit: string
  category: string
  aliases: string[]
  slug: string
}

/** Seed + demo fallback — used when Payload is empty or cold. */
export const FALLBACK_CATALOG: LeanProduct[] = [
  {
    id: 'atta',
    title: 'Aashirvaad Atta 5kg',
    price: 289,
    unit: 'bag',
    category: 'staples',
    slug: 'atta',
    aliases: ['atta', 'aata', 'gehun', 'wheat flour', 'flour', 'આટો', 'आटा'],
  },
  {
    id: 'anda',
    title: 'Farm Eggs (12)',
    price: 84,
    unit: 'dozen',
    category: 'dairy',
    slug: 'anda',
    aliases: ['anda', 'ande', 'egg', 'eggs', 'dozen anda', 'ઈંડા', 'अंडा', 'अंडे'],
  },
  {
    id: 'maggi',
    title: 'Maggi 2-Minute Noodles',
    price: 14,
    unit: 'pack',
    category: 'snacks',
    slug: 'maggi',
    aliases: ['maggi', 'maggie', 'noodles', 'मैगी', 'મેગી'],
  },
  {
    id: 'parle-g',
    title: 'Parle-G Gold',
    price: 35,
    unit: 'pack',
    category: 'snacks',
    slug: 'parle-g',
    aliases: ['parle', 'parle-g', 'parleg', 'biscuit', 'biscuits', 'पारले', 'પારલે'],
  },
  {
    id: 'doodh',
    title: 'Amul Taaza Milk 1L',
    price: 64,
    unit: 'litre',
    category: 'dairy',
    slug: 'doodh',
    aliases: ['doodh', 'milk', 'dudh', 'दूध', 'દૂધ'],
  },
  {
    id: 'chawal',
    title: 'India Gate Basmati 1kg',
    price: 165,
    unit: 'kg',
    category: 'staples',
    slug: 'chawal',
    aliases: ['chawal', 'rice', 'basmati', 'चावल', 'ચોખા'],
  },
  {
    id: 'tel',
    title: 'Fortune Sunflower Oil 1L',
    price: 148,
    unit: 'litre',
    category: 'staples',
    slug: 'tel',
    aliases: ['tel', 'oil', 'cooking oil', 'तेल', 'તેલ'],
  },
  {
    id: 'chini',
    title: 'Madhur Sugar 1kg',
    price: 52,
    unit: 'kg',
    category: 'staples',
    slug: 'chini',
    aliases: ['chini', 'sugar', 'sakkar', 'चीनी', 'ખાંડ'],
  },
  {
    id: 'namak',
    title: 'Tata Salt 1kg',
    price: 28,
    unit: 'kg',
    category: 'staples',
    slug: 'namak',
    aliases: ['namak', 'salt', 'नमक', 'મીઠું'],
  },
  {
    id: 'chai',
    title: 'Red Label Tea 250g',
    price: 145,
    unit: 'pack',
    category: 'beverages',
    slug: 'chai',
    aliases: ['chai', 'tea', 'chai patti', 'चाय', 'ચા'],
  },
  {
    id: 'dal',
    title: 'Toor Dal 1kg',
    price: 168,
    unit: 'kg',
    category: 'staples',
    slug: 'dal',
    aliases: ['dal', 'toor', 'arhar', 'daal', 'दाल', 'દાળ'],
  },
  {
    id: 'aloo',
    title: 'Potato 1kg',
    price: 35,
    unit: 'kg',
    category: 'produce',
    slug: 'aloo',
    aliases: ['aloo', 'potato', 'potatoes', 'आलू', 'બટાકા'],
  },
]

function normalizeAliases(
  aliases: unknown,
): string[] {
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

async function loadFromPayload(): Promise<LeanProduct[] | null> {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      limit: 100,
      depth: 0,
      where: {
        _status: { equals: 'published' },
      },
      select: {
        title: true,
        slug: true,
        priceInUSD: true,
        unit: true,
        aliases: true,
        categories: true,
      },
    })

    if (!docs.length) return null

    return docs.map((doc) => {
      const d = doc as {
        id: string
        title?: string
        slug?: string | null
        priceInUSD?: number | null
        unit?: string | null
        aliases?: unknown
      }
      const slug = d.slug || d.id
      const fallback = FALLBACK_CATALOG.find((p) => p.slug === slug || p.id === slug)
      return {
        id: fallback?.id || slug,
        title: d.title || fallback?.title || slug,
        price: typeof d.priceInUSD === 'number' ? d.priceInUSD : (fallback?.price ?? 0),
        unit: d.unit || fallback?.unit || 'unit',
        category: fallback?.category || 'grocery',
        aliases: [...new Set([...(fallback?.aliases || []), ...normalizeAliases(d.aliases), d.title || ''].filter(Boolean))],
        slug,
      }
    })
  } catch {
    return null
  }
}

/** Load catalog once per request; falls back to seeded grocery list. */
export const getCatalog = cache(async (): Promise<LeanProduct[]> => {
  const fromDb = await loadFromPayload()
  return fromDb ?? FALLBACK_CATALOG
})

export function getCatalogSync(): LeanProduct[] {
  return FALLBACK_CATALOG
}
