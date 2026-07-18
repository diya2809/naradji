import React from 'react'

import { AppleCardsCarouselClient } from './Component.client'

import type { AppleCardsCarouselBlock as AppleCardsCarouselBlockProps } from '@/payload-types'

export const AppleCardsCarouselBlock: React.FC<
  AppleCardsCarouselBlockProps & {
    id?: string | number
  }
> = (props) => {
  const { cards, heading, mobileLayout, textAlign } = props

  return (
    <AppleCardsCarouselClient
      cards={cards}
      heading={heading}
      mobileLayout={mobileLayout}
      textAlign={textAlign}
    />
  )
}
