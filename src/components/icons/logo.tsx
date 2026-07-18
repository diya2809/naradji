import { cn } from '@/utilities/cn'
import { siteName } from '@/lib/site'
import React from 'react'

export function LogoIcon({ className, ...rest }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('inline-flex items-center font-semibold tracking-tight text-foreground', className)}
      {...rest}
    >
      {siteName}
    </span>
  )
}
