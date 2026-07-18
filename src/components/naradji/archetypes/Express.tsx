'use client'

import { motion } from 'framer-motion'
import type { LeanProduct } from '@/lib/naradji/catalog'
import type { UISpec } from '@/lib/naradji/uispec'

export function Express({
  uispec,
  catalog,
}: {
  uispec: UISpec
  catalog: LeanProduct[]
}) {
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const lines = uispec.items
    .map((i) => {
      const p = byId.get(i.id)
      if (!p) return null
      return { ...p, qty: i.qty || 1 }
    })
    .filter((x): x is LeanProduct & { qty: number } => Boolean(x))

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      {lines.map((l) => (
        <motion.div
          layout
          key={l.id}
          layoutId={`sku-${l.id}`}
          className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-stone-200/70"
        >
          <div>
            <div className="font-medium text-stone-900">{l.title}</div>
            <div className="text-sm text-stone-500">
              ₹{l.price} × {l.qty}
            </div>
          </div>
          <div className="text-lg font-semibold tabular-nums text-stone-900">
            ₹{l.price * l.qty}
          </div>
        </motion.div>
      ))}
      <motion.div
        layout
        className="mt-2 flex items-center justify-between rounded-2xl bg-stone-900 px-4 py-3 text-stone-50"
      >
        <span>Total · {uispec.prefill?.payment === 'cod' ? 'COD' : 'Pay later'}</span>
        <span className="text-xl font-semibold tabular-nums">₹{total}</span>
      </motion.div>
    </div>
  )
}
