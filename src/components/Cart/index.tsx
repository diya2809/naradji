'use client'

import { Cart as CartType } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useMemo } from 'react'

import { OpenCartButton } from './OpenCart'

export type CartItem = NonNullable<CartType['items']>[number]

export { CartProvider, useCartDrawer } from './cart-context'

/** Header cart control — links to the cart page. */
export function Cart({ className }: { className?: string }) {
  const { cart } = useCart()

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return <OpenCartButton className={className} quantity={totalQuantity} />
}
