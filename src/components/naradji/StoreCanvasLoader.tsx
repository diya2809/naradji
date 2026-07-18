'use client'

import nextDynamic from 'next/dynamic'
import type { LeanProduct } from '@/lib/naradji/catalog'

const StoreCanvas = nextDynamic(
  () => import('@/components/naradji/StoreCanvas').then((m) => m.StoreCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f3f0e8] font-serif text-3xl text-stone-900">
        Naradji
      </div>
    ),
  },
)

export function StoreCanvasLoader({
  initialCatalog,
  demo,
}: {
  initialCatalog: LeanProduct[]
  demo: boolean
}) {
  return <StoreCanvas initialCatalog={initialCatalog} demo={demo} />
}
