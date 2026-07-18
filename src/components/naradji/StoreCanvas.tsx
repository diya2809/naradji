'use client'

import { useCallback, useEffect, useRef, useTransition } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyUISpec, type UISpec } from '@/lib/naradji/uispec'
import { isConfirmTranscript } from '@/lib/naradji/confirm'
import { Grid } from './archetypes/Grid'
import { Express } from './archetypes/Express'
import { Confirm } from './archetypes/Confirm'
import { MicPill } from './MicPill'

async function playTts(text: string, language: string, abort: AbortController) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: abort.signal,
    })
    if (!res.ok || res.status === 204) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    await audio.play().catch(() => undefined)
    URL.revokeObjectURL(url)
  } catch {
    // TTS never blocks UI
  }
}

export function StoreCanvas({
  initialCatalog,
  demo,
}: {
  initialCatalog: LeanProduct[]
  demo: boolean
}) {
  const catalog = useNaradjiStore((s) => s.catalog)
  const setCatalog = useNaradjiStore((s) => s.setCatalog)
  const uispec = useNaradjiStore((s) => s.uispec)
  const setUISpec = useNaradjiStore((s) => s.setUISpec)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const lastOrderId = useNaradjiStore((s) => s.lastOrderId)
  const setLastOrderId = useNaradjiStore((s) => s.setLastOrderId)
  const [, startTransition] = useTransition()
  const ttsAbort = useRef<AbortController | null>(null)
  const typedRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCatalog(initialCatalog)
  }, [initialCatalog, setCatalog])

  const placeOrder = useCallback(
    async (spec: UISpec) => {
      setMicState('morphing')
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uispec: { ...spec, layout: 'confirm' } }),
      })
      const data = (await res.json()) as { orderId?: string }
      if (data.orderId) setLastOrderId(data.orderId)
      setUISpec({ ...spec, layout: 'confirm', naradji_line: 'Order pakka — shukriya!' })
      setMicState('idle')
    },
    [setLastOrderId, setMicState, setUISpec],
  )

  const onTranscript = useCallback(
    async (text: string) => {
      ttsAbort.current?.abort()
      ttsAbort.current = new AbortController()

      if (isConfirmTranscript(text)) {
        const confirmSpec: UISpec = {
          ...uispec,
          layout: 'confirm',
          prefill: {
            payment: 'cod',
            address_id: uispec.prefill?.address_id ?? null,
            size: null,
            color: null,
          },
          naradji_line: 'Order place ho raha hai…',
        }
        setUISpec(confirmSpec)
        await placeOrder(confirmSpec)
        return
      }

      setMicState('morphing')
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, state: uispec }),
        })
        const data = (await res.json()) as { uispec: UISpec }
        const next = data.uispec || emptyUISpec()
        startTransition(() => setUISpec(next))
        setMicState('speaking')
        // TTS last — never await before morph
        void playTts(next.naradji_line, next.language, ttsAbort.current!).finally(() => {
          setMicState('idle')
        })
      } catch {
        setMicState('idle')
      }
    },
    [placeOrder, setMicState, setUISpec, uispec],
  )

  const products = catalog.length ? catalog : initialCatalog
  const total = uispec.items.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id)
    return s + (p ? p.price * (i.qty || 1) : 0)
  }, 0)

  return (
    <div className="naradji-root relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f6e7c7_0%,_#f3f0e8_45%,_#e8efe8_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:url('data:image/svg+xml,%3Csvg width%3D%2240%22 height%3D%2240%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath d%3D%22M0 40L40 0H20L0 20zm40 0V20L20 40z%22 fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E')]" />

      <header className="relative z-10 flex items-start justify-between px-5 pt-6 sm:px-8">
        <div>
          <p className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Naradji</p>
          <p className="mt-1 max-w-md text-sm text-stone-600">
            The store you finish in one breath.
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-2 text-right shadow-sm ring-1 ring-stone-200/60 backdrop-blur">
          <div className="text-xs uppercase tracking-wider text-stone-500">Cart</div>
          <div className="text-lg font-semibold tabular-nums text-stone-900">₹{total}</div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-40 pt-8 sm:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-stone-50"
            onClick={() => {
              const text = 'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'
              setTranscript(text)
              void onTranscript(text)
            }}
          >
            Demo grocery breath
          </button>
          <button
            type="button"
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-stone-800 ring-1 ring-stone-200"
            onClick={() => {
              const text = 'haan pakka'
              setTranscript(text)
              void onTranscript(text)
            }}
          >
            Confirm · haan pakka
          </button>
          <a
            href="/admin"
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-stone-800 ring-1 ring-stone-200"
          >
            Admin reveal
          </a>
        </div>

        <form
          className="mb-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const v = typedRef.current?.value?.trim()
            if (!v) return
            setTranscript(v)
            void onTranscript(v)
            if (typedRef.current) typedRef.current.value = ''
          }}
        >
          <input
            ref={typedRef}
            className="flex-1 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm outline-none ring-amber-500/30 focus:ring"
            placeholder="Type if mic is shy — e.g. do kilo atta, paanch Maggi, COD"
          />
          <button
            type="submit"
            className="rounded-full bg-amber-700 px-4 py-2 text-sm font-medium text-white"
          >
            Morph
          </button>
        </form>

        <p className="mb-4 font-serif text-xl text-stone-800">{uispec.naradji_line}</p>

        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={uispec.layout}
              initial={{ opacity: 0.6, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              {uispec.layout === 'grid' ? (
                <Grid products={products} highlightedIds={uispec.items.map((i) => i.id)} />
              ) : null}
              {uispec.layout === 'express' ? (
                <Express uispec={uispec} catalog={products} />
              ) : null}
              {uispec.layout === 'confirm' ? (
                <Confirm uispec={uispec} catalog={products} orderId={lastOrderId} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>

      <MicPill demo={demo} onTranscript={onTranscript} />
    </div>
  )
}
