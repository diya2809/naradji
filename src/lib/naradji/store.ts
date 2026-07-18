'use client'

import { create } from 'zustand'
import { emptyUISpec, type UISpec } from './uispec'
import type { LeanProduct } from './catalog'

export type MicState =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'transcribing'
  | 'adding'
  | 'speaking'

type NaradjiStore = {
  catalog: LeanProduct[]
  uispec: UISpec
  /** Session cart lines — survives compare Q&A overlays. */
  cartItems: UISpec['items']
  transcript: string
  micState: MicState
  sessionOpen: boolean
  lastOrderId: string | null
  cartSyncSkipped: string[]
  setCatalog: (catalog: LeanProduct[]) => void
  setUISpec: (uispec: UISpec) => void
  setCartItems: (items: UISpec['items']) => void
  patchUISpec: (partial: Partial<UISpec>) => void
  setTranscript: (transcript: string) => void
  setMicState: (micState: MicState) => void
  setSessionOpen: (open: boolean) => void
  setLastOrderId: (id: string | null) => void
  setCartSyncSkipped: (ids: string[]) => void
  reset: () => void
}

export const useNaradjiStore = create<NaradjiStore>((set) => ({
  catalog: [],
  uispec: emptyUISpec(),
  cartItems: [],
  transcript: '',
  micState: 'idle',
  sessionOpen: false,
  lastOrderId: null,
  cartSyncSkipped: [],
  setCatalog: (catalog) => set({ catalog }),
  setUISpec: (uispec) => set({ uispec }),
  setCartItems: (cartItems) => set({ cartItems }),
  patchUISpec: (partial) => set((s) => ({ uispec: { ...s.uispec, ...partial } })),
  setTranscript: (transcript) => set({ transcript }),
  setMicState: (micState) => set({ micState }),
  setSessionOpen: (sessionOpen) => set({ sessionOpen }),
  setLastOrderId: (lastOrderId) => set({ lastOrderId }),
  setCartSyncSkipped: (cartSyncSkipped) => set({ cartSyncSkipped }),
  reset: () =>
    set({
      uispec: emptyUISpec(),
      cartItems: [],
      transcript: '',
      micState: 'idle',
      sessionOpen: false,
      lastOrderId: null,
      cartSyncSkipped: [],
    }),
}))
