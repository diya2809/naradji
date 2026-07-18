import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'
import type { DividerBlock as DividerBlockProps } from '@/payload-types'

export const DividerBlock: React.FC<DividerBlockProps & { id?: string | number }> = ({
  mobileLayout,
  style = 'line',
  width = 'container',
}) => {
  if (style === 'space') {
    return (
      <BlockWrapper mobileLayout={mobileLayout}>
        <div aria-hidden className="h-8" />
      </BlockWrapper>
    )
  }

  const fullBleed = width === 'full'
  const narrow = width === 'narrow'

  return (
    <BlockWrapper fullBleed={fullBleed} mobileLayout={mobileLayout} narrow={narrow}>
      {style === 'line' ? <div aria-hidden className="border-t border-border" /> : null}
      {style === 'dots' ? (
        <div className="flex justify-center gap-2 py-2">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        </div>
      ) : null}
    </BlockWrapper>
  )
}
