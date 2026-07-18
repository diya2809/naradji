import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { productDetailPopulate } from '@/utilities/fetchListingProducts'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

export const queryProductBySlug = cache(
  async ({ slug }: { slug: string }): Promise<Product | null> => {
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'products',
      depth: 3,
      draft,
      limit: 1,
      overrideAccess: draft,
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
      populate: productDetailPopulate,
    })

    return result.docs?.[0] ?? null
  },
)
