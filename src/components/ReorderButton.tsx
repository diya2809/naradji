'use client'

import { useCartDrawer } from '@/components/Cart'
import { Button } from '@/components/ui/button'
import type { Order, Product, Variant } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'

type OrderProps = {
  order: Order
  product?: never
  variant?: never
  quantity?: never
  className?: string
}

type LineProps = {
  order?: never
  product: Product
  variant?: Variant | string | null
  quantity?: number | null
  className?: string
}

type Props = OrderProps | LineProps

export function ReorderButton(props: Props) {
  const { addItem, isLoading } = useCart()
  const { openCart } = useCartDrawer()
  const [busy, setBusy] = useState(false)

  async function handleReorder() {
    setBusy(true)
    try {
      if ('order' in props && props.order) {
        const lines = props.order.items ?? []
        const addable = lines.filter(
          (item) => item.product && typeof item.product === 'object' && item.product.id,
        )
        if (!addable.length) {
          toast.error('No products available to reorder.')
          return
        }
        for (const item of addable) {
          const product = item.product
          if (!product || typeof product === 'string') continue
          const variant =
            item.variant && typeof item.variant === 'object' ? item.variant.id : undefined
          const qty = Math.max(1, item.quantity || 1)
          await addItem({ product: product.id, ...(variant ? { variant } : {}) }, qty)
        }
      } else if ('product' in props && props.product) {
        const variant =
          props.variant && typeof props.variant === 'object' ? props.variant.id : undefined
        const qty = Math.max(1, props.quantity || 1)
        await addItem({ product: props.product.id, ...(variant ? { variant } : {}) }, qty)
      } else {
        toast.error('No products available to reorder.')
        return
      }

      openCart()
      toast.success('Added to cart.')
    } catch (err) {
      console.error('Reorder failed:', err)
      toast.error('Could not add items to cart.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className={cn('shrink-0', props.className)}
      disabled={busy || isLoading}
      onClick={() => void handleReorder()}
    >
      {busy ? 'Adding…' : 'Reorder'}
    </Button>
  )
}
