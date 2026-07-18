import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { CategoryListItem } from '@/types/storefront'

async function fetchCategoryDocs(): Promise<CategoryListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
    },
    sort: 'title',
  })

  return result.docs as CategoryListItem[]
}

const getCachedCategoryDocs = unstable_cache(fetchCategoryDocs, ['storefront-categories'], {
  revalidate: 3600,
  tags: ['categories'],
})

export async function getCategories(): Promise<CategoryListItem[]> {
  return getCachedCategoryDocs()
}
