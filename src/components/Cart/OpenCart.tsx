import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import clsx from 'clsx'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={clsx('relative h-11 w-11 md:h-9 md:w-9', className)}
      {...rest}
    >
      <ShoppingCart className="h-5 w-5 text-foreground" />

      {quantity ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
          {quantity}
        </span>
      ) : null}
    </Button>
  )
}
