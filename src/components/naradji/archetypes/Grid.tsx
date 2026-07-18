'use client'

import { motion } from 'framer-motion'
import type { LeanProduct } from '@/lib/naradji/catalog'

export function Grid({
  products,
  highlightedIds,
}: {
  products: LeanProduct[]
  highlightedIds: string[]
}) {
  const hi = new Set(highlightedIds)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => (
        <motion.div
          layout
          key={p.id}
          layoutId={`sku-${p.id}`}
          className={[
            'rounded-2xl border px-3 py-4 transition-colors',
            hi.has(p.id)
              ? 'border-amber-500/60 bg-amber-50'
              : 'border-stone-200/80 bg-white/70',
          ].join(' ')}
        >
          <div className="text-sm font-medium text-stone-900">{p.title}</div>
          <div className="mt-2 text-sm text-stone-600">
            ₹{p.price}
            <span className="text-stone-400"> / {p.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
