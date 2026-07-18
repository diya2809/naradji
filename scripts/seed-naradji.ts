/**
 * Seed 12 grocery SKUs with aliases into Payload products.
 * Usage: pnpm seed:naradji
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { FALLBACK_CATALOG } from '../src/lib/naradji/catalog'

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function upsertProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  p: (typeof FALLBACK_CATALOG)[number],
  attempt = 0,
): Promise<void> {
  const data = {
    title: p.title,
    slug: p.slug,
    priceInUSD: p.price,
    priceInUSDEnabled: true,
    unit: p.unit,
    inventory: 100,
    aliases: p.aliases.map((alias) => ({ alias })),
    _status: 'published' as const,
  }

  try {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'products',
        id: existing.docs[0].id,
        data,
      })
      payload.logger.info(`updated ${p.slug}`)
    } else {
      await payload.create({
        collection: 'products',
        data,
      })
      payload.logger.info(`created ${p.slug}`)
    }
  } catch (err) {
    if (attempt < 4) {
      await sleep(400 * (attempt + 1))
      return upsertProduct(payload, p, attempt + 1)
    }
    throw err
  }
}

async function main() {
  const payload = await getPayload({ config })

  for (const p of FALLBACK_CATALOG) {
    await upsertProduct(payload, p)
    await sleep(150)
  }

  payload.logger.info('Naradji grocery seed complete (12 SKUs)')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
