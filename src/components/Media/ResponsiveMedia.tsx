import React from 'react'

import type { Media as MediaType } from '@/payload-types'

import type { Props as MediaProps } from './types'

import { cn } from '@/utilities/cn'

import { Media } from './index'

type ResponsiveMediaProps = Omit<MediaProps, 'resource'> & {
  desktop?: MediaType | string | number | null
  mobile?: MediaType | string | number | null
  /** @deprecated Use `desktop` instead */
  resource?: MediaType | string | number | null
  mobileClassName?: string
  desktopClassName?: string
}

export const ResponsiveMedia: React.FC<ResponsiveMediaProps> = ({
  className,
  desktop,
  desktopClassName,
  mobile,
  mobileClassName,
  resource,
  fill,
  imgClassName,
  priority,
  ...props
}) => {
  const desktopResource = desktop ?? resource
  const mobileResource = mobile

  const hasMobile =
    mobileResource && typeof mobileResource === 'object' && Boolean(mobileResource.url)

  if (!hasMobile) {
    return (
      <Media
        className={className}
        fill={fill}
        imgClassName={imgClassName}
        priority={priority}
        resource={desktopResource ?? undefined}
        {...props}
      />
    )
  }

  if (fill) {
    return (
      <>
        <div className={cn('absolute inset-0 md:hidden', mobileClassName)}>
          <Media
            className="relative size-full"
            fill
            imgClassName={imgClassName}
            priority={priority}
            resource={mobileResource ?? undefined}
            size="100vw"
            {...props}
          />
        </div>
        <div className={cn('absolute inset-0 hidden md:block', desktopClassName)}>
          <Media
            className="relative size-full"
            fill
            imgClassName={imgClassName}
            priority={priority}
            resource={desktopResource ?? undefined}
            size="100vw"
            {...props}
          />
        </div>
      </>
    )
  }

  return (
    <div className={cn(className)}>
      <Media
        className={cn('md:hidden', mobileClassName)}
        imgClassName={imgClassName}
        priority={priority}
        resource={mobileResource ?? undefined}
        {...props}
      />
      <Media
        className={cn('hidden md:block', desktopClassName)}
        imgClassName={imgClassName}
        priority={priority}
        resource={desktopResource ?? undefined}
        {...props}
      />
    </div>
  )
}
