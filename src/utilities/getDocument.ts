import type { Config } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

const documentCache = new Map<string, () => Promise<Config['collections'][Collection]>>()

/**
 * Returns a stable unstable_cache function mapped with the cache tag for the slug.
 */
export const getCachedDocument = (collection: Collection, slug: string, depth = 0) => {
  const key = `${collection}:${slug}:${depth}`

  if (!documentCache.has(key)) {
    documentCache.set(
      key,
      unstable_cache(async () => getDocument(collection, slug, depth), [key], {
        tags: [`${collection}_${slug}`],
      }),
    )
  }

  return documentCache.get(key)!
}
