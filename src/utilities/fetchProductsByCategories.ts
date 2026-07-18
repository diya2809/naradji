import type { Category, Product } from '@/payload-types'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { DefaultDocumentIDType } from 'payload'
import { getPayload } from 'payload'

import { listingProductPopulate, listingProductSelect } from '@/utilities/fetchListingProducts'
import type { ListingProduct } from '@/types/storefront'

type CategoryRef = string | Category

export function flattenCategoryIds(
  categories: CategoryRef[] | null | undefined,
): DefaultDocumentIDType[] | null {
  if (!categories?.length) return null

  return categories.map((category) => (typeof category === 'object' ? category.id : category))
}

type FetchProductsByCategoriesArgs = {
  categoryIds?: DefaultDocumentIDType[] | null
  limit?: number
  sort?: string
}

async function fetchProductsByCategoriesImpl({
  categoryIds,
  limit = 10,
  sort,
}: FetchProductsByCategoriesArgs): Promise<ListingProduct[]> {
  const payload = await getPayload({ config: configPromise })
  const flattenedCategories = categoryIds?.length ? categoryIds : null

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit,
    overrideAccess: false,
    pagination: false,
    populate: listingProductPopulate,
    select: listingProductSelect,
    ...(sort ? { sort } : {}),
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(flattenedCategories
          ? [
              {
                categories: {
                  in: flattenedCategories,
                },
              },
            ]
          : []),
      ],
    },
  })

  return result.docs as ListingProduct[]
}

export async function fetchProductsByCategories(
  args: FetchProductsByCategoriesArgs,
): Promise<ListingProduct[]> {
  const { categoryIds, limit = 10, sort } = args
  const categoryKey = categoryIds?.map(String).sort().join(',') ?? 'all'

  return unstable_cache(
    () => fetchProductsByCategoriesImpl(args),
    ['products-by-category', categoryKey, String(limit), sort ?? 'default'],
    {
      revalidate: 3600,
      tags: ['products'],
    },
  )()
}

export function resolveSelectedProductDocs(
  selectedDocs:
    | {
        relationTo: 'products'
        value: string | Product
      }[]
    | null
    | undefined,
): ListingProduct[] {
  if (!selectedDocs?.length) return []

  return selectedDocs
    .map((doc) => (typeof doc.value === 'object' ? (doc.value as ListingProduct) : null))
    .filter((product): product is ListingProduct => product !== null)
}
