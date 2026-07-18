'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, PanInfo } from 'motion/react'
import { IconX, IconRuler } from '@tabler/icons-react'
import { cn } from '@/utilities/cn'

const SIZE_CHART_SRC = '/size-chart.png'
const SIZE_CHART_ALT = 'Size Chart'

export function SizeChartModal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Mount guard — portal requires document
  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Swipe-down to dismiss on mobile
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80) setOpen(false)
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Mobile backdrop (md:hidden) ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-foreground/50 backdrop-blur-sm md:hidden"
            ref={overlayRef}
            onClick={() => setOpen(false)}
          />

          {/* ── Mobile: bottom sheet (80 dvh) ── */}
          <motion.div
            key="sheet-mobile"
            className={cn(
              'fixed inset-x-0 bottom-0 z-[9999] flex flex-col md:hidden',
              'rounded-t-2xl bg-background shadow-xl',
              'h-[80dvh]',
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="text-sm font-semibold text-foreground">Size Chart</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close size chart"
              >
                <IconX className="size-4" />
              </button>
            </div>

            {/* Scrollable image */}
            <div className="flex-1 overflow-auto px-4 pb-6 touch-pan-y">
              <img
                src={SIZE_CHART_SRC}
                alt={SIZE_CHART_ALT}
                className="w-full h-auto object-contain touch-pinch-zoom select-none"
                draggable={false}
              />
            </div>
          </motion.div>

          {/* ── Desktop: centered dialog card ── */}
          <motion.div
            key="modal-desktop"
            className="fixed inset-0 z-[9998] hidden md:flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative flex flex-col bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Size Chart</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Close size chart"
                >
                  <IconX className="size-4" />
                </button>
              </div>

              {/* Image — fits fully, no scroll */}
              <div className="p-4">
                <img
                  src={SIZE_CHART_SRC}
                  alt={SIZE_CHART_ALT}
                  className="w-full h-auto max-h-[65vh] object-contain select-none"
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Trigger link */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline transition-colors"
        aria-label="View size chart"
      >
        <IconRuler className="size-3.5 shrink-0" />
        Size Chart
      </button>

      {/* Portal renders into document.body — escapes navbar stacking context */}
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
