import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { RichText } from '@/components/RichText'
import type { CallToActionBlock as CTABlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

export const CallToActionBlock: React.FC<
  CTABlockProps & {
    id?: string | number
    className?: string
  }
> = ({ links, mobileLayout, richText, textAlign }) => {
  const stackOnMobile = textAlign === 'center' || textAlign === 'auto'

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <div
        className={cn(
          'flex flex-col gap-4 rounded-lg bg-background p-6 text-foreground md:flex-row md:items-center md:justify-between',
          stackOnMobile && 'items-center text-center md:text-left',
        )}
      >
        <div className="flex max-w-3xl items-center">
          {richText ? <RichText className="mb-0" data={richText} enableGutter={false} /> : null}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          {(links || []).map(({ link }, i) => {
            return <CMSLink key={i} size="lg" {...link} />
          })}
        </div>
      </div>
    </BlockWrapper>
  )
}
