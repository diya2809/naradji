import type { ReactNode } from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  children: ReactNode
  className?: string
}

/** Bordered account section shell — reference layout, semantic tokens (no Card primitive). */
export function AccountPanel({ children, className }: Props) {
  return (
    <div className={cn('w-full rounded-lg border border-border bg-card p-4 md:p-8', className)}>
      {children}
    </div>
  )
}
