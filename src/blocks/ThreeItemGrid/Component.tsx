import type { Product, ThreeItemGridBlock as ThreeItemGridBlockProps } from '@/payload-types'

import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import { BlockWrapper } from '@/components/BlockWrapper'
import { Grid } from '@/components/Grid'
import { ProductCard } from '@/components/ProductCard'
import { fetchListingProducts } from '@/utilities/fetchListingProducts'
import React from 'react'
import type { DefaultDocumentIDType } from 'payload'

export const ThreeItemGridBlock: React.FC<
  ThreeItemGridBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = async ({ heading, mobileLayout, products, textAlign }) => {
  if (!products?.length) return null

  const productIds = products
    .map((product) => (typeof product === 'object' && product !== null ? product.id : product))
    .filter(Boolean)
    .slice(0, 3)

  if (productIds.length < 3) return null

  const items = await fetchListingProducts(productIds)

  if (items.length < 3) return null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <BlockSectionHeading className="mb-6" title={heading || 'Picked for you'} />
      <Grid className="grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3">
        {items.map((product, index) => (
          <ProductCard imagePriority={index < 3} key={product.id} product={product} />
        ))}
      </Grid>
    </BlockWrapper>
  )
}
