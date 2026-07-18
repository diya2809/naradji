'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useNaradjiStore } from '@/lib/naradji/store'
import type { LeanProduct } from '@/lib/naradji/catalog'
import { emptyPrefill, emptyUISpec, type UISpec } from '@/lib/naradji/uispec'
import { applyCartOp } from '@/lib/naradji/cartIntent'
import { addVoiceItemsToCart, voiceCartFromStoreLines } from '@/lib/naradji/syncVoiceToCart'
import { buildReadbackLine, resolveCartLines } from '@/lib/naradji/voiceCopy'
import { MicPill } from './MicPill'

/** When STT empty or catalog miss — ask, don't invent UI. */
const CLARIFY_LINE =
  'Narayan Narayan. Samajh nahi aaya. Dobara boliye — doodh, atta, chai…'

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

/**
 * Ambient voice controller — hackathon demo path is ADD TO CART only.
 * No address / compare / remove / clear / COD confirm on this layer.
 */
export function NaradjiVoiceLayer() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const demo = searchParams?.get('demo') === '1'

  const { addItem, cart } = useCart()

  const catalog = useNaradjiStore((s) => s.catalog)
  const setCatalog = useNaradjiStore((s) => s.setCatalog)
  const setUISpec = useNaradjiStore((s) => s.setUISpec)
  const setCartItems = useNaradjiStore((s) => s.setCartItems)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const setCartSyncSkipped = useNaradjiStore((s) => s.setCartSyncSkipped)

  const ttsAbort = useRef<AbortController | null>(null)
  /** Bumps when user barges in — aborts TTS only; cart add still finishes. */
  const turnEpoch = useRef(0)
  const typedRef = useRef<HTMLInputElement>(null)
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

      const trimmed = text.trim()
      if (!trimmed) {
        if (stillCurrent()) await say(CLARIFY_LINE)
        return
      }

      const live = useNaradjiStore.getState()
      const storeLinesNow = (cart?.items ?? []).map((line) => ({
        id: line.id,
        quantity: line.quantity,
        product:
          typeof line.product === 'object' && line.product
            ? { id: line.product.id }
            : line.product,
      }))
      const cartNow = voiceCartFromStoreLines(storeLinesNow, catalog)

      if (!stillCurrent()) return
      setMicState('adding')
      setStatusLine('Cart mein…')

      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: trimmed }),
        })
        if (!stillCurrent()) return

        const data = (await res.json()) as { uispec?: UISpec }
        const next = data.uispec || emptyUISpec()
        const uttered = next.items || []

        // Demo contract: add matched grocery only. Ignore address/compare/remove/clear.
        if (!uttered.length) {
          await say(next.naradji_line || CLARIFY_LINE, next.language)
          return
        }

        let skipped: string[] = []
        try {
          const result = await addVoiceItemsToCart({
            items: uttered,
            catalog,
            addItem,
          })
          skipped = result.skipped
        } catch {
          setStatusLine('Cart update fail — dobara try kariye.')
          await say('Cart update nahi hua. Dobara boliye.', next.language)
          return
        }

        const mergedItems = applyCartOp(cartNow, uttered, 'add')
        setCartSyncSkipped(skipped)
        setCartItems(mergedItems)
        setUISpec({
          ...next,
          cartOp: 'add',
          items: mergedItems,
          prefill: emptyPrefill(),
          layout: 'express',
        })

        const lines = resolveCartLines({ ...next, items: mergedItems }, catalog)
        if (!lines.length || skipped.length === uttered.length) {
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
        if (stillCurrent()) await say(CLARIFY_LINE)
      }
    },
    [
      addItem,
      cart?.items,
      catalog,
      go,
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

  return createPortal(
    <>
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
                const t = 'milk add karjo ne'
                setTranscript(t)
                void onTranscript(t)
              }}
            >
              Demo milk
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs text-stone-800 shadow-lg ring-1 ring-stone-200"
              onClick={() => {
                const t = 'do kilo atta, do doodh, ek packet chai'
                setTranscript(t)
                void onTranscript(t)
              }}
            >
              Demo grocery
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
              placeholder="Type — milk / doodh / atta…"
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
