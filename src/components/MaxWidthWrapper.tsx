import type { ReactNode } from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  children: ReactNode
  className?: string
}

/** Horizontal page gutter + max width. Uses the project `container` token (see tailwind.config). */
export function MaxWidthWrapper({ children, className }: Props) {
  return <div className={cn('container', className)}>{children}</div>
}
