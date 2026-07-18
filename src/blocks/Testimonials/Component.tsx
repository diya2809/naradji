import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { Media } from '@/components/Media'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { Media as MediaType, TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { getGridColumnClasses } from '@/utilities/responsiveLayout'

export const TestimonialsBlock: React.FC<TestimonialsBlockProps & { id?: string | number }> = ({
  desktopColumns,
  headline,
  mobileColumns,
  mobileLayout,
  testimonials,
  textAlign,
}) => {
  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'center'}>
      <BlockSectionHeading className="mb-6" title={headline || 'In their words'} />

      {testimonials?.length ? (
        <div
          className={cn(
            'gap-8',
            getGridColumnClasses(mobileColumns, desktopColumns, 'md:grid-cols-2'),
          )}
        >
          {testimonials.map((item, index) => {
              const avatar = item.avatar as MediaType | null | undefined

              return (
                <figure className="space-y-4" key={item.id ?? index}>
                  {avatar && typeof avatar === 'object' ? (
                    <div className="relative mx-auto size-16 overflow-hidden rounded-full bg-muted md:mx-0">
                      <Media fill imgClassName="object-cover" resource={avatar} />
                    </div>
                  ) : null}
                  <blockquote className="text-lg leading-relaxed">&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption className="space-y-1">
                    <p className="font-medium">{item.author}</p>
                    {item.location ? (
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    ) : null}
                  </figcaption>
                </figure>
              )
            })}
        </div>
      ) : null}
    </BlockWrapper>
  )
}
