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
  /** First tap: open sheet + greeting. */
  onOpenSession: () => void | Promise<void>
  onTranscript: (text: string) => void | Promise<void>
}) {
  const micState = useNaradjiStore((s) => s.micState)
  const sessionOpen = useNaradjiStore((s) => s.sessionOpen)
  const setMicState = useNaradjiStore((s) => s.setMicState)
  const setTranscript = useNaradjiStore((s) => s.setTranscript)
  const transcript = useNaradjiStore((s) => s.transcript)
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

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (micState === 'greeting' || micState === 'transcribing' || micState === 'adding') return

    if (!sessionOpen) {
      void onOpenSession()
      return
    }

    // Hold to speak once session is open
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
      clearTimeout(holdTimer.current)
      holdTimer.current = null
      // Short tap while open: start a quick listen (demo / shy mic)
      if (sessionOpen && micState === 'idle' && (demo || !supported)) {
        void captureAndTranscribe()
      }
      return
    }
    if (recording.current || micState === 'listening') stopRecording()
  }

  const hint = !sessionOpen
    ? 'Tap mic — Naradji opens'
    : micState === 'idle'
      ? 'Hold to speak your list · “haan pakka” to confirm'
      : LABEL[micState]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {transcript && sessionOpen ? (
        <div className="pointer-events-none max-w-xl rounded-full bg-stone-900/85 px-4 py-2 text-center text-sm text-stone-50 shadow-lg backdrop-blur">
          {transcript}
        </div>
      ) : null}
      <button
        type="button"
        aria-label={listening ? 'Release to stop listening' : LABEL[micState]}
        className="pointer-events-auto flex h-auto min-w-0 items-center justify-center bg-transparent p-0 shadow-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          if (holdTimer.current) {
            clearTimeout(holdTimer.current)
            holdTimer.current = null
          }
          if (micState === 'listening') stopRecording()
        }}
        onPointerLeave={() => {
          if (holdTimer.current) {
            clearTimeout(holdTimer.current)
            holdTimer.current = null
          }
          if (micState === 'listening') stopRecording()
        }}
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
              alt={listening ? 'Naradji listening' : 'Hold to speak with Naradji'}
              draggable={false}
              className={[
                'w-auto select-none drop-shadow-2xl',
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
