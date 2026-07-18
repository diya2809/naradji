import React, { Fragment, type ElementType } from 'react'

import type { Props } from './types'

import { cn } from '@/utilities/cn'

import { Image } from './Image'
import { Video } from './Video'

export const Media: React.FC<Props> = (props) => {
  const { className, fill, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = (htmlElement ?? Fragment) as ElementType

  return (
    <Tag
      {...(htmlElement !== null
        ? {
            className: cn(fill && 'relative', className),
          }
        : {})}
    >
      {isVideo ? <Video {...props} /> : <Image {...props} />}
    </Tag>
  )
}
