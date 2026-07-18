import React from 'react'
import { getProductReviewsData } from './getProductReviewsData'
import { ProductReviewsPanel } from './ProductReviewsPanel'

type Props = {
  productId: string
}

/** Server entry: renders nothing when the product has no approved reviews. */
export const ProductReviews: React.FC<Props> = async ({ productId }) => {
  const data = await getProductReviewsData(productId)
  if (!data) return null
  return <ProductReviewsPanel {...data} />
}
