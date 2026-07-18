import type { DisciplineArchiveBlock as DisciplineArchiveBlockProps } from '@/payload-types'

import { BlockWrapper } from '@/components/BlockWrapper'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import { ProductCard } from '@/components/ProductCard'
import { RichText } from '@/components/RichText'
import { listingProductPopulate, listingProductSelect } from '@/utilities/fetchListingProducts'
import { cn } from '@/utilities/cn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const DisciplineArchiveBlock: React.FC<
  DisciplineArchiveBlockProps & {
    id?: string | number
  }
> = async ({
  desktopColumns,
  id,
  introContent,
  limit: limitFromProps,
  mobileColumns,
  mobileLayout,
  showOutOfStock,
  textAlign,
}) => {
  const limit = typeof limitFromProps === 'number' && limitFromProps > 0 ? limitFromProps : 12
  const payload = await getPayload({ config: configPromise })

  const productsResult = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit,
    overrideAccess: false,
    pagination: false,
    populate: listingProductPopulate,
    select: listingProductSelect,
    sort: '-createdAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(showOutOfStock
          ? []
          : [
              {
                or: [{ inventory: { greater_than: 0 } }, { enableVariants: { equals: true } }],
              },
            ]),
      ],
    },
  })

  const products = productsResult.docs

  if (!products.length) return null

  return (
    <BlockWrapper id={id ? `block-${id}` : undefined} mobileLayout={mobileLayout} textAlign={textAlign}>
      {introContent ? (
        <RichText className="mb-8" data={introContent} enableGutter={false} />
      ) : (
        <BlockSectionHeading className="mb-8" title="Shop the edit" />
      )}

      <ul
        className={cn(
          'grid gap-4',
          mobileColumns === '2' ? 'grid-cols-2' : 'grid-cols-1',
          desktopColumns === '2'
            ? 'md:grid-cols-2'
            : desktopColumns === '3'
              ? 'md:grid-cols-3'
              : desktopColumns === '4'
                ? 'md:grid-cols-4'
                : 'md:grid-cols-3 lg:grid-cols-4',
        )}
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </BlockWrapper>
  )
}
