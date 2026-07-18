import { CartModal } from './CartModal'
import { Cart as CartType } from '@/payload-types'
import type { CategoryListItem } from '@/types/storefront'

export type CartItem = NonNullable<CartType['items']>[number]

export { CartProvider, useCartDrawer } from './cart-context'

export function Cart({ categories = [] }: { categories?: CategoryListItem[] }) {
  return <CartModal categories={categories} />
}
