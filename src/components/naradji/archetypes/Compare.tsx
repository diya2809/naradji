'use client'

import { motion } from 'framer-motion'
import type { LeanProduct } from '@/lib/naradji/catalog'
import type { UISpec } from '@/lib/naradji/uispec'

export function Compare({
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
      return { ...p, qty: i.qty || 1, reason: i.reason }
    })
    .filter((x): x is LeanProduct & { qty: number; reason: string | null } => Boolean(x))

  if (!lines.length) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">
        Do brand / product naam boliye — Naradji compare karega.
      </p>
    )
  }

  const minPrice = Math.min(...lines.map((l) => l.price))

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-800">Compare</p>
      {lines.map((l) => {
        const cheapest = l.price === minPrice
        return (
          <motion.div
            layout
            key={l.id}
            layoutId={`compare-${l.id}`}
            className={[
              'flex items-center justify-between rounded-2xl px-4 py-3 ring-1',
              cheapest
                ? 'bg-emerald-50 ring-emerald-300'
                : 'bg-white/80 ring-stone-200/70',
            ].join(' ')}
          >
            <div>
              <div className="font-medium text-stone-900">{l.title}</div>
              <div className="text-sm text-stone-500">{l.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums text-stone-900">₹{l.price}</div>
              {cheapest ? (
                <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                  Sasta
                </div>
              ) : null}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
