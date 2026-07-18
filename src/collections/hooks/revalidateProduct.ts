import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

/** Clears all product-related caches whenever a product is saved or published. */
export const revalidateProduct: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    // Clear the shared listing cache (home carousel, shop page, category pages)
    revalidateTag('products', 'max')

    // Clear the individual product page
    if (doc?.slug) {
      revalidatePath(`/products/${doc.slug}`)
    }

    // Clear the shop index and home page (carousel block)
    revalidatePath('/shop')
    revalidatePath('/')
  }
}

export const revalidateProductDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('products', 'max')

    if (doc?.slug) {
      revalidatePath(`/products/${doc.slug}`)
    }

    revalidatePath('/shop')
    revalidatePath('/')
  }
}
