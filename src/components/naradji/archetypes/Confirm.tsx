'use client'

import { motion } from 'framer-motion'
import type { LeanProduct } from '@/lib/naradji/catalog'
import type { UISpec } from '@/lib/naradji/uispec'

export function Confirm({
  uispec,
  catalog,
  orderId,
  onConfirm,
}: {
  uispec: UISpec
  catalog: LeanProduct[]
  orderId: string | null
  onConfirm?: () => void
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
    <motion.div
      layout
      className="mx-auto w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-lg ring-1 ring-stone-200"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Confirm</p>
      <h2 className="mt-2 font-serif text-3xl text-stone-900">Haan pakka?</h2>
      <ul className="mt-6 space-y-3">
        {lines.map((l) => (
          <motion.li
            layout
            layoutId={`sku-${l.id}`}
            key={l.id}
            className="flex justify-between text-stone-800"
          >
            <span>
              {l.title}{' '}
              <span className="text-stone-400">×{l.qty}</span>
            </span>
            <span className="tabular-nums">₹{l.price * l.qty}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between border-t border-stone-100 pt-4 text-lg font-semibold">
        <span>COD total</span>
        <span className="tabular-nums">₹{total}</span>
      </div>
      {orderId ? (
        <p className="mt-6 text-center text-sm text-stone-500">Order {orderId} — check /admin</p>
      ) : (
        <div className="mt-6 space-y-2">
          {onConfirm ? (
            <button
              type="button"
              className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-medium text-stone-50"
              onClick={onConfirm}
            >
              Confirm · haan pakka
            </button>
          ) : null}
          <p className="text-center text-sm text-stone-500">Ya boliye “haan pakka”</p>
        </div>
      )}
    </motion.div>
  )
}
