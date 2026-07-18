import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'

const { breakpoints } = cssVariables

export const Image: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    height: heightFromProps,
    imgClassName,
    onClick,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    width: widthFromProps,
  } = props

  let width: number | undefined | null
  let height: number | undefined | null
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      height: fullHeight,
      url,
      width: fullWidth,
    } = resource

    width = widthFromProps ?? fullWidth
    height = heightFromProps ?? fullHeight
    alt = altFromResource
    src = url || ''

    if (
      process.env.NODE_ENV !== 'development' &&
      resource.updatedAt &&
      typeof src === 'string' &&
      src.startsWith('/api/media/file/')
    ) {
      const cacheKey = new Date(resource.updatedAt).getTime()
      src = `${src}${src.includes('?') ? '&' : '?'}v=${cacheKey}`
    }
  }

  if (!src) return null

  const isPayloadMedia = typeof src === 'string' && src.startsWith('/api/media/file/')

  const sizes =
    sizeFromProps ??
    Object.entries(breakpoints)
      .map(([, value]) => `(max-width: ${value}px) ${value}px`)
      .join(', ')

  return (
    <NextImage
      alt={alt || ''}
      className={cn(imgClassName)}
      fill={fill}
      fetchPriority={priority ? 'high' : undefined}
      height={!fill ? height || heightFromProps || undefined : undefined}
      onClick={onClick}
      priority={priority}
      quality={priority ? 85 : 75}
      sizes={sizes}
      src={src}
      unoptimized={isPayloadMedia}
      width={!fill ? width || widthFromProps || undefined : undefined}
    />
  )
}
