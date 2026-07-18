import type { Theme } from './types'

export type ThemePreference = Theme | 'auto'

export const themeLocalStorageKey = 'payload-theme'

export const defaultTheme: Theme = 'light'

export const getImplicitPreference = (): Theme | null => {
  const mediaQuery = '(prefers-color-scheme: dark)'
  const mql = window.matchMedia(mediaQuery)
  const hasImplicitPreference = typeof mql.matches === 'boolean'

  if (hasImplicitPreference) {
    return mql.matches ? 'dark' : 'light'
  }

  return null
}

export function preferenceIsValid(value: null | string): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'auto'
}

/** First visit → light. Auto → OS preference. Explicit light/dark → as stored. */
export function resolveTheme(preference: null | string): Theme {
  if (preference === 'light' || preference === 'dark') {
    return preference
  }

  if (preference === 'auto') {
    return getImplicitPreference() ?? defaultTheme
  }

  return defaultTheme
}
