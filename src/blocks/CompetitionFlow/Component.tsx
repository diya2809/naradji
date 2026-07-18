import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { CompetitionFlowBlock as CompetitionFlowBlockProps, Media } from '@/payload-types'

import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { cn } from '@/utilities/cn'
import { getGridColumnClasses } from '@/utilities/responsiveLayout'

export const CompetitionFlowBlock: React.FC<
  CompetitionFlowBlockProps & {
    id?: string | number
  }
> = ({ id, cards, desktopColumns, heading, mobileColumns, mobileLayout, subtitle, textAlign, videoUrl }) => {
  return (
    <BlockWrapper id={id ? `block-${id}` : undefined} mobileLayout={mobileLayout} textAlign={textAlign}>
      <div className="mb-6 text-center">
        <BlockSectionHeading className="mb-3" title={heading || 'How it works'} />
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {videoUrl ? (
        <div className="relative mb-3 w-full overflow-hidden">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            loading="lazy"
            src={videoUrl}
            title={heading || 'Competition flow video'}
          />
        </div>
      ) : cards?.length ? (
        <div
          className={cn(
            'gap-8 md:gap-4',
            getGridColumnClasses(mobileColumns, desktopColumns, 'sm:grid-cols-2 md:grid-cols-3'),
          )}
        >
          {cards.map((card, index) => (
            <article className="space-y-3 text-left" key={index}>
              {card.image && typeof card.image === 'object' ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted md:aspect-3/4">
                  <ResponsiveMedia
                    desktop={card.image as Media}
                    fill
                    imgClassName="object-cover object-center"
                    mobile={card.mobileImage}
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </p>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                {card.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </BlockWrapper>
  )
}
