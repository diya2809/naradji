import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'

export default function Checkout() {
  return (
    <MaxWidthWrapper className="min-h-screen pt-2 pb-8">
      <h1 className="sr-only">Checkout</h1>
      <CheckoutPage />
    </MaxWidthWrapper>
  )
}

export const metadata: Metadata = {
  description: 'Checkout — Cash on Delivery.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
