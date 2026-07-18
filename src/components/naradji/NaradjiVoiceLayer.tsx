'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyUISpec, type UISpec } from '@/lib/naradji/uispec'
import { isConfirmTranscript } from '@/lib/naradji/confirm'
import { Express } from './archetypes/Express'
import { Confirm } from './archetypes/Confirm'
import { MicPill } from './MicPill'

/**
 * Ambient Naradji layer over the normal Payload ecommerce shell.
 * Does not replace Header/Footer/shop — MicPill + morph sheet only.
 */

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

function shouldMountVoice(pathname: string | null): boolean {
  if (!pathname) return true
  if (pathname.startsWith('/admin')) return false
  if (pathname.startsWith('/api')) return false
  return true
}

export function NaradjiVoiceLayer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const demo = searchParams?.get('demo') === '1'

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
  const [panelOpen, setPanelOpen] = useState(false)
  const [catalogError, setCatalogError] = useState(false)

  useEffect(() => {
    if (!shouldMountVoice(pathname)) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/catalog')
        const data = (await res.json()) as { catalog?: LeanProduct[] }
        if (!cancelled && data.catalog?.length) setCatalog(data.catalog)
      } catch {
        if (!cancelled) setCatalogError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname, setCatalog])

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
      setPanelOpen(true)
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
        setPanelOpen(true)
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
        if (next.layout === 'express' || next.layout === 'confirm' || next.items.length > 0) {
          setPanelOpen(true)
        }
        setMicState('speaking')
        void playTts(next.naradji_line, next.language, ttsAbort.current!).finally(() => {
          setMicState('idle')
        })
      } catch {
        setMicState('idle')
      }
    },
    [placeOrder, setMicState, setUISpec, uispec],
  )

  if (!shouldMountVoice(pathname)) return null

  const showSheet =
    panelOpen && (uispec.layout === 'express' || uispec.layout === 'confirm' || uispec.items.length > 0)

  const total = uispec.items.reduce((s, i) => {
    const p = catalog.find((x) => x.id === i.id)
    return s + (p ? p.price * (i.qty || 1) : 0)
  }, 0)

  return (
    <>
      {/* Compact demo / type strip — does not replace the shop */}
      <div className="pointer-events-none fixed bottom-28 right-4 z-40 flex max-w-sm flex-col items-end gap-2 sm:bottom-32">
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-stone-50 shadow-lg"
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
            className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
            onClick={() => {
              const text = 'haan pakka'
              setTranscript(text)
              void onTranscript(text)
            }}
          >
            Confirm · haan pakka
          </button>
          {showSheet ? (
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => setPanelOpen(false)}
            >
              Close voice cart
            </button>
          ) : null}
        </div>
        <form
          className="pointer-events-auto flex w-full max-w-sm gap-2"
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
            className="min-w-0 flex-1 rounded-full border border-stone-200 bg-white/95 px-3 py-2 text-xs shadow-lg outline-none focus:ring focus:ring-amber-500/30"
            placeholder="Type list if mic shy…"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-amber-700 px-3 py-2 text-xs font-medium text-white shadow-lg"
          >
            Morph
          </button>
        </form>
        {catalogError ? (
          <p className="rounded-full bg-red-50 px-3 py-1 text-[10px] text-red-700 ring-1 ring-red-200">
            Catalog API failed — using fallback when interpret runs
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {showSheet ? (
          <motion.aside
            key="naradji-sheet"
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-[#f7f3ea] px-5 pb-36 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ring-1 ring-stone-200/80 sm:inset-x-auto sm:bottom-28 sm:right-4 sm:max-h-[min(70vh,36rem)] sm:w-[26rem] sm:rounded-3xl sm:pb-5"
            aria-label="Naradji voice cart"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-stone-900">Naradji</p>
                <p className="text-xs text-stone-600">{uispec.naradji_line}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-1.5 text-right ring-1 ring-stone-200/60">
                <div className="text-[10px] uppercase tracking-wider text-stone-500">Voice cart</div>
                <div className="text-base font-semibold tabular-nums text-stone-900">₹{total}</div>
              </div>
            </div>

            {uispec.layout === 'express' || (uispec.layout === 'grid' && uispec.items.length > 0) ? (
              <Express uispec={uispec} catalog={catalog} />
            ) : null}
            {uispec.layout === 'confirm' ? (
              <Confirm uispec={uispec} catalog={catalog} orderId={lastOrderId} />
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <MicPill demo={demo} onTranscript={onTranscript} />
    </>
  )
}
