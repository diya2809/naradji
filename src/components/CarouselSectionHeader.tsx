'use client'

import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import React from 'react'

import { BlockSectionHeading } from '@/components/BlockSectionHeading'
import { Button } from '@/components/ui/button'

export type CarouselNavControls = {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
}

type Props = CarouselNavControls & {
  title?: string | null
  showControls?: boolean
  previousLabel?: string
  nextLabel?: string
}

export const CarouselSectionHeader: React.FC<Props> = ({
  title,
  showControls = true,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
}) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      {title ? <BlockSectionHeading title={title} /> : <span />}
      {showControls ? (
        <div className="flex shrink-0 gap-2">
          <Button
            aria-label={previousLabel}
            disabled={!canScrollLeft}
            onClick={onScrollLeft}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            aria-label={nextLabel}
            disabled={!canScrollRight}
            onClick={onScrollRight}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
