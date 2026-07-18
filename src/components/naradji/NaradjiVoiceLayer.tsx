'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyPrefill, emptyUISpec, hasUsableShipping, type UISpec } from '@/lib/naradji/uispec'
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
import { Compare } from './archetypes/Compare'
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

function mergeItems(prev: UISpec['items'], next: UISpec['items'], patch: boolean): UISpec['items'] {
  if (patch) return next
  const map = new Map(prev.map((i) => [i.id, { ...i }]))
  for (const item of next) {
    const existing = map.get(item.id)
    if (existing) {
      map.set(item.id, { ...existing, qty: (existing.qty || 1) + (item.qty || 1) })
    } else {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

function mergePrefill(prev: UISpec['prefill'], next: UISpec['prefill']): UISpec['prefill'] {
  return {
    ...emptyPrefill(),
    ...prev,
    ...next,
    shipping: next?.shipping ?? prev?.shipping ?? null,
    payment: next?.payment ?? prev?.payment ?? null,
  }
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
  const cartItems = useNaradjiStore((s) => s.cartItems)
  const setCartItems = useNaradjiStore((s) => s.setCartItems)
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

  const speak = useCallback(
    async (text: string, language: string) => {
      ttsAbort.current?.abort()
      ttsAbort.current = new AbortController()
      setMicState('speaking')
      await playTts(text, language, ttsAbort.current)
      setMicState('idle')
    },
    [setMicState],
  )

  const openSession = useCallback(async () => {
    const greet = greetingUISpec()
    setSessionOpen(true)
    setUISpec(greet)
    setCartItems([])
    setMicState('greeting')
    setLastOrderId(null)
    setCartSyncSkipped([])
    await speak(greet.naradji_line, greet.language)
  }, [
    setCartItems,
    setCartSyncSkipped,
    setLastOrderId,
    setMicState,
    setSessionOpen,
    setUISpec,
    speak,
  ])

  const orderSpec = useCallback(
    (overrides: Partial<UISpec> = {}): UISpec => ({
      ...uispec,
      ...overrides,
      items: overrides.items ?? cartItems,
      prefill: mergePrefill(uispec.prefill, overrides.prefill ?? null),
    }),
    [cartItems, uispec],
  )

  const askForAddress = useCallback(
    async (spec: UISpec) => {
      const line = 'Pehle address boliye — ghar, city, pin, phone. Phir haan pakka.'
      const next: UISpec = {
        ...spec,
        layout: 'confirm',
        naradji_line: line,
        prefill: {
          ...emptyPrefill(),
          ...spec.prefill,
          payment: 'cod',
        },
      }
      setUISpec(next)
      await speak(line, spec.language)
    },
    [setUISpec, speak],
  )

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
      if (!hasUsableShipping(spec.prefill?.shipping)) {
        await askForAddress(spec)
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
        message?: string
      }

      if (data.error === 'address_required') {
        await askForAddress(spec)
        return
      }

      const real =
        Boolean(data.orderId) &&
        data.mode !== 'local-fallback' &&
        !String(data.orderId).startsWith('local-')

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
          : data.message || data.error || 'Order fail. Dubara try karein.'
      setUISpec({ ...spec, layout: 'confirm', naradji_line: fail })
      setMicState('idle')
      await speak(fail, spec.language)
    },
    [askForAddress, setLastOrderId, setMicState, setUISpec, speak],
  )

  const onTranscript = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) {
        setMicState('idle')
        return
      }

      // Read live store — avoids stale cartItems when demo chips fire in parallel.
      const live = useNaradjiStore.getState()
      const liveCart = live.cartItems
      const livePrefill = live.uispec.prefill
      const liveSpec: UISpec = {
        ...live.uispec,
        items: liveCart,
        prefill: livePrefill,
      }

      if (isConfirmTranscript(trimmed)) {
        const confirmSpec: UISpec = {
          ...liveSpec,
          layout: 'confirm',
          items: liveCart,
          naradji_line: 'Order place ho raha hai…',
          prefill: {
            ...emptyPrefill(),
            ...livePrefill,
            payment: 'cod',
          },
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
          body: JSON.stringify({
            transcript: trimmed,
            state: liveSpec,
          }),
        })
        const data = (await res.json()) as { uispec: UISpec; mode?: string }
        const next = data.uispec || emptyUISpec()

        if (next.layout === 'compare') {
          startTransition(() =>
            setUISpec({
              ...next,
              // Keep session prefill; compare must not wipe shipping.
              prefill: mergePrefill(livePrefill, next.prefill),
            }),
          )
          await speak(next.naradji_line, next.language)
          return
        }

        if (data.mode === 'address' || next.prefill?.shipping) {
          const cartNow = useNaradjiStore.getState().cartItems
          const merged: UISpec = {
            ...next,
            items: cartNow,
            prefill: mergePrefill(livePrefill, next.prefill),
            layout: cartNow.length ? 'confirm' : 'express',
          }
          startTransition(() => setUISpec(merged))
          await speak(merged.naradji_line, merged.language)
          return
        }

        const uttered = next.items
        const cartNow = useNaradjiStore.getState().cartItems
        const mergedItems = mergeItems(cartNow, uttered, next.patch)
        setCartItems(mergedItems)

        const prefill = mergePrefill(livePrefill, next.prefill)
        const merged: UISpec = {
          ...next,
          items: mergedItems,
          prefill,
          layout: mergedItems.length ? 'express' : next.layout,
        }

        const lines = resolveCartLines(merged, catalog)
        const readback = buildReadbackLine(lines, { askConfirm: false })
        const withAddressHint = hasUsableShipping(merged.prefill?.shipping)
          ? `${readback} Haan pakka?`
          : `${readback} Address boliye, phir haan pakka.`
        const withLine: UISpec = {
          ...merged,
          naradji_line: withAddressHint,
          layout: 'express',
        }

        const { skipped } = await syncVoiceItemsToStoreCart(
          { ...withLine, items: uttered },
          catalog,
          addItem,
        )
        setCartSyncSkipped(skipped)

        startTransition(() => setUISpec(withLine))
        await speak(withAddressHint, withLine.language)
      } catch {
        setMicState('idle')
      }
    },
    [
      addItem,
      catalog,
      placeOrder,
      setCartItems,
      setCartSyncSkipped,
      setMicState,
      setSessionOpen,
      setUISpec,
      speak,
    ],
  )

  if (!shouldMountVoice(pathname)) return null

  const cartView: UISpec = { ...uispec, items: cartItems }
  const lines = resolveCartLines(cartView, catalog)
  const total = cartTotal(lines)
  const showSheet = sessionOpen
  const showCompare = uispec.layout === 'compare'
  const showConfirm = uispec.layout === 'confirm' && cartItems.length > 0
  const shipping = uispec.prefill?.shipping
  const addressOk = hasUsableShipping(shipping)

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
                  setTranscript(DEMO_BREATH_TRANSCRIPT)
                  await onTranscript(DEMO_BREATH_TRANSCRIPT)
                })()
              }}
            >
              Demo grocery breath
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => void onTranscript('Tata tea aur Red Label mein kaun sasta')}
            >
              Demo compare tea
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() =>
                void onTranscript('Mera address 12 CG Road Ahmedabad 380009 phone 9876543210')
              }
            >
              Demo address
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => void onTranscript('haan pakka')}
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
              placeholder="Type list / compare / address…"
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
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">
                    {showCompare ? 'Compare' : 'Cart'}
                  </div>
                  <div className="text-base font-semibold tabular-nums text-stone-900">
                    ₹{total}
                  </div>
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

            {addressOk && shipping ? (
              <p className="mb-2 rounded-lg bg-white/70 px-3 py-2 text-[11px] text-stone-700 ring-1 ring-stone-200">
                Deliver: {shipping.addressLine1}
                {shipping.city ? `, ${shipping.city}` : ''}
                {shipping.postalCode ? ` ${shipping.postalCode}` : ''}
                {shipping.phone ? ` · ${shipping.phone}` : ''}
              </p>
            ) : null}

            {showCompare ? <Compare uispec={uispec} catalog={catalog} /> : null}
            {!showCompare && !showConfirm && lines.length > 0 ? (
              <Express uispec={cartView} catalog={catalog} />
            ) : null}
            {!showCompare && !showConfirm && lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500">
                List boliye, ya poochhiye — “Tata tea aur Red Label mein kaun sasta?”
              </p>
            ) : null}
            {showConfirm ? (
              <Confirm
                uispec={cartView}
                catalog={catalog}
                orderId={lastOrderId}
                onConfirm={() => void placeOrder(orderSpec({ layout: 'confirm' }))}
              />
            ) : null}

            {!showCompare && lines.length > 0 && !showConfirm && !lastOrderId ? (
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-stone-900 py-3 text-sm font-medium text-stone-50"
                onClick={() =>
                  void placeOrder(
                    orderSpec({
                      layout: 'confirm',
                      prefill: {
                        ...emptyPrefill(),
                        ...uispec.prefill,
                        payment: 'cod',
                      },
                    }),
                  )
                }
              >
                {addressOk ? 'Confirm · haan pakka' : 'Address chahiye · phir confirm'}
              </button>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <MicPill demo={demo} onOpenSession={openSession} onTranscript={onTranscript} />
    </>
  )
}
