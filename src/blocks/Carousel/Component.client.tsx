'use client'
import type { ListingProduct } from '@/types/storefront'

import { ProductCard } from '@/components/ProductCard'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import React from 'react'

export const CarouselClient: React.FC<{ products: ListingProduct[] }> = ({ products }) => {
  if (!products?.length) return null

  // Duplicate once so wide viewports can loop without shipping 3x the product cards.
  const carouselProducts = [...products, ...products]

  return (
    <Carousel
      className="w-full"
      opts={{ align: 'start', loop: true }}
      plugins={[
        AutoScroll({
          playOnInit: true,
          speed: 1,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent className="-ml-3">
        {carouselProducts.map((product, i) => (
          <CarouselItem
            className="basis-full pl-3 sm:basis-56"
            key={`${product.slug}-${i}`}
          >
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
