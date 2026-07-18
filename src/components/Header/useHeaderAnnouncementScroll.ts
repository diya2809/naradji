'use client'

import { useEffect, useRef } from 'react'

import {
  HEADER_SCROLL_EXPAND_THRESHOLD,
  HEADER_SCROLL_THRESHOLD,
} from '@/utilities/siteLayout'

const ANNOUNCEMENT_HEIGHT_FULL = 'var(--site-header-announcement-height)'
const ANNOUNCEMENT_HEIGHT_COLLAPSED = '0px'

/** Updates `--site-header-announcement-display-height` from scroll (no React state / re-renders). */
export function useHeaderAnnouncementScroll(showAnnouncement: boolean) {
  const isScrolledRef = useRef(false)
  const lastDisplayHeightRef = useRef<string | null>(null)

  useEffect(() => {
    const root = document.documentElement

    const setDisplayHeight = (collapsed: boolean) => {
      const next =
        showAnnouncement && !collapsed
          ? ANNOUNCEMENT_HEIGHT_FULL
          : ANNOUNCEMENT_HEIGHT_COLLAPSED

      if (lastDisplayHeightRef.current === next) return
      lastDisplayHeightRef.current = next
      root.style.setProperty('--site-header-announcement-display-height', next)
    }

    let frame = 0

    const update = () => {
      if (!showAnnouncement) {
        isScrolledRef.current = false
        setDisplayHeight(true)
        return
      }

      const y = window.scrollY
      const prev = isScrolledRef.current
      const next = prev
        ? y > HEADER_SCROLL_EXPAND_THRESHOLD
        : y > HEADER_SCROLL_THRESHOLD

      if (next !== prev) {
        isScrolledRef.current = next
      }

      setDisplayHeight(next)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    isScrolledRef.current = window.scrollY > HEADER_SCROLL_THRESHOLD
    setDisplayHeight(isScrolledRef.current)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [showAnnouncement])
}
