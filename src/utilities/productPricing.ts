import { compareAtPriceFieldName, priceFieldName } from '@/lib/inrCurrency'
import type { Product, Variant } from '@/payload-types'

export type ProductListingPrice =
  | {
      mode: 'single'
      price: number
      compareAtPrice?: number
      discountPercent?: number
    }
  | {
      mode: 'range'
      lowestPrice: number
      highestPrice: number
      maxDiscountPercent?: number
    }
  | { mode: 'unavailable' }

const compareAtField = compareAtPriceFieldName
const priceField = priceFieldName

const calcDiscountPercent = (price: number, compareAt: number): number | undefined => {
  if (compareAt <= price) return undefined
  const percent = Math.round(((compareAt - price) / compareAt) * 100)
  return percent > 0 ? percent : undefined
}

const getVariantDocs = (product: Partial<Product>): Variant[] =>
  product.variants?.docs?.filter((v): v is Variant => typeof v === 'object' && v !== null) ?? []

const resolveCompareAt = (variant: Variant | undefined, product: Partial<Product>): number | undefined => {
  if (variant && typeof variant[compareAtField] === 'number') return variant[compareAtField]
  if (typeof product[compareAtField] === 'number') return product[compareAtField]
  return undefined
}

const resolvePrice = (variant: Variant | undefined, product: Partial<Product>): number | undefined => {
  if (variant && typeof variant[priceField] === 'number') return variant[priceField]
  if (typeof product[priceField] === 'number') return product[priceField]
  return undefined
}

const buildSingle = (
  price: number,
  compareAt: number | undefined,
): Extract<ProductListingPrice, { mode: 'single' }> => {
  const discountPercent =
    typeof compareAt === 'number' ? calcDiscountPercent(price, compareAt) : undefined

  return {
    mode: 'single',
    price,
    compareAtPrice: discountPercent ? compareAt : undefined,
    discountPercent,
  }
}

export const getProductListingPrice = (product: Partial<Product>): ProductListingPrice => {
  const variants = getVariantDocs(product)

  if (product.enableVariants && variants.length > 0) {
    const prices: number[] = []
    const discountPercents: number[] = []

    for (const variant of variants) {
      const price = variant[priceField]
      if (typeof price !== 'number') continue

      prices.push(price)

      const compareAt = resolveCompareAt(variant, product)
      if (typeof compareAt === 'number') {
        const percent = calcDiscountPercent(price, compareAt)
        if (percent) discountPercents.push(percent)
      }
    }

    if (prices.length === 0) return { mode: 'unavailable' }

    const lowestPrice = Math.min(...prices)
    const highestPrice = Math.max(...prices)
    const maxDiscountPercent = discountPercents.length ? Math.max(...discountPercents) : undefined

    if (lowestPrice === highestPrice) {
      const variant = variants.find((v) => v[priceField] === lowestPrice) ?? variants[0]
      return buildSingle(lowestPrice, resolveCompareAt(variant, product))
    }

    return {
      mode: 'range',
      lowestPrice,
      highestPrice,
      maxDiscountPercent,
    }
  }

  const price = resolvePrice(undefined, product)
  if (typeof price !== 'number') return { mode: 'unavailable' }

  return buildSingle(price, resolveCompareAt(undefined, product))
}

/** Unit pricing for a cart line, checkout row, or a selected variant on PDP. */
export const getLineItemPricing = (
  product: Partial<Product>,
  variant?: Variant | null,
): ProductListingPrice => {
  const resolvedVariant = variant && typeof variant === 'object' ? variant : undefined
  const price = resolvePrice(resolvedVariant, product)

  if (typeof price !== 'number') return { mode: 'unavailable' }

  return buildSingle(price, resolveCompareAt(resolvedVariant, product))
}

/** Multiply single or range amounts by cart quantity (discount % unchanged). */
export const scaleLineItemPricing = (
  pricing: ProductListingPrice,
  quantity: number,
): ProductListingPrice => {
  if (quantity <= 1) return pricing

  if (pricing.mode === 'single') {
    return {
      mode: 'single',
      price: pricing.price * quantity,
      compareAtPrice: pricing.compareAtPrice ? pricing.compareAtPrice * quantity : undefined,
      discountPercent: pricing.discountPercent,
    }
  }

  if (pricing.mode === 'range') {
    return {
      mode: 'range',
      lowestPrice: pricing.lowestPrice * quantity,
      highestPrice: pricing.highestPrice * quantity,
      maxDiscountPercent: pricing.maxDiscountPercent,
    }
  }

  return pricing
}
