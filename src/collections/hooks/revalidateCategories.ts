import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateCategories: CollectionAfterChangeHook = ({ req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('categories', 'max')
  }
}

export const revalidateCategoriesDelete: CollectionAfterDeleteHook = ({ req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag('categories', 'max')
  }
}
