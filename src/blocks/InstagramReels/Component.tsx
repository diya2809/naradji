import React from 'react'

import type { InstagramReelsBlock as InstagramReelsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'

import { InstagramReelsClient } from './Component.client'

export const InstagramReelsBlock: React.FC<
  InstagramReelsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  const { headline, mobileLayout, posts, textAlign } = props

  if (!posts?.length) return null

  return (
    <InstagramReelsClient
      headline={headline}
      mobileLayout={mobileLayout}
      posts={posts}
      textAlign={textAlign}
    />
  )
}
