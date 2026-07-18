'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React, { useState } from 'react'

import type { ThemeSetting } from '../types'

import { useTheme } from '..'
import { preferenceIsValid, themeLocalStorageKey } from '../shared'

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState<ThemeSetting>('light')

  const onThemeChange = (themeToSet: ThemeSetting) => {
    setTheme(themeToSet)
    setValue(themeToSet)
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue(preferenceIsValid(preference) ? preference : 'light')
  }, [])

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger className="w-auto bg-transparent gap-2 md:pl-3 border-none">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}
