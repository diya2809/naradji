import type { Page } from '@/payload-types'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { getPayload } from 'payload'

async function fetchPageBySlug(slug: string, draft: boolean): Promise<Page | null> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] ?? null
}

export const queryPageBySlug = cache(async ({ slug }: { slug: string }): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()

  if (draft) {
    return fetchPageBySlug(slug, true)
  }

  const getCachedPage = unstable_cache(
    () => fetchPageBySlug(slug, false),
    ['page-by-slug', slug],
    {
      tags: [`pages_${slug}`],
    },
  )

  return getCachedPage()
})
