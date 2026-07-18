import React from 'react'

import { cn } from '@/utilities/cn'

export function Grid(props: React.ComponentProps<'div'>) {
  const { children, className } = props
  return (
    <div {...props} className={cn('grid grid-flow-row', className)}>
      {children}
    </div>
  )
}
