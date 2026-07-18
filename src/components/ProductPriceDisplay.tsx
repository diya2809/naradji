'use client'

import { Price } from '@/components/Price'
import { cn } from '@/utilities/cn'
import type { ProductListingPrice } from '@/utilities/productPricing'
import React from 'react'

type Props = {
  pricing: ProductListingPrice
  className?: string
  priceClassName?: string
}

export const ProductPriceDisplay: React.FC<Props> = ({
  pricing,
  className,
  priceClassName = 'text-lg font-semibold text-foreground',
}) => {
  if (pricing.mode === 'unavailable') {
    return <span className="text-sm text-muted-foreground">Price on request</span>
  }

  if (pricing.mode === 'range') {
    return (
      <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
        <Price
          as="span"
          className={priceClassName}
          highestAmount={pricing.highestPrice}
          lowestAmount={pricing.lowestPrice}
        />
        {pricing.maxDiscountPercent ? (
          <span className="text-xs font-semibold text-emerald-700">
            upto {pricing.maxDiscountPercent}% off
          </span>
        ) : null}
      </div>
    )
  }

  const { price, compareAtPrice, discountPercent } = pricing

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <Price amount={price} as="span" className={priceClassName} />
      {typeof compareAtPrice === 'number' ? (
        <Price
          amount={compareAtPrice}
          as="span"
          className="text-sm text-muted-foreground line-through decoration-muted-foreground"
        />
      ) : null}
      {discountPercent ? (
        <span className="text-xs font-semibold text-emerald-700">{discountPercent}% off</span>
      ) : null}
    </div>
  )
}
