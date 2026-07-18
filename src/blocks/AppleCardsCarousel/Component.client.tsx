'use client'

import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CarouselSectionHeader } from '@/components/CarouselSectionHeader'
import { RichText } from '@/components/RichText'
import { Card, Carousel } from '@/components/ui/apple-cards-carousel'
import type { Media } from '@/payload-types'
import { isPayloadRichText } from '@/types/lexical'

type CarouselCard = {
  category: string
  title: string
  image?: Media | string | null
  mobileImage?: Media | string | null
  content?: unknown
}

type Props = {
  heading?: string | null
  cards?: CarouselCard[] | null
  mobileLayout?: 'default' | 'compact' | 'hideMobile' | 'hideDesktop' | null
  textAlign?: 'auto' | 'left' | 'center' | 'right' | null
}

const getImageSrc = (image: CarouselCard['image']) => {
  if (!image || typeof image === 'string') return ''
  return image.url || ''
}

export const AppleCardsCarouselClient: React.FC<Props> = ({
  cards,
  heading,
  mobileLayout,
  textAlign,
}) => {
  if (!cards?.length) return null

  const carouselCards = cards.map((item, index) => (
    <Card
      card={{
        category: item.category,
        title: item.title,
        src: getImageSrc(item.image),
        mobileSrc: getImageSrc(item.mobileImage) || undefined,
        content: isPayloadRichText(item.content) ? (
          <div className="rounded-lg bg-muted p-6">
            <RichText data={item.content} enableGutter={false} />
          </div>
        ) : null,
      }}
      index={index}
      key={`${item.title}-${index}`}
    />
  ))

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
      <Carousel
          items={carouselCards}
          renderHeader={(controls) => (
            <CarouselSectionHeader
              {...controls}
              nextLabel="Next collection"
              previousLabel="Previous collection"
              showControls={cards.length > 1}
              title={heading || 'Curated'}
            />
          )}
      />
    </BlockWrapper>
  )
}
