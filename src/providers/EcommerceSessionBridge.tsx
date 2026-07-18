'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useEffect, useRef } from 'react'

/**
 * Keeps Payload ecommerce cart state in sync with auth session changes.
 * Auth lives outside EcommerceProvider (reference layout); this bridge calls
 * onLogin/onLogout when auth status transitions.
 */
export function EcommerceSessionBridge({ children }: { children: React.ReactNode }) {
  const { onLogin, onLogout } = useEcommerce()
  const { status } = useAuth()
  const previousStatus = useRef(status)

  useEffect(() => {
    const previous = previousStatus.current

    if (status === 'loggedIn' && previous !== 'loggedIn') {
      void onLogin()
    }

    if (status === 'loggedOut' && previous === 'loggedIn') {
      onLogout()
    }

    previousStatus.current = status
  }, [onLogin, onLogout, status])

  return <>{children}</>
}
