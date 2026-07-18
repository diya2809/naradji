'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyUISpec, type UISpec } from '@/lib/naradji/uispec'
import { isConfirmTranscript } from '@/lib/naradji/confirm'
import { DEMO_BREATH_TRANSCRIPT } from '@/lib/naradji/demoBreath'
import {
  buildReadbackLine,
  cartTotal,
  greetingUISpec,
  resolveCartLines,
} from '@/lib/naradji/voiceCopy'
import { syncVoiceItemsToStoreCart } from '@/lib/naradji/syncVoiceToCart'
import { Express } from './archetypes/Express'
import { Confirm } from './archetypes/Confirm'
import { MicPill } from './MicPill'

/**
 * Ambient Naradji layer: tap mic → sheet + greeting → hold to order →
 * match catalog → Payload cart → speak cart + total → haan pakka.
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
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      void audio.play().then(undefined, () => resolve())
    })
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

function mergeItems(prev: UISpec, next: UISpec): UISpec['items'] {
  if (next.patch) return next.items
  const map = new Map(prev.items.map((i) => [i.id, { ...i }]))
  for (const item of next.items) {
    const existing = map.get(item.id)
    if (existing) {
      map.set(item.id, { ...existing, qty: (existing.qty || 1) + (item.qty || 1) })
    } else {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

export function NaradjiVoiceLayer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const demo = searchParams?.get('demo') === '1'

  const { addItem } = useCart()

  const catalog = useNaradjiStore((s) => s.catalog)
  const setCatalog = useNaradjiStore((s) => s.setCatalog)
  const uispec = useNaradjiStore((s) => s.uispec)
  const setUISpec = useNaradjiStore((s) => s.setUISpec)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const sessionOpen = useNaradjiStore((s) => s.sessionOpen)
  const setSessionOpen = useNaradjiStore((s) => s.setSessionOpen)
  const lastOrderId = useNaradjiStore((s) => s.lastOrderId)
  const setLastOrderId = useNaradjiStore((s) => s.setLastOrderId)
  const cartSyncSkipped = useNaradjiStore((s) => s.cartSyncSkipped)
  const setCartSyncSkipped = useNaradjiStore((s) => s.setCartSyncSkipped)
  const reset = useNaradjiStore((s) => s.reset)
  const [, startTransition] = useTransition()
  const ttsAbort = useRef<AbortController | null>(null)
  const typedRef = useRef<HTMLInputElement>(null)
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

  const speak = useCallback(async (text: string, language: string) => {
    ttsAbort.current?.abort()
    ttsAbort.current = new AbortController()
    setMicState('speaking')
    await playTts(text, language, ttsAbort.current)
    setMicState('idle')
  }, [setMicState])

  const openSession = useCallback(async () => {
    const greet = greetingUISpec()
    setSessionOpen(true)
    setUISpec(greet)
    setMicState('greeting')
    setLastOrderId(null)
    setCartSyncSkipped([])
    await speak(greet.naradji_line, greet.language)
  }, [setCartSyncSkipped, setLastOrderId, setMicState, setSessionOpen, setUISpec, speak])

  const placeOrder = useCallback(
    async (spec: UISpec) => {
      if (!spec.items.length) {
        setUISpec({
          ...spec,
          layout: 'express',
          naradji_line: 'Pehle list boliye — phir haan pakka.',
        })
        await speak('Pehle list boliye — phir haan pakka.', spec.language)
        return
      }
      setMicState('adding')
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uispec: { ...spec, layout: 'confirm' } }),
      })
      const data = (await res.json()) as {
        orderId?: string
        mode?: string
        error?: string
      }
      const real =
        Boolean(data.orderId) && data.mode !== 'local-fallback' && !String(data.orderId).startsWith('local-')

      if (real && data.orderId) {
        setLastOrderId(data.orderId)
        const line = `Order pakka — ${data.orderId}. Shukriya!`
        setUISpec({ ...spec, layout: 'confirm', naradji_line: line })
        setMicState('idle')
        await speak(line, spec.language)
        return
      }

      const fail =
        data.mode === 'local-fallback'
          ? 'Order save nahi hua — dubara try karein ya /checkout.'
          : data.error || 'Order fail. Dubara try karein.'
      setUISpec({ ...spec, layout: 'confirm', naradji_line: fail })
      setMicState('idle')
      await speak(fail, spec.language)
    },
    [setLastOrderId, setMicState, setUISpec, speak],
  )

  const onTranscript = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) {
        setMicState('idle')
        return
      }

      if (isConfirmTranscript(trimmed)) {
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
        setSessionOpen(true)
        await placeOrder(confirmSpec)
        return
      }

      setMicState('adding')
      setSessionOpen(true)
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: trimmed, state: uispec }),
        })
        const data = (await res.json()) as { uispec: UISpec }
        const next = data.uispec || emptyUISpec()
        // Sheet accumulates; store cart only gets this utterance (avoids double-add).
        const uttered = next.items
        const mergedItems = mergeItems(uispec, next)
        const merged: UISpec = {
          ...next,
          items: mergedItems,
          layout: mergedItems.length ? 'express' : next.layout,
        }

        const lines = resolveCartLines(merged, catalog)
        const readback = buildReadbackLine(lines, { askConfirm: true })
        const withLine: UISpec = { ...merged, naradji_line: readback, layout: 'express' }

        const { skipped } = await syncVoiceItemsToStoreCart(
          { ...withLine, items: uttered },
          catalog,
          addItem,
        )
        setCartSyncSkipped(skipped)

        startTransition(() => setUISpec(withLine))
        await speak(readback, withLine.language)
      } catch {
        setMicState('idle')
      }
    },
    [
      addItem,
      catalog,
      placeOrder,
      setCartSyncSkipped,
      setMicState,
      setSessionOpen,
      setUISpec,
      speak,
      uispec,
    ],
  )

  if (!shouldMountVoice(pathname)) return null

  const lines = resolveCartLines(uispec, catalog)
  const total = cartTotal(lines)
  const showSheet = sessionOpen
  const showConfirm = uispec.layout === 'confirm' && lines.length > 0

  return (
    <>
      {demo ? (
        <div className="pointer-events-none fixed bottom-28 right-4 z-40 flex max-w-sm flex-col items-end gap-2 sm:bottom-32">
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-stone-50 shadow-lg"
              onClick={() => {
                void (async () => {
                  if (!sessionOpen) await openSession()
                  const text = DEMO_BREATH_TRANSCRIPT
                  setTranscript(text)
                  await onTranscript(text)
                })()
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
              placeholder="Type list…"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-amber-700 px-3 py-2 text-xs font-medium text-white shadow-lg"
            >
              Send
            </button>
          </form>
          {catalogError ? (
            <p className="rounded-full bg-red-50 px-3 py-1 text-[10px] text-red-700 ring-1 ring-red-200">
              Catalog API failed
            </p>
          ) : null}
        </div>
      ) : null}

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
              <div className="flex items-start gap-2">
                <div className="rounded-xl bg-white/80 px-3 py-1.5 text-right ring-1 ring-stone-200/60">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">Cart</div>
                  <div className="text-base font-semibold tabular-nums text-stone-900">₹{total}</div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-stone-600 ring-1 ring-stone-200"
                  onClick={() => {
                    ttsAbort.current?.abort()
                    reset()
                  }}
                  aria-label="Close Naradji"
                >
                  Close
                </button>
              </div>
            </div>

            {cartSyncSkipped.length > 0 ? (
              <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200">
                Store cart needs seeded products (run seed). Voice list still shown.
              </p>
            ) : null}

            {!showConfirm && lines.length > 0 ? <Express uispec={uispec} catalog={catalog} /> : null}
            {!showConfirm && lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500">
                Hold mic and speak your list — items match the catalog and go into your cart.
              </p>
            ) : null}
            {showConfirm ? (
              <Confirm
                uispec={uispec}
                catalog={catalog}
                orderId={lastOrderId}
                onConfirm={() => void placeOrder({ ...uispec, layout: 'confirm' })}
              />
            ) : null}

            {lines.length > 0 && !showConfirm && !lastOrderId ? (
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-stone-900 py-3 text-sm font-medium text-stone-50"
                onClick={() =>
                  void placeOrder({
                    ...uispec,
                    layout: 'confirm',
                    prefill: {
                      payment: 'cod',
                      address_id: null,
                      size: null,
                      color: null,
                    },
                  })
                }
              >
                Confirm · haan pakka
              </button>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <MicPill demo={demo} onOpenSession={openSession} onTranscript={onTranscript} />
    </>
  )
}
