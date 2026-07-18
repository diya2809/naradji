'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DEMO_BREATH_TRANSCRIPT } from '@/lib/naradji/demoBreath'
import { useNaradjiStore, type MicState } from '@/lib/naradji/store'

const LABEL: Record<MicState, string> = {
  idle: 'Tap to speak',
  greeting: 'Naradji…',
  listening: 'Listening — tap to stop',
  transcribing: 'Samajh rahe hain…',
  adding: 'Cart mein…',
  speaking: 'Bol rahe hain — tap to interrupt',
}

/** Above drawers / dialogs (z-50) and common overlays. */
const NARADJI_Z = 'z-[9999]'

/**
 * Tap once → start listen.
 * Tap again while listening → stop + process.
 * Tap while Naradji is busy/speaking → interrupt and listen again.
 */
export function MicPill({
  demo,
  onTranscript,
  onBargeIn,
}: {
  demo: boolean
  onTranscript: (text: string) => void | Promise<void>
  /** Stop TTS / discard in-flight work before a new listen. */
  onBargeIn: () => void
}) {
  const micState = useNaradjiStore((s) => s.micState)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const transcript = useNaradjiStore((s) => s.transcript)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recording = useRef(false)
  /** Bumps on every new listen so stale MediaRecorder/STT results are ignored. */
  const listenGen = useRef(0)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  function discardRecording() {
    const r = mediaRef.current
    mediaRef.current = null
    recording.current = false
    if (!r) return
    r.ondataavailable = null
    r.onstop = null
    try {
      if (r.state === 'recording') r.stop()
    } catch {
      // ignore
    }
    r.stream?.getTracks().forEach((t) => t.stop())
  }

  async function finishWithText(text: string, gen: number) {
    if (gen !== listenGen.current) return
    const trimmed = text.trim()
    setTranscript(trimmed)
    setMicState('transcribing')
    await onTranscript(trimmed)
  }

  async function startListening() {
    // Always cut Naradji off before a new listen.
    onBargeIn()
    discardRecording()
    const gen = ++listenGen.current

    // Unsupported browser: demo rehearsal breath only when ?demo=1; else clarify.
    // When mic works, always record real speech — even in demo mode (hackathon).
    if (!supported) {
      if (demo) {
        setMicState('listening')
        return
      }
      await finishWithText('', gen)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (gen !== listenGen.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
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
        if (gen !== listenGen.current) return
        mediaRef.current = null
        setMicState('transcribing')
        const blob = new Blob(chunksRef.current, { type: mime })
        if (!blob.size) {
          await finishWithText('', gen)
          return
        }
        const form = new FormData()
        form.append('file', blob, 'utterance.webm')
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: form })
          const data = (await res.json()) as { transcript?: string }
          await finishWithText(data.transcript || '', gen)
        } catch {
          // Network/STT failure must not invent a grocery list.
          await finishWithText('', gen)
        }
      }
      mediaRef.current = recorder
      recorder.start()
      recording.current = true
      setMicState('listening')
    } catch {
      // Mic denied: demo mode keeps rehearsal breath; otherwise empty → clarify.
      await finishWithText(demo ? DEMO_BREATH_TRANSCRIPT : '', gen)
    }
  }

  function stopListening() {
    const gen = listenGen.current
    const r = mediaRef.current
    if (r && r.state === 'recording') {
      r.stop()
      return
    }
    // No MediaRecorder session (unsupported + demo, or demo stop before start).
    if (demo) {
      void finishWithText(DEMO_BREATH_TRANSCRIPT, gen)
    }
  }

  function onClick() {
    // Listening → stop + process. Anything else → barge-in and listen.
    if (micState === 'listening') {
      stopListening()
      return
    }
    void startListening()
  }

  const listening = micState === 'listening'
  const working =
    micState === 'transcribing' || micState === 'adding' || micState === 'speaking' || micState === 'greeting'
  const hint = listening
    ? 'Listening… tap again when done'
    : working
      ? LABEL[micState]
      : 'Tap once to speak · tap again when done'

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(var(--site-bottom-nav-offset)+0.75rem)] ${NARADJI_Z} flex flex-col items-center gap-2 px-4 md:bottom-6`}
    >
      {transcript && (listening || working || micState === 'idle') ? (
        <div className="pointer-events-none max-w-xl rounded-full bg-stone-900/85 px-4 py-2 text-center text-sm text-stone-50 shadow-lg backdrop-blur">
          {transcript}
        </div>
      ) : null}
      <button
        type="button"
        className={[
          'pointer-events-auto relative flex h-auto min-w-0 items-center justify-center bg-transparent p-0 shadow-none',
          listening ? 'ring-4 ring-red-400/60 rounded-full' : '',
          working && !listening ? 'ring-4 ring-amber-400/50 rounded-full' : '',
        ].join(' ')}
        onClick={onClick}
        aria-pressed={listening}
        aria-busy={working}
        aria-label={
          listening
            ? 'Stop listening'
            : working
              ? 'Interrupt Naradji and start listening'
              : 'Start listening with Naradji'
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={listening ? 'narad-listening' : working ? 'narad-working' : 'narad-idle'}
            className="relative block"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <motion.img
              src={listening ? '/naradji/narad-listening.png' : '/naradji/narad-idle.png'}
              alt={listening ? 'Naradji listening' : working ? 'Naradji working' : 'Talk to Naradji'}
              draggable={false}
              className={[
                'w-auto select-none mix-blend-lighten drop-shadow-2xl',
                listening ? 'h-24 sm:h-28' : 'h-36 sm:h-44',
                working && !listening ? 'opacity-90' : '',
              ].join(' ')}
              animate={
                listening
                  ? { y: [0, -6, 0], scale: [1, 1.04, 1] }
                  : working
                    ? { y: [0, -4, 0] }
                    : { y: [0, -10, 0] }
              }
              transition={{
                duration: listening ? 1.1 : 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.span>
        </AnimatePresence>
      </button>
      <p
        className={[
          'pointer-events-none text-xs',
          listening ? 'font-medium text-red-600' : working ? 'font-medium text-amber-700' : 'text-stone-500',
        ].join(' ')}
      >
        {hint}
      </p>
    </div>
  )
}
