import type { Category, Product, Variant } from '@/payload-types'

/** Product fields returned by storefront listing queries (`listingProductSelect`). */
export type ListingProduct = Pick<
  Product,
  | 'id'
  | 'title'
  | 'slug'
  | 'description'
  | 'gallery'
  | 'meta'
  | 'enableVariants'
  | 'priceInINR'
  | 'compareAtPriceInINR'
  | 'variants'
>

export type CategoryListItem = Pick<Category, 'id' | 'title' | 'slug'>

export type ProductGalleryEntry = NonNullable<Product['gallery']>[number]

export type VariantOptionEntry = Variant['options'][number]
