import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { HighlightCardsBlock as HighlightCardsBlockProps, Media } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { getGridColumnClasses } from '@/utilities/responsiveLayout'

type HighlightCard = NonNullable<HighlightCardsBlockProps['cards']>[number]

const resolveLinkProps = (link?: HighlightCard['link']): React.ComponentProps<typeof CMSLink> => {
  if (!link) {
    return { type: 'custom', url: '/shop', label: 'Explore', appearance: 'link' }
  }

  return {
    ...link,
    appearance: 'link',
    label: link.label ?? 'Explore',
  }
}

export const HighlightCardsBlock: React.FC<HighlightCardsBlockProps & { id?: string | number }> = ({
  cards,
  desktopColumns,
  headline,
  mobileColumns,
  mobileLayout,
  textAlign,
}) => {
  if (!cards?.length) return null

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'center'}>
      <BlockSectionHeading className="mb-6" title={headline || 'Highlights'} />

      <div
        className={cn(
          'gap-8',
          getGridColumnClasses(mobileColumns, desktopColumns, 'md:grid-cols-2'),
        )}
      >
        {cards.map((card, index) => {
          const image = card.image as Media | null | undefined

          return (
            <article className="space-y-4" key={card.id ?? index}>
              {image && typeof image === 'object' ? (
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                  <ResponsiveMedia
                    desktop={image}
                    fill
                    imgClassName="object-cover object-center"
                    mobile={card.mobileImage as Media | null | undefined}
                  />
                </div>
              ) : null}
              <div className="space-y-2 text-left">
                <h3 className="text-xl font-semibold">{card.title}</h3>
                {card.description ? (
                  <p className="text-muted-foreground">{card.description}</p>
                ) : null}
                <CMSLink {...resolveLinkProps(card.link)} />
              </div>
            </article>
          )
        })}
      </div>
    </BlockWrapper>
  )
}
