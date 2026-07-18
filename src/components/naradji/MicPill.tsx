'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DEMO_BREATH_TRANSCRIPT } from '@/lib/naradji/demoBreath'
import { useNaradjiStore, type MicState } from '@/lib/naradji/store'

const LABEL: Record<MicState, string> = {
  idle: 'Talk to Naradji',
  greeting: 'Naradji…',
  listening: 'Listening — tap to stop',
  transcribing: 'Samajh rahe hain…',
  adding: 'Cart mein…',
  speaking: 'Bol rahe hain…',
}

/** Above drawers / dialogs (z-50) and common overlays. */
const NARADJI_Z = 'z-[9999]'

/**
 * Click once → start listen. Click again → stop + process.
 * The Naradji sticker itself is the button. No morph sheet.
 */
export function MicPill({
  demo,
  onTranscript,
}: {
  demo: boolean
  onTranscript: (text: string) => void | Promise<void>
}) {
  const micState = useNaradjiStore((s) => s.micState)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const transcript = useNaradjiStore((s) => s.transcript)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recording = useRef(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  async function finishWithText(text: string) {
    const trimmed = text.trim()
    setTranscript(trimmed)
    setMicState('transcribing')
    await onTranscript(trimmed)
  }

  async function startListening() {
    if (demo || !supported) {
      // Demo / no-mic: one tap arms listen; second tap processes demo breath.
      setMicState('listening')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        recording.current = false
        setMicState('transcribing')
        const blob = new Blob(chunksRef.current, { type: mime })
        if (!blob.size) {
          await finishWithText('')
          return
        }
        const form = new FormData()
        form.append('file', blob, 'utterance.webm')
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: form })
          const data = (await res.json()) as { transcript?: string }
          await finishWithText(data.transcript || '')
        } catch {
          await finishWithText(DEMO_BREATH_TRANSCRIPT)
        }
      }
      mediaRef.current = recorder
      recorder.start()
      recording.current = true
      setMicState('listening')
    } catch {
      // Mic denied — fall back to demo utterance so the layer still works.
      await finishWithText(DEMO_BREATH_TRANSCRIPT)
    }
  }

  function stopListening() {
    const r = mediaRef.current
    if (r && r.state === 'recording') {
      r.stop()
      mediaRef.current = null
      return
    }
    // Demo mode: tap-to-stop with no real recorder → process demo breath
    if (demo || !supported) {
      void finishWithText(DEMO_BREATH_TRANSCRIPT)
    }
  }

  function onClick() {
    if (micState === 'transcribing' || micState === 'adding' || micState === 'speaking' || micState === 'greeting') {
      return
    }
    if (micState === 'listening') {
      stopListening()
      return
    }
    void startListening()
  }

  const busy = micState === 'transcribing' || micState === 'adding' || micState === 'speaking'
  const listening = micState === 'listening'
  const hint = listening
    ? 'Tap again to stop & process'
    : busy
      ? LABEL[micState]
      : 'Tap Naradji to speak · tap again when done'

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(var(--site-bottom-nav-offset)+0.75rem)] ${NARADJI_Z} flex flex-col items-center gap-2 px-4 md:bottom-6`}
    >
      {transcript && (listening || busy || micState === 'idle') ? (
        <div className="pointer-events-none max-w-xl rounded-full bg-stone-900/85 px-4 py-2 text-center text-sm text-stone-50 shadow-lg backdrop-blur">
          {transcript}
        </div>
      ) : null}
      <button
        type="button"
        className={[
          'pointer-events-auto flex h-auto min-w-0 items-center justify-center bg-transparent p-0 shadow-none',
          busy ? 'opacity-80' : '',
        ].join(' ')}
        onClick={onClick}
        disabled={busy}
        aria-pressed={listening}
        aria-label={listening ? 'Stop listening' : 'Start listening with Naradji'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={listening ? 'narad-listening' : 'narad-idle'}
            className="relative block"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <motion.img
              src={listening ? '/naradji/narad-listening.png' : '/naradji/narad-idle.png'}
              alt={listening ? 'Naradji listening' : 'Talk to Naradji'}
              draggable={false}
              className={[
                // Punch black plate so the character floats over page content.
                'w-auto select-none mix-blend-lighten drop-shadow-2xl',
                listening ? 'h-24 sm:h-28' : 'h-36 sm:h-44',
              ].join(' ')}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.span>
        </AnimatePresence>
      </button>
      <p className="pointer-events-none text-xs text-stone-500">{hint}</p>
    </div>
  )
}
