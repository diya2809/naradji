'use client'

import type { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Trash2Icon } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { isLoading, removeItem } = useCart()
  const itemId = item.id

  return (
    <form>
      <Button
        aria-label="Remove cart item"
        className="text-muted-foreground hover:text-foreground"
        disabled={!itemId || isLoading}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (itemId) removeItem(itemId)
        }}
        type="button"
        variant="ghost"
        size="icon-xs"
      >
        <Trash2Icon className="h-3.5 w-3.5" />
      </Button>
    </form>
  )
}
