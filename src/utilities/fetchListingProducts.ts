import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { getPayload, type DefaultDocumentIDType } from 'payload'

import type { Product } from '@/payload-types'

export const listingProductSelect = {
  title: true,
  slug: true,
  description: true,
  gallery: true,
  meta: true,
  categories: true,
  enableVariants: true,
  priceInINR: true,
  compareAtPriceInINR: true,
  variants: true,
} as const

export const productGalleryPopulate = {
  image: true,
  variantOption: true,
} as const

export const productMetaPopulate = {
  description: true,
  image: true,
  title: true,
} as const

/** Product fields for cart, checkout, and order line items. */
export const lineItemProductPopulate = {
  slug: true,
  title: true,
  gallery: productGalleryPopulate,
  meta: productMetaPopulate,
  enableVariants: true,
  priceInINR: true,
  compareAtPriceInINR: true,
  inventory: true,
} as const

export const lineItemVariantPopulate = {
  title: true,
  inventory: true,
  priceInINR: true,
  compareAtPriceInINR: true,
  options: true,
} as const

/** Fields needed when products/variants are populated on cart items. */
export const cartLineProductPopulate = {
  products: lineItemProductPopulate,
  variants: lineItemVariantPopulate,
} as const

/** Same shape for order line item product/variant population. */
export const orderLineProductPopulate = cartLineProductPopulate

export const listingProductPopulate = {
  gallery: productGalleryPopulate,
  meta: productMetaPopulate,
  variants: {
    priceInINR: true,
    compareAtPriceInINR: true,
    inventory: true,
    options: true,
  },
} as const

/** PDP and detail views: variants + variant type option trees. */
export const productDetailPopulate = {
  variants: lineItemVariantPopulate,
  variantTypes: {
    label: true,
    name: true,
    options: true,
  },
} as const

async function fetchListingProductsImpl(ids: DefaultDocumentIDType[]): Promise<Product[]> {
  if (!ids.length) return []

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    limit: ids.length,
    pagination: false,
    where: {
      and: [{ id: { in: ids } }, { _status: { equals: 'published' } }],
    },
    select: listingProductSelect,
    populate: listingProductPopulate,
  })

  const byId = new Map(result.docs.map((doc) => [String(doc.id), doc]))

  return ids
    .map((id) => byId.get(String(id)))
    .filter((product): product is Product => Boolean(product))
}

/** Full product fields for storefront ProductCard — preserves CMS pick order. */
export const fetchListingProducts = cache(async (ids: DefaultDocumentIDType[]): Promise<Product[]> => {
  if (!ids.length) return []

  const cacheKey = ids.map(String).sort().join(',')

  return unstable_cache(() => fetchListingProductsImpl(ids), ['listing-products', cacheKey], {
    revalidate: 3600,
    tags: ['products'],
  })()
})
