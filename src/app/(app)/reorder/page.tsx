import type { Metadata } from 'next'

import { MaxWidthWrapper } from '@/components/MaxWidthWrapper'
import { ReorderProductCard } from '@/components/ReorderProductCard'
import { Button } from '@/components/ui/button'
import { getCustomerOrders } from '@/utilities/getCustomerOrders'
import { getRequestUser } from '@/utilities/getRequestUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ReorderPage() {
  const user = await getRequestUser()

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent('/reorder')}&warning=${encodeURIComponent('Log in to see your order history.')}`,
    )
  }

  let orders: Awaited<ReturnType<typeof getCustomerOrders>> = []

  try {
    orders = await getCustomerOrders({ user, limit: 50 })
  } catch {
    // Build may run before APIs are live on Payload Cloud.
  }

  const cards = orders.flatMap((order) =>
    (order.items ?? [])
      .filter((item) => item.product && typeof item.product === 'object')
      .map((item) => ({ order, item, key: `${order.id}-${item.id ?? item.product}` })),
  )

  return (
    <MaxWidthWrapper className="py-6 md:py-10">
      <h1 className="mb-4 text-2xl font-semibold md:mb-6 md:text-3xl">Order history</h1>

      {cards.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card px-4 py-8">
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild>
            <Link href="/shop">Go to shop</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map(({ order, item, key }) => (
            <li key={String(key)}>
              <ReorderProductCard order={order} item={item} />
            </li>
          ))}
        </ul>
      )}
    </MaxWidthWrapper>
  )
}

export const metadata: Metadata = {
  description: 'Reorder from your past orders.',
  openGraph: mergeOpenGraph({
    title: 'Reorder',
    url: '/reorder',
  }),
  title: 'Reorder',
}
