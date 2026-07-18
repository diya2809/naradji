'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAddresses, useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyPrefill, emptyUISpec, type UISpec } from '@/lib/naradji/uispec'
import { isConfirmTranscript } from '@/lib/naradji/confirm'
import { DEMO_BREATH_TRANSCRIPT } from '@/lib/naradji/demoBreath'
import { buildReadbackLine, resolveCartLines } from '@/lib/naradji/voiceCopy'
import { applyCartOp } from '@/lib/naradji/cartIntent'
import { syncVoiceCartOp, voiceCartFromStoreLines } from '@/lib/naradji/syncVoiceToCart'
import { shippingToAddressPayload } from '@/lib/naradji/saveVoiceAddress'
import { MicPill } from './MicPill'

/** When STT empty or catalog miss — ask, don't invent UI. */
const CLARIFY_LINE =
  'Narayan Narayan. Samajh nahi aaya. Dobara boliye — doodh, atta, chai… ya poochhiye kaun sasta.'

/** Browser speech fallback when Sarvam TTS is unavailable — keeps demo audible. */
function playBrowserSpeech(text: string, language: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = language === 'gu' ? 'gu-IN' : language === 'en' ? 'en-IN' : 'hi-IN'
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    } catch {
      resolve()
    }
  })
}

async function playTts(text: string, language: string, abort: AbortController) {
  let objectUrl: string | null = null
  let audio: HTMLAudioElement | null = null
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: abort.signal,
    })
    if (abort.signal.aborted) return
    // No key / TTS error → still speak via browser so demo never goes silent.
    if (!res.ok || res.status === 204) {
      await playBrowserSpeech(text, language)
      return
    }
    const blob = await res.blob()
    if (abort.signal.aborted) return
    objectUrl = URL.createObjectURL(blob)
    audio = new Audio(objectUrl)
    await new Promise<void>((resolve) => {
      const done = () => {
        abort.signal.removeEventListener('abort', onAbort)
        resolve()
      }
      const onAbort = () => {
        try {
          audio?.pause()
          if (audio) audio.src = ''
        } catch {
          // ignore
        }
        done()
      }
      if (abort.signal.aborted) {
        onAbort()
        return
      }
      abort.signal.addEventListener('abort', onAbort, { once: true })
      audio!.onended = () => done()
      audio!.onerror = () => done()
      void audio!.play().then(undefined, () => done())
    })
  } catch {
    if (!abort.signal.aborted) await playBrowserSpeech(text, language)
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

function shouldMountVoice(pathname: string | null): boolean {
  if (!pathname) return true
  if (pathname.startsWith('/admin')) return false
  if (pathname.startsWith('/api')) return false
  return true
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

/**
 * Ambient voice controller over the real storefront.
 * No morph sheet — cart drawer, addresses API, checkout page.
 */
export function NaradjiVoiceLayer() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const demo = searchParams?.get('demo') === '1'

  const { addItem, removeItem, clearCart, cart } = useCart()
  const { createAddress } = useAddresses()

  const catalog = useNaradjiStore((s) => s.catalog)
  const setCatalog = useNaradjiStore((s) => s.setCatalog)
  const setUISpec = useNaradjiStore((s) => s.setUISpec)
  const setCartItems = useNaradjiStore((s) => s.setCartItems)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const setCartSyncSkipped = useNaradjiStore((s) => s.setCartSyncSkipped)

  const ttsAbort = useRef<AbortController | null>(null)
  /** Bumps when user barges in — aborts TTS only; cart mutations still finish. */
  const turnEpoch = useRef(0)
  const typedRef = useRef<HTMLInputElement>(null)
  const greetedRef = useRef(false)
  const [catalogError, setCatalogError] = useState(false)
  const [statusLine, setStatusLine] = useState<string | null>(null)

  const bargeIn = useCallback(() => {
    turnEpoch.current += 1
    ttsAbort.current?.abort()
    ttsAbort.current = null
    setStatusLine(null)
  }, [])

  useEffect(() => {
    if (!shouldMountVoice(pathname)) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/catalog')
        const data = (await res.json()) as { catalog?: LeanProduct[] }
        if (cancelled) return
        const next = data.catalog ?? []
        if (!next.length) {
          setCatalogError(true)
          return
        }
        setCatalog(next)
        // Warn only — Payload productIds may arrive on refresh; don't hard-block demo.
        if (!next.some((p) => p.productId)) setCatalogError(true)
      } catch {
        if (!cancelled) setCatalogError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname, setCatalog])

  // Keep voice session cart as a mirror of Payload (manual + voice).
  useEffect(() => {
    if (!catalog.length) return
    const storeLines = (cart?.items ?? []).map((line) => ({
      id: line.id,
      quantity: line.quantity,
      product:
        typeof line.product === 'object' && line.product
          ? { id: line.product.id }
          : line.product,
    }))
    setCartItems(voiceCartFromStoreLines(storeLines, catalog))
  }, [cart?.items, catalog, setCartItems])

  const speak = useCallback(
    async (text: string, language = 'hinglish', forEpoch?: number) => {
      // forEpoch: caller's turn — skip if user already barged in.
      const epoch = forEpoch ?? turnEpoch.current
      if (turnEpoch.current !== epoch) return
      setStatusLine(text)
      ttsAbort.current?.abort()
      ttsAbort.current = new AbortController()
      if (turnEpoch.current !== epoch) return
      setMicState('speaking')
      try {
        await playTts(text, language, ttsAbort.current)
      } finally {
        // Don't clobber listening/transcribing if user barged in mid-TTS.
        if (turnEpoch.current === epoch && useNaradjiStore.getState().micState === 'speaking') {
          setMicState('idle')
        }
      }
    },
    [setMicState],
  )

  const go = useCallback(
    (path: string) => {
      const url = demo ? `${path}${path.includes('?') ? '&' : '?'}demo=1` : path
      router.push(url)
    },
    [demo, router],
  )

  const onTranscript = useCallback(
    async (text: string) => {
      const epoch = turnEpoch.current
      const stillCurrent = () => turnEpoch.current === epoch
      const say = (line: string, language = 'hinglish') => speak(line, language, epoch)
      const clarify = () => say(CLARIFY_LINE)
      const setBusy = (state: 'adding' | 'transcribing') => {
        if (stillCurrent()) setMicState(state)
      }

      const trimmed = text.trim()
      if (!trimmed) {
        if (stillCurrent()) await clarify()
        return
      }

      // Soft greeting once per page load (TTS only — no sheet).
      if (!greetedRef.current) {
        greetedRef.current = true
      }

      const live = useNaradjiStore.getState()
      const livePrefill = live.uispec.prefill
      const storeLinesNow = (cart?.items ?? []).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        product:
          typeof line.product === 'object' && line.product
            ? { id: line.product.id }
            : line.product,
      }))
      // Payload cart is authoritative for confirm + cart ops.
      const liveCart = voiceCartFromStoreLines(storeLinesNow, catalog)
      const liveSpec: UISpec = {
        ...live.uispec,
        items: liveCart,
        prefill: livePrefill,
      }

      // COD confirm → real checkout (platform UI), not a morph confirm card.
      if (isConfirmTranscript(trimmed)) {
        if (!stillCurrent()) return
        setBusy('adding')
        if (!liveCart.length) {
          await say('Pehle list boliye — phir cart se checkout.')
          return
        }
        if (!stillCurrent()) return
        go('/checkout')
        if (stillCurrent()) await say('Checkout khol diya. Wahan confirm kar lijiye.')
        return
      }

      if (!stillCurrent()) return
      setBusy('adding')
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: trimmed, state: liveSpec }),
        })
        if (!stillCurrent()) return
        const data = (await res.json()) as { uispec: UISpec; mode?: string }
        const next = data.uispec || emptyUISpec()

        // Compare / Q&A — voice answer only; open cheapest product page when we have an id.
        if (next.layout === 'compare' || data.mode === 'compare') {
          if (!stillCurrent()) return
          setUISpec({
            ...next,
            prefill: mergePrefill(livePrefill, next.prefill),
          })
          const cheapest = next.items.find((i) => i.reason === 'cheapest') || next.items[0]
          if (cheapest?.id) {
            go(`/products/${cheapest.id}`)
          }
          if (stillCurrent()) await say(next.naradji_line || CLARIFY_LINE, next.language)
          return
        }

        // Address — demo-lenient save via Payload addresses API.
        if (data.mode === 'address' || next.prefill?.shipping) {
          const shipping = next.prefill?.shipping
          if (!shipping) {
            if (stillCurrent()) await clarify()
            return
          }
          if (!stillCurrent()) return
          const prefill = mergePrefill(livePrefill, next.prefill)
          setUISpec({
            ...next,
            items: liveCart,
            prefill,
          })
          try {
            const payload = shippingToAddressPayload(shipping)
            await createAddress(payload)
            if (!stillCurrent()) return
            go('/account/addresses')
            await say(
              next.naradji_line ||
                `Address save ho gaya: ${payload.addressLine1}, ${payload.city}. Checkout pe jaa sakte ho.`,
              next.language,
            )
          } catch {
            if (!stillCurrent()) return
            go('/checkout')
            await say(
              'Address note kiya. Checkout pe check kar lijiye — kuch missing ho to wahan bhar dena.',
              next.language,
            )
          }
          return
        }

        const uttered = next.items || []
        const cartOp = next.cartOp ?? 'add'

        if (cartOp === 'add' && !uttered.length) {
          if (stillCurrent()) await say(next.naradji_line || CLARIFY_LINE, next.language)
          return
        }
        if (cartOp === 'remove' && !uttered.length) {
          if (stillCurrent()) await say('Kya hataun? Item ka naam boliye.', next.language)
          return
        }
        if (cartOp === 'replace' && !uttered.length) {
          if (stillCurrent()) await clarify()
          return
        }

        if (!stillCurrent()) return

        const cartNow = liveCart
        const storeLines = storeLinesNow
        const mergedItems = applyCartOp(cartNow, uttered, cartOp)

        // Direct sync — once started, always finish (don't drop cart on barge-in).
        let skipped: string[] = []
        let removed = 0
        try {
          const result = await syncVoiceCartOp({
            op: cartOp,
            items: uttered,
            desiredCart: mergedItems,
            catalog,
            cartLines: storeLines,
            addItem,
            removeItem,
            clearCart,
          })
          skipped = result.skipped
          removed = result.removed
        } catch {
          setStatusLine('Cart update fail — dobara try kariye.')
          await say('Cart update nahi hua. Dobara boliye.', next.language)
          return
        }

        setCartSyncSkipped(skipped)
        setCartItems(mergedItems)
        setUISpec({
          ...next,
          cartOp,
          items: mergedItems,
          prefill: mergePrefill(livePrefill, next.prefill),
          layout: 'express',
        })

        if (cartOp === 'clear') {
          go('/cart')
          await say(next.naradji_line || 'Cart khali kar diya.', next.language)
          return
        }

        if (cartOp === 'remove') {
          go('/cart')
          await say(
            removed > 0
              ? next.naradji_line || 'Cart se hata diya.'
              : 'Yeh item cart mein nahi mila.',
            next.language,
          )
          return
        }

        const lines = resolveCartLines({ ...next, items: mergedItems }, catalog)
        if (!lines.length || (cartOp === 'add' && skipped.length === uttered.length)) {
          setCartItems(cartNow)
          await say(
            'Narayan Narayan. Yeh item catalog mein nahi mila. Koi aur naam boliye — doodh, atta, chai…',
          )
          return
        }

        go('/cart')
        const readback = buildReadbackLine(lines, { askConfirm: false })
        await say(`${readback} Cart khol diya.`, next.language)
      } catch {
        if (stillCurrent()) await clarify()
      }
    },
    [
      addItem,
      cart?.items,
      catalog,
      clearCart,
      createAddress,
      go,
      removeItem,
      setCartItems,
      setCartSyncSkipped,
      setMicState,
      setUISpec,
      speak,
    ],
  )

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!shouldMountVoice(pathname)) return null
  if (!mounted) return null

  // Portal to body so Naradji sits above Vaul/Radix overlays (own stacking root).
  return createPortal(
    <>
      {/* Always show status so demo never looks silent even if TTS fails. */}
      {statusLine ? (
        <div className="pointer-events-none fixed bottom-[calc(var(--site-bottom-nav-offset)+5.5rem)] left-1/2 z-[9999] w-[min(92vw,28rem)] -translate-x-1/2 md:bottom-32">
          <p className="rounded-2xl bg-stone-900/90 px-4 py-2 text-center text-sm text-stone-50 shadow-lg">
            {statusLine}
          </p>
        </div>
      ) : null}

      {demo ? (
        <div className="pointer-events-none fixed bottom-[calc(var(--site-bottom-nav-offset)+8.5rem)] right-4 z-[9999] flex max-w-sm flex-col items-end gap-2 md:bottom-44">
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-stone-50 shadow-lg"
              onClick={() => {
                setTranscript(DEMO_BREATH_TRANSCRIPT)
                void onTranscript(DEMO_BREATH_TRANSCRIPT)
              }}
            >
              Demo grocery
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => void onTranscript('doodh hata do')}
            >
              Demo remove
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => void onTranscript('cart khali karo')}
            >
              Demo clear
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
              placeholder="Type order…"
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

      <MicPill demo={demo} onTranscript={onTranscript} onBargeIn={bargeIn} />
    </>,
    document.body,
  )
}
