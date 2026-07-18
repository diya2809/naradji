import type { Metadata } from 'next'

import { CartView } from '@/components/Cart/CartView'
import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default function CartPage() {
  return (
    <MaxWidthWrapper className="py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-semibold md:text-3xl">Cart</h1>
      <CartView />
    </MaxWidthWrapper>
  )
}

export const metadata: Metadata = {
  description: 'Your shopping cart.',
  openGraph: mergeOpenGraph({
    title: 'Cart',
    url: '/cart',
  }),
  title: 'Cart',
}
