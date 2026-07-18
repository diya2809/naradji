'use client'
import { Product, Variant } from '@/payload-types'
import { productHasSellableVariants } from '@/utilities/productVariantState'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  const searchParams = useSearchParams()

  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')
      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const stockQuantity = useMemo(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        return selectedVariant.inventory || 0
      }
    }
    return product.inventory || 0
  }, [product.enableVariants, selectedVariant, product.inventory])

  if (product.enableVariants && !productHasSellableVariants(product)) {
    return <p className="text-sm text-muted-foreground">Out of stock</p>
  }

  if (product.enableVariants && !selectedVariant) {
    return <p className="text-sm text-muted-foreground">Select a variant</p>
  }

  return (
    <div className="text-sm text-muted-foreground">
      {stockQuantity < 10 && stockQuantity > 0 && <p>Only {stockQuantity} left in stock</p>}
      {(stockQuantity === 0 || !stockQuantity) && <p>Out of stock</p>}
      {stockQuantity >= 10 && <p>In stock</p>}
    </div>
  )
}
