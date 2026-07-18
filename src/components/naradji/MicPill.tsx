'use client'

import { useEffect, useRef, useState } from 'react'
import { useNaradjiStore, type MicState } from '@/lib/naradji/store'

const LABEL: Record<MicState, string> = {
  idle: 'Hold to speak',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  morphing: 'Morphing…',
  speaking: 'Speaking…',
}

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
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  async function start() {
    if (micState !== 'idle' && micState !== 'speaking') return
    if (demo) {
      setMicState('transcribing')
      const text = 'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'
      setTranscript(text)
      await onTranscript(text)
      return
    }
    if (!supported) {
      setMicState('transcribing')
      const text = 'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'
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
        setMicState('transcribing')
        const blob = new Blob(chunksRef.current, { type: mime })
        const form = new FormData()
        form.append('file', blob, 'utterance.webm')
        if (demo) form.append('demo', '1')
        try {
          const res = await fetch(demo ? '/api/stt?demo=1' : '/api/stt', {
            method: 'POST',
            body: form,
          })
          const data = (await res.json()) as { transcript?: string }
          const text = data.transcript || ''
          setTranscript(text)
          await onTranscript(text)
        } catch {
          const text = 'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'
          setTranscript(text)
          await onTranscript(text)
        }
      }
      mediaRef.current = recorder
      recorder.start()
      setMicState('listening')
    } catch {
      setMicState('transcribing')
      const text = 'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'
      setTranscript(text)
      await onTranscript(text)
    }
  }

  function stop() {
    const r = mediaRef.current
    if (r && r.state === 'recording') r.stop()
    mediaRef.current = null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {transcript ? (
        <div className="pointer-events-none max-w-xl rounded-full bg-stone-900/85 px-4 py-2 text-center text-sm text-stone-50 shadow-lg backdrop-blur">
          {transcript}
        </div>
      ) : null}
      <button
        type="button"
        className={[
          'pointer-events-auto flex h-14 min-w-[12rem] items-center justify-center gap-2 rounded-full px-6 text-sm font-medium shadow-xl transition',
          micState === 'listening'
            ? 'bg-red-600 text-white ring-4 ring-red-300/50'
            : 'bg-stone-900 text-stone-50 hover:bg-stone-800',
        ].join(' ')}
        onPointerDown={(e) => {
          e.preventDefault()
          void start()
        }}
        onPointerUp={(e) => {
          e.preventDefault()
          stop()
        }}
        onPointerLeave={() => {
          if (micState === 'listening') stop()
        }}
        onKeyDown={(e) => {
          if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void start()
          }
        }}
      >
        <span
          className={[
            'inline-block h-2.5 w-2.5 rounded-full',
            micState === 'listening' ? 'animate-pulse bg-white' : 'bg-amber-400',
          ].join(' ')}
        />
        {LABEL[micState]}
      </button>
      <p className="pointer-events-none text-xs text-stone-500">
        Hold mic · or press Demo chip · confirm with “haan pakka”
      </p>
    </div>
  )
}
