'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  href = '/cart',
  ...rest
}: {
  className?: string
  quantity?: number
  href?: string
} & Omit<React.ComponentProps<typeof Button>, 'asChild' | 'children'>) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={clsx('relative h-11 w-11 md:h-9 md:w-9', className)}
      {...rest}
    >
      <Link aria-label="Cart" href={href}>
        <ShoppingCart className="h-5 w-5 text-foreground" />
        {quantity ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
            {quantity}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
