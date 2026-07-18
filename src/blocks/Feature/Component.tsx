import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { RichText } from '@/components/RichText'
import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import type { FeatureBlock as FeatureBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

export const FeatureBlock: React.FC<FeatureBlockProps & { id?: string | number }> = ({
  description,
  enableLink,
  imagePosition,
  link,
  media,
  mobileLayout,
  mobileMedia,
  textAlign,
  title,
}) => {
  const reverse = imagePosition === 'right'

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <div
        className={cn(
          'grid items-center gap-8 md:grid-cols-2',
          reverse && 'md:[&>*:first-child]:order-2',
        )}
      >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {media && typeof media === 'object' ? (
              <ResponsiveMedia
                desktop={media}
                fill
                imgClassName="object-cover object-center"
                mobile={mobileMedia}
              />
            ) : null}
          </div>

          <div className="space-y-4">
            <BlockSectionHeading title={title || 'Spotlight'} />
            {description ? (
              <div className="text-muted-foreground">
                <RichText data={description} enableGutter={false} />
              </div>
            ) : null}
            {enableLink && link ? <CMSLink {...link} /> : null}
          </div>
      </div>
    </BlockWrapper>
  )
}
