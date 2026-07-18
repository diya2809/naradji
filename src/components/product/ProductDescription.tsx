'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import {
  ProductReviewsContent,
  ProductReviewsToggle,
} from '@/components/review/ProductReviewsPanel'
import type { ProductReviewsData } from '@/components/review/types'
import { getLineItemPricing, getProductListingPrice } from '@/utilities/productPricing'
import React, { Suspense, useMemo, useState } from 'react'

import { VariantSelector } from './VariantSelector'
import { StockIndicator } from '@/components/product/StockIndicator'
import { SizeChartModal } from '@/components/product/SizeChartModal'
import { Separator } from '@/components/ui/separator'
import { productHasVariants } from '@/utilities/productVariantState'
import { useSearchParams } from 'next/navigation'

type Props = {
  product: Product
  /** Only products with approved reviews receive this prop. */
  reviews?: ProductReviewsData | null
}

export function ProductDescription({ product, reviews = null }: Props) {
  const searchParams = useSearchParams()
  const hasVariants = productHasVariants(product)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (!hasVariants) return undefined

    const variantId = searchParams.get('variant')
    const match = product.variants?.docs?.find((variant) => {
      if (typeof variant !== 'object') return String(variant) === variantId
      return String(variant.id) === variantId
    })

    return match && typeof match === 'object' ? match : undefined
  }, [hasVariants, product.variants?.docs, searchParams])

  const pricing = selectedVariant
    ? getLineItemPricing(product, selectedVariant)
    : getProductListingPrice(product)

  const reviewToggle =
    reviews && reviews.totalReviews > 0 ? (
      <ProductReviewsToggle open={reviewsOpen} onOpenChange={setReviewsOpen} />
    ) : null

  return (
    // Outer column is NOT sticky so expanded reviews can grow and scroll normally.
    <div className="flex flex-col gap-4">
      {/* Buy box only — sticky so cart controls stay reachable */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold md:text-4xl">{product.title}</h1>
          <ProductPriceDisplay pricing={pricing} priceClassName="text-base font-semibold" />
        </div>
        {product.description ? (
          <RichText
            className="text-sm text-muted-foreground"
            data={product.description}
            enableGutter={false}
          />
        ) : null}

        <Separator />
        {hasVariants && (
          <>
            <Suspense fallback={null}>
              <VariantSelector product={product} />
            </Suspense>

            {/* Size Chart + Review toggle under it */}
            <div className="-mt-1 flex flex-col items-start gap-2">
              <SizeChartModal />
              {reviewToggle}
            </div>

            <Separator />
          </>
        )}
        {!hasVariants && reviewToggle}

        <div className="flex items-center justify-between py-1">
          <Suspense fallback={null}>
            <StockIndicator product={product} />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={null}>
            <AddToCart product={product} />
          </Suspense>
        </div>
      </div>

      {/* Expanded reviews OUTSIDE sticky — sticky ancestors clip / break tall content */}
      {reviewsOpen && reviews && reviews.totalReviews > 0 ? (
        <ProductReviewsContent
          averageRating={reviews.averageRating}
          totalReviews={reviews.totalReviews}
          reviews={reviews.reviews ?? []}
        />
      ) : null}
    </div>
  )
}
