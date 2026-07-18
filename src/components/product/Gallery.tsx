'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (values) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
      }
    }
  }, [searchParams, gallery])

  const currentImage = gallery[current]?.image

  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
        <Media
          priority={current === 0}
          resource={currentImage}
          className="aspect-square w-full"
          imgClassName="h-full w-full object-cover"
        />
      </div>

      <ToggleGroup
        className="grid w-full grid-cols-5 gap-2"
        onValueChange={(value) => {
          if (value) setCurrent(Number(value))
        }}
        type="single"
        value={String(current)}
      >
        {gallery.map((item, i) => {
          if (typeof item.image !== 'object') return null

          return (
            <ToggleGroupItem
              aria-label={`View image ${i + 1}`}
              className="aspect-square h-auto w-full min-h-0 min-w-0 rounded-lg p-1"
              key={`${item.image.id}-${i}`}
              value={String(i)}
            >
              <span className="relative block size-full overflow-hidden rounded-md">
                <Media
                  resource={item.image}
                  className="size-full"
                  imgClassName="size-full object-cover"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-background/40 transition-opacity group-data-[state=on]/toggle:opacity-0"
                />
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
