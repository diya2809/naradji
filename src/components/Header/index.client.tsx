'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Logo } from '@/components/Logo/Logo'
import { Search } from '@/components/Search'
import { siteLayoutVars } from '@/utilities/siteLayout'
import Link from 'next/link'
import React, { Suspense } from 'react'

export function HeaderClient() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-background">
      <div className="bg-background">
        <nav
          className="container relative flex items-center gap-2"
          style={{ height: siteLayoutVars.headerNavHeight }}
        >
          <Link
            href="/"
            aria-label="Naradji home"
            className="shrink-0 rounded-full transition-opacity hover:opacity-90"
          >
            <Logo size="icon" className="size-9 md:size-10" />
          </Link>

          <Suspense
            fallback={<div className="h-10 min-w-0 flex-1 rounded-md bg-muted/40" aria-hidden />}
          >
            <Search className="min-w-0 flex-1" />
          </Suspense>

          <Suspense fallback={<OpenCartButton className="hidden md:inline-flex" />}>
            <Cart className="hidden md:inline-flex" />
          </Suspense>
        </nav>
      </div>
    </div>
  )
}
