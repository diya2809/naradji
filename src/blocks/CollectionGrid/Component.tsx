import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { Badge } from '@/components/ui/badge'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { CollectionGridBlock as CollectionGridBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { getGridColumnClasses } from '@/utilities/responsiveLayout'

export const CollectionGridBlock: React.FC<CollectionGridBlockProps & { id?: string | number }> = ({
  desktopColumns,
  headline,
  items,
  mobileColumns,
  mobileLayout,
  subtext,
  textAlign,
}) => {
  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'center'}>
      <BlockSectionHeading className="mb-3" title={headline || 'Collections'} />
      {subtext ? <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">{subtext}</p> : null}

      {items?.length ? (
        <div
          className={cn(
            'flex flex-wrap justify-center gap-2',
            getGridColumnClasses(mobileColumns, desktopColumns, 'md:grid md:justify-items-center'),
          )}
        >
          {items.map((item, index) => (
            <Badge key={item.id ?? index} variant="secondary">
              {item.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </BlockWrapper>
  )
}
