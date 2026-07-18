'use client'

import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext } from 'react'

type CartDrawerContext = {
  openCart: () => void
}

const Context = createContext<CartDrawerContext | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const openCart = useCallback(() => {
    router.push('/cart')
  }, [router])

  return <Context.Provider value={{ openCart }}>{children}</Context.Provider>
}

export function useCartDrawer(): CartDrawerContext {
  const context = useContext(Context)

  if (!context) {
    throw new Error('useCartDrawer must be used within CartProvider')
  }

  return context
}
