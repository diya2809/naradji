import React from 'react'

import { defaultTheme, themeLocalStorageKey } from '../shared'

export const InitTheme: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    function resolveTheme(preference) {
      if (preference === 'light' || preference === 'dark') {
        return preference
      }

      if (preference === 'auto') {
        return getImplicitPreference() || '${defaultTheme}'
      }

      return '${defaultTheme}'
    }

    var preference = window.localStorage.getItem('${themeLocalStorageKey}')
    var themeToSet = resolveTheme(preference)

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
      id="theme-script"
    />
  )
}
