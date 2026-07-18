import type { Config } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(slug: T, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

const globalCache = new Map<string, () => Promise<Config['globals'][Global]>>()

/**
 * Returns a stable unstable_cache function per global slug + depth.
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) => {
  const key = `${slug}:${depth}`

  if (!globalCache.has(key)) {
    globalCache.set(
      key,
      unstable_cache(async () => getGlobal<T>(slug, depth), [key], {
        tags: [`global_${slug}`],
      }),
    )
  }

  return globalCache.get(key)!
}
