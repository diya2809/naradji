import type { StaticImageData } from 'next/image'

import { BlockWrapper } from '@/components/BlockWrapper'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { ResponsiveMedia } from '@/components/Media/ResponsiveMedia'
import { cn } from '@/utilities/cn'
import React from 'react'
import { RichText } from '@/components/RichText'
import type { MediaBlock as MediaBlockProps } from '@/payload-types'

export const MediaBlock: React.FC<
  MediaBlockProps & {
    id?: string | number
    breakout?: boolean
    captionClassName?: string
    className?: string
    enableGutter?: boolean
    imgClassName?: string
    staticImage?: StaticImageData
    disableInnerContainer?: boolean
  }
> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    mobileLayout,
    mobileMedia,
    staticImage,
    disableInnerContainer,
    textAlign,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <BlockWrapper fullBleed={!enableGutter} mobileLayout={mobileLayout} textAlign={textAlign}>
      <div className={cn(className)}>
        <ResponsiveMedia
          desktop={media}
          imgClassName={cn('h-auto w-full object-contain', imgClassName)}
          mobile={mobileMedia}
          src={staticImage}
        />
        {caption ? (
          !enableGutter && !disableInnerContainer ? (
            <MaxWidthWrapper className={cn('mt-6', captionClassName)}>
              <RichText data={caption} enableGutter={false} />
            </MaxWidthWrapper>
          ) : (
            <div className={cn('mt-6', captionClassName)}>
              <RichText data={caption} enableGutter={false} />
            </div>
          )
        ) : null}
      </div>
    </BlockWrapper>
  )
}
