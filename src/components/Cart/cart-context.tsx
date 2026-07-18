'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

type CartDrawerContext = {
  open: boolean
  openCart: () => void
  setOpen: (open: boolean) => void
}

const Context = createContext<CartDrawerContext | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openCart = useCallback(() => setOpen(true), [])

  return <Context.Provider value={{ open, openCart, setOpen }}>{children}</Context.Provider>
}

export function useCartDrawer(): CartDrawerContext {
  const context = useContext(Context)

  if (!context) {
    throw new Error('useCartDrawer must be used within CartProvider')
  }

  return context
}
