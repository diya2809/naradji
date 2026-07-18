import React from 'react'

import type { VideosBlock as VideosBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'

import { VideosClient } from './Component.client'

export const VideosBlock: React.FC<
  VideosBlockProps & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  const { headline, mobileLayout, videos, textAlign } = props

  if (!videos?.length) return null

  return (
    <VideosClient
      headline={headline}
      mobileLayout={mobileLayout}
      videos={videos}
      textAlign={textAlign}
    />
  )
}
