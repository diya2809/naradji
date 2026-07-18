import { siteName } from '@/lib/site'
import React from 'react'

export const Icon = () => {
  const initial = (siteName || 'N').charAt(0).toUpperCase()

  return (
    <span
      aria-label={siteName}
      className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground"
    >
      {initial}
    </span>
  )
}
