import type { ArchiveBlock as ArchiveBlockProps } from '@/payload-types'
import type { ListingProduct } from '@/types/storefront'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CollectionArchive } from '@/components/CollectionArchive'
import { RichText } from '@/components/RichText'
import {
  fetchProductsByCategories,
  flattenCategoryIds,
  resolveSelectedProductDocs,
} from '@/utilities/fetchProductsByCategories'
import { DefaultDocumentIDType } from 'payload'
import React from 'react'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = async (props) => {
  const {
    categories,
    id,
    introContent,
    limit: limitFromProps,
    mobileLayout,
    populateBy,
    selectedDocs,
    textAlign,
  } = props

  const limit = limitFromProps || 3

  let posts: ListingProduct[] = []

  if (populateBy === 'collection') {
    posts = await fetchProductsByCategories({
      categoryIds: flattenCategoryIds(categories),
      limit,
    })
  } else {
    posts = resolveSelectedProductDocs(selectedDocs)
  }

  return (
    <BlockWrapper id={id ? `block-${id}` : undefined} mobileLayout={mobileLayout} textAlign={textAlign}>
      {introContent ? (
        <div className="mb-8 max-w-3xl">
          <RichText className="ml-0" data={introContent} enableGutter={false} />
        </div>
      ) : null}
      <CollectionArchive posts={posts} />
    </BlockWrapper>
  )
}
