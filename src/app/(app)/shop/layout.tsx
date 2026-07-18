import { Search } from '@/components/Search'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MaxWidthWrapper className="my-10 space-y-6">
        <Search />
        <div className="min-h-screen">{children}</div>
      </MaxWidthWrapper>
    </Suspense>
  )
}
