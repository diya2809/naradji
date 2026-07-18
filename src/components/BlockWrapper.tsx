import type { ReactNode } from 'react'

import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { cn } from '@/utilities/cn'
import {
  getBlockVisibilityClasses,
  getTextAlignClasses,
  type MobileLayout,
  type TextAlign,
} from '@/utilities/responsiveLayout'

type Props = {
  children: ReactNode
  className?: string
  mobileLayout?: MobileLayout
  textAlign?: TextAlign
  /** Skip horizontal container (full-bleed carousels, gutterless media). */
  fullBleed?: boolean
  /** Constrain content width (forms, narrow prose). */
  narrow?: boolean
  id?: string
}

export function BlockWrapper({
  children,
  className,
  mobileLayout,
  textAlign,
  fullBleed = false,
  narrow = false,
  id,
}: Props) {
  const inner = fullBleed ? (
    children
  ) : (
    <MaxWidthWrapper className={cn(narrow && 'max-w-3xl')}>{children}</MaxWidthWrapper>
  )

  return (
    <div
      id={id}
      className={cn(getBlockVisibilityClasses(mobileLayout), getTextAlignClasses(textAlign), className)}
    >
      {inner}
    </div>
  )
}
