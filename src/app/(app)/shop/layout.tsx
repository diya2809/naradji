import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import React from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaxWidthWrapper className="my-10 space-y-6">
      <div className="min-h-screen">{children}</div>
    </MaxWidthWrapper>
  )
}
