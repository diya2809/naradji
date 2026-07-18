import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ConfirmOrder } from '@/components/checkout/ConfirmOrder'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default function ConfirmOrderPage() {
  return (
    <MaxWidthWrapper className="flex min-h-screen py-12">
      <Suspense
        fallback={
          <div className="flex w-full flex-col items-center justify-start gap-4 text-center">
            <h1 className="text-2xl">Confirming Order</h1>
            <LoadingSpinner className="h-6 w-12" />
          </div>
        }
      >
        <ConfirmOrder />
      </Suspense>
    </MaxWidthWrapper>
  )
}

export const metadata: Metadata = {
  description: 'Confirm order.',
  openGraph: mergeOpenGraph({
    title: 'Confirming order',
    url: '/checkout/confirm-order',
  }),
  title: 'Confirming order',
}
