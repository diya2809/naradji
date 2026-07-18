import type { CarouselBlock as CarouselBlockProps } from '@/payload-types'
import type { ListingProduct } from '@/types/storefront'

import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import { BlockWrapper } from '@/components/BlockWrapper'
import {
  fetchProductsByCategories,
  flattenCategoryIds,
  resolveSelectedProductDocs,
} from '@/utilities/fetchProductsByCategories'
import { fetchListingProducts } from '@/utilities/fetchListingProducts'
import { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { CarouselClient } from './Component.client'

export const CarouselBlock: React.FC<
  CarouselBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const { categories, heading, limit = 3, mobileLayout, populateBy, selectedDocs, textAlign } = props

  let products: ListingProduct[] = []

  if (populateBy === 'collection') {
    products = await fetchProductsByCategories({
      categoryIds: flattenCategoryIds(categories),
      limit: limit || undefined,
    })
  } else if (selectedDocs?.length) {
    const populated = resolveSelectedProductDocs(selectedDocs)

    if (populated.length) {
      products = populated
    } else {
      const ids = selectedDocs
        .map((doc) => (typeof doc.value === 'string' ? doc.value : null))
        .filter((id): id is DefaultDocumentIDType => id !== null)

      products = await fetchListingProducts(ids)
    }
  }

  if (!products?.length) return null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <BlockSectionHeading className="mb-6" title={heading || 'More to love'} />
      <CarouselClient products={products} />
    </BlockWrapper>
  )
}
