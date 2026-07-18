'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import { CarouselSectionHeader } from '@/components/CarouselSectionHeader'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import type { ReviewsBlock as ReviewsBlockProps } from '@/payload-types'

import { ReviewCard, type ReviewItem } from './ReviewCard'
import { WriteReviewCard } from './WriteReviewCard'

const EMBLA_DURATION = 25

type Props = Pick<ReviewsBlockProps, 'headline' | 'mobileLayout' | 'reviews' | 'textAlign'>

export const ReviewsClient: React.FC<Props> = ({ headline, mobileLayout, reviews, textAlign }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const items = (reviews ?? []) as ReviewItem[]

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!api) return

    onSelect(api)
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onSelect])

  if (!items.length) return null

  const showControls = items.length >= 1

  return (
    <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign ?? 'left'}>
      <CarouselSectionHeader
        canScrollLeft={canScrollPrev}
        canScrollRight={canScrollNext}
        nextLabel="Next review"
        onScrollLeft={() => api?.scrollPrev()}
        onScrollRight={() => api?.scrollNext()}
        previousLabel="Previous review"
        showControls={showControls}
        title={headline || 'What they say'}
      />

      <div className="w-full">
        <Carousel
          className="w-full"
          opts={{
            align: 'start',
            duration: EMBLA_DURATION,
            loop: false,
            slidesToScroll: 1,
          }}
          setApi={setApi}
        >
          <CarouselContent className="-ml-4">
            {items.map((review, index) => (
              <CarouselItem
                className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
                key={`${review.id ?? review.author}-${index}`}
              >
                <ReviewCard review={review} />
              </CarouselItem>
            ))}
            <CarouselItem className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
              <WriteReviewCard />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </BlockWrapper>
  )
}
