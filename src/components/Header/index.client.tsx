'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Search } from '@/components/Search'
import { siteLayoutVars } from '@/utilities/siteLayout'
import type { CategoryListItem } from '@/types/storefront'
import React, { Suspense } from 'react'

type Props = {
  categories: CategoryListItem[]
}

export function HeaderClient({ categories }: Props) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-background">
      <div className="bg-background">
        <nav
          className="container relative flex items-center gap-2"
          style={{ height: siteLayoutVars.headerNavHeight }}
        >
          <Suspense
            fallback={<div className="h-10 min-w-0 flex-1 rounded-md bg-muted/40" aria-hidden />}
          >
            <Search className="min-w-0 flex-1" />
          </Suspense>

          <Suspense fallback={<OpenCartButton className="hidden md:inline-flex" />}>
            <Cart categories={categories} />
          </Suspense>
        </nav>
      </div>
    </div>
  )
}
