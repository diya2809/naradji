import { MicIcon, RefreshCwIcon, TruckIcon } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

const trustItems = [
  { icon: TruckIcon, label: 'Free Shipping Over ₹1,999' },
  { icon: RefreshCwIcon, label: '7-Day Returns' },
  { icon: MicIcon, label: 'Voice order · COD with haan pakka' },
] as const
  
export function FooterTrustBar() {
  return (
    <div className="border-t border-border bg-muted text-foreground">
      <div className="container grid grid-cols-2 gap-x-4 gap-y-6 px-4 py-5 text-base font-semibold sm:flex sm:flex-row sm:items-center sm:justify-evenly sm:gap-10 sm:py-6 md:gap-14 md:text-lg lg:gap-8">
        {trustItems.map(({ icon: Icon, label }, index) => (
          <div
            className={cn(
              'flex max-w-full items-center gap-3',
              index === 0 && 'justify-self-start',
              index === 1 && 'justify-self-end sm:justify-self-auto',
              index === 2 && 'col-span-2 justify-center sm:col-span-1',
            )}
            key={label}
          >
            <Icon aria-hidden className="size-5 shrink-0 sm:size-6" strokeWidth={2} />
            <span className="min-w-0 leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
