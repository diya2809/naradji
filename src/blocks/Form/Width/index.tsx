import * as React from 'react'
import { cn } from '@/utilities/cn'

export const Width: React.FC<{
  children: React.ReactNode
  className?: string
  width?: number | string
}> = ({ children, className, width }) => {
  const parsedWidth = typeof width === 'string' ? Number(width) : width
  const widthClass =
    parsedWidth === 25
      ? 'md:w-1/4'
      : parsedWidth === 33
        ? 'md:w-1/3'
        : parsedWidth === 50
          ? 'md:w-1/2'
          : parsedWidth === 66
            ? 'md:w-2/3'
            : parsedWidth === 75
              ? 'md:w-3/4'
              : 'w-full'

  return (
    <div className={cn('w-full', widthClass, className)}>
      {children}
    </div>
  )
}
