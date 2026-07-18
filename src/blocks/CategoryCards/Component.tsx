import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { Category, CategoryCardsBlock as CategoryCardsBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

export const CategoryCardsBlock: React.FC<CategoryCardsBlockProps & { id?: string | number }> = ({
  categories,
  columns = '3',
  mobileLayout,
  textAlign,
  title,
}) => {
  const resolved = (categories ?? []).filter(
    (entry): entry is Category => typeof entry === 'object' && entry !== null,
  )

  if (!resolved.length) return null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <BlockSectionHeading className="mb-6" title={title || 'Shop by style'} />
      <ul
        className={cn(
          'grid gap-3',
          columns === '2' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {resolved.map((category) => (
          <li key={category.id}>
            <CMSLink
              appearance="secondary"
              className="w-full"
              label={category.title}
              size="lg"
              type="custom"
              url={`/shop?category=${category.id}`}
            />
          </li>
        ))}
      </ul>
    </BlockWrapper>
  )
}
