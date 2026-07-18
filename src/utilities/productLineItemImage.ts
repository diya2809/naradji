import type { Media, Product, Variant } from '@/payload-types'

/** Resolve the best thumbnail for cart, checkout, and order line items. */
export function getProductLineItemImage(
  product: Product,
  variant?: Variant | string | null,
): Media | undefined {
  const metaImage =
    product.meta?.image && typeof product.meta.image !== 'string' ? product.meta.image : undefined

  const firstGalleryImage =
    product.gallery?.[0]?.image && typeof product.gallery[0].image !== 'string'
      ? product.gallery[0].image
      : undefined

  let image = firstGalleryImage || metaImage

  const resolvedVariant = variant && typeof variant === 'object' ? variant : undefined

  if (resolvedVariant) {
    const imageVariant = product.gallery?.find((entry) => {
      if (!entry.variantOption) return false

      const variantOptionID =
        typeof entry.variantOption === 'object' ? entry.variantOption.id : entry.variantOption

      return resolvedVariant.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        return option === variantOptionID
      })
    })

    if (imageVariant?.image && typeof imageVariant.image !== 'string') {
      image = imageVariant.image
    }
  }

  return image
}
