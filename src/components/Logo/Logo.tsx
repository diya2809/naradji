import { cn } from '@/utilities/cn'
import { siteName } from '@/lib/site'
import React from 'react'

type Props = {
  className?: string
}

/** Text wordmark — drop a real asset at `public/logo.png` and switch to next/image when ready. */
export const Logo = ({ className }: Props) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl',
        className,
      )}
    >
      {siteName}
    </span>
  )
}
