import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { listingProductPopulate, listingProductSelect } from '@/utilities/fetchListingProducts'

async function fetchShopProductsImpl(): Promise<Product[]> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 48,
    overrideAccess: false,
    pagination: false,
    populate: listingProductPopulate,
    select: listingProductSelect,
    sort: 'title',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs as Product[]
}

const getCachedShopProducts = unstable_cache(fetchShopProductsImpl, ['storefront-shop-products'], {
  revalidate: 3600,
  tags: ['products'],
})

export async function getShopProducts(): Promise<Product[]> {
  return getCachedShopProducts()
}
