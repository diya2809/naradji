'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DEMO_BREATH_TRANSCRIPT } from '@/lib/naradji/demoBreath'
import { useNaradjiStore, type MicState } from '@/lib/naradji/store'

const LABEL: Record<MicState, string> = {
  idle: 'Talk to Naradji',
  greeting: 'Naradji…',
  listening: 'Listening…',
  transcribing: 'Samajh rahe hain…',
  adding: 'Cart mein…',
  speaking: 'Bol rahe hain…',
}

const HOLD_MS = 220

export function MicPill({
  demo,
  onOpenSession,
  onTranscript,
}: {
  demo: boolean
  /** First tap: open session + greeting (no cart sheet). */
  onOpenSession: () => void | Promise<void>
  onTranscript: (text: string) => void | Promise<void>
}) {
  const micState = useNaradjiStore((s) => s.micState)
  const sessionOpen = useNaradjiStore((s) => s.sessionOpen)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const transcript = useNaradjiStore((s) => s.transcript)
  const naradjiLine = useNaradjiStore((s) => s.uispec.naradji_line)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recording = useRef(false)
  const [supported, setSupported] = useState(true)
  const listening = micState === 'listening'

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  async function captureAndTranscribe() {
    if (demo || !supported) {
      setMicState('transcribing')
      const text = DEMO_BREATH_TRANSCRIPT
      setTranscript(text)
      await onTranscript(text)
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
        const form = new FormData()
        form.append('file', blob, 'utterance.webm')
        try {
          const res = await fetch('/api/stt', { method: 'POST', body: form })
          const data = (await res.json()) as { transcript?: string }
          const text = data.transcript || ''
          setTranscript(text)
          await onTranscript(text)
        } catch {
          const text = DEMO_BREATH_TRANSCRIPT
          setTranscript(text)
          await onTranscript(text)
        }
      }
      mediaRef.current = recorder
      recorder.start()
      recording.current = true
      setMicState('listening')
    } catch {
      setMicState('transcribing')
      const text = DEMO_BREATH_TRANSCRIPT
      setTranscript(text)
      await onTranscript(text)
    }
  }

  function stopRecording() {
    const r = mediaRef.current
    if (r && r.state === 'recording') r.stop()
    mediaRef.current = null
  }

  function clearHoldTimer() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (micState === 'greeting' || micState === 'transcribing' || micState === 'adding') return

    if (!sessionOpen) {
      void onOpenSession()
      return
    }

    holdTimer.current = setTimeout(() => {
      holdTimer.current = null
      void captureAndTranscribe()
    }, HOLD_MS)
  }

  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (holdTimer.current) {
      clearHoldTimer()
      if (sessionOpen && micState === 'idle' && (demo || !supported)) {
        void captureAndTranscribe()
      }
      return
    }
    if (recording.current || micState === 'listening') stopRecording()
  }

  const bubbleText = listening
    ? transcript || 'Listening… Boliye apni list.'
    : sessionOpen && (micState === 'greeting' || micState === 'speaking' || micState === 'transcribing')
      ? transcript || naradjiLine || LABEL[micState]
      : null

  const hint = !sessionOpen
    ? 'Tap — Naradji sunega'
    : micState === 'idle'
      ? 'Hold to speak · “haan pakka” to confirm'
      : LABEL[micState]

  return (
    <div
      className={[
        'pointer-events-none fixed z-50 flex px-3 md:px-4',
        listening
          ? 'bottom-[calc(var(--site-bottom-nav-offset)+0.75rem)] left-0 items-end gap-2 md:bottom-6 md:left-4'
          : 'inset-x-0 bottom-[calc(var(--site-bottom-nav-offset)+0.75rem)] flex-col items-center gap-2 md:bottom-6',
      ].join(' ')}
    >
      {/* Persistent control — must not remount when listening starts (pointer capture). */}
      <button
        type="button"
        aria-label={listening ? 'Release to stop listening' : LABEL[micState]}
        className={[
          'pointer-events-auto flex h-auto min-w-0 items-center justify-center bg-transparent p-0 shadow-none',
          listening ? 'order-1 shrink-0' : 'order-2',
        ].join(' ')}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          clearHoldTimer()
          if (micState === 'listening') stopRecording()
        }}
        onPointerLeave={() => {
          if (!listening) clearHoldTimer()
        }}
      >
        <motion.img
          key={listening ? 'narad-listening' : 'narad-idle'}
          src={listening ? '/naradji/narad-listening.png' : '/naradji/narad-idle.png'}
          alt={listening ? 'Naradji listening' : 'Hold to speak with Naradji'}
          draggable={false}
          className={[
            'w-auto select-none drop-shadow-2xl',
            listening ? 'h-24 sm:h-28' : 'h-36 sm:h-44',
          ].join(' ')}
          initial={{ opacity: 0.85, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { type: 'spring', stiffness: 380, damping: 24 },
            y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      </button>

      <AnimatePresence>
        {bubbleText ? (
          <motion.div
            key={listening ? 'bubble-listen' : 'bubble-status'}
            className={[
              'max-w-[min(16rem,calc(100vw-7rem))] rounded-2xl bg-white px-3.5 py-3 text-sm leading-snug text-stone-900 shadow-[0_8px_28px_rgba(0,0,0,0.16)] ring-1 ring-black/5',
              listening
                ? 'order-2 mb-3 text-left'
                : 'order-1 pointer-events-none text-center max-w-xs',
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          >
            {bubbleText}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!listening ? (
        <p className="order-3 pointer-events-none text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  )
}
