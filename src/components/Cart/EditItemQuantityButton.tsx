'use client'

import { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: 'minus' | 'plus' }) {
  const { decrementItem, incrementItem, isLoading } = useCart()

  const disabled = useMemo(() => {
    if (!item.id) return true

    const target =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.product && typeof item.product === 'object'
          ? item.product
          : null

    if (
      target &&
      typeof target === 'object' &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === 'plus' && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory
      }
    }

    return false
  }, [item, type])

  return (
    <form>
      <Button
        disabled={disabled || isLoading}
        aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()

          if (item.id) {
            if (type === 'plus') {
              incrementItem(item.id)
            } else {
              decrementItem(item.id)
            }
          }
        }}
        type="button"
        variant="ghost"
        size="icon-sm"
      >
        {type === 'plus' ? (
          <PlusIcon className="h-4 w-4" />
        ) : (
          <MinusIcon className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
