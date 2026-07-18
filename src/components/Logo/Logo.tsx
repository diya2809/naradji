import { cn } from '@/utilities/cn'
import { siteName } from '@/lib/site'
import Image from 'next/image'
import React from 'react'

type Props = {
  className?: string
  /** Compact navbar mark vs larger wordmark usage. */
  size?: 'icon' | 'md'
}

/** Naradji mark — flat icon from `public/naradji/narad-logo.png`. */
export const Logo = ({ className, size = 'icon' }: Props) => {
  const dim = size === 'icon' ? 36 : 48

  return (
    <Image
      src="/naradji/narad-logo.png"
      alt={siteName}
      width={dim}
      height={dim}
      priority
      quality={90}
      className={cn(
        'object-contain object-center',
        size === 'icon' ? 'size-9' : 'size-12',
        className,
      )}
    />
  )
}
