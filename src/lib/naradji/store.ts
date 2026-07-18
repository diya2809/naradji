'use client'

import { create } from 'zustand'
import { emptyUISpec, type UISpec } from './uispec'
import type { LeanProduct } from './catalog'

export type MicState = 'idle' | 'listening' | 'transcribing' | 'morphing' | 'speaking'

type NaradjiStore = {
  catalog: LeanProduct[]
  uispec: UISpec
  transcript: string
  micState: MicState
  lastOrderId: string | null
  setCatalog: (catalog: LeanProduct[]) => void
  setUISpec: (uispec: UISpec) => void
  patchUISpec: (partial: Partial<UISpec>) => void
  setTranscript: (transcript: string) => void
  setMicState: (micState: MicState) => void
  setLastOrderId: (id: string | null) => void
  reset: () => void
}

export const useNaradjiStore = create<NaradjiStore>((set) => ({
  catalog: [],
  uispec: emptyUISpec(),
  transcript: '',
  micState: 'idle',
  lastOrderId: null,
  setCatalog: (catalog) => set({ catalog }),
  setUISpec: (uispec) => set({ uispec }),
  patchUISpec: (partial) => set((s) => ({ uispec: { ...s.uispec, ...partial } })),
  setTranscript: (transcript) => set({ transcript }),
  setMicState: (micState) => set({ micState }),
  setLastOrderId: (lastOrderId) => set({ lastOrderId }),
  reset: () =>
    set({
      uispec: emptyUISpec(),
      transcript: '',
      micState: 'idle',
      lastOrderId: null,
    }),
}))
