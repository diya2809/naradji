'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Theme, ThemeContextType, ThemeSetting } from './types'

import { canUseDOM } from '@/utilities/canUseDOM'
import {
  preferenceIsValid,
  resolveTheme,
  themeLocalStorageKey,
} from './shared'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

function applyResolvedTheme(preference: null | string) {
  const resolved = resolveTheme(preference)
  document.documentElement.setAttribute('data-theme', resolved)
  return resolved
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: ThemeSetting) => {
    window.localStorage.setItem(themeLocalStorageKey, themeToSet)
    const resolved = applyResolvedTheme(themeToSet)
    setThemeState(resolved)
  }, [])

  useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    const resolved = applyResolvedTheme(preferenceIsValid(preference) ? preference : null)
    setThemeState(resolved)

    const onSystemThemeChange = () => {
      const stored = window.localStorage.getItem(themeLocalStorageKey)
      if (stored !== 'auto') return
      const next = applyResolvedTheme('auto')
      setThemeState(next)
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', onSystemThemeChange)

    return () => mediaQuery.removeEventListener('change', onSystemThemeChange)
  }, [])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
