import type { Product } from '@/payload-types'

import { ProductCard } from '@/components/ProductCard'

type Props = {
  product: Partial<Product>
}

export function EventCard({ product }: Props) {
  return <ProductCard product={product} />
}
