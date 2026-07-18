import type { Metadata } from 'next'

import { AccountPanel } from '@/components/account/AccountPanel'
import { OrderItem } from '@/components/OrderItem'
import { getCustomerOrders } from '@/utilities/getCustomerOrders'
import { getRequestUser } from '@/utilities/getRequestUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { redirect } from 'next/navigation'

export default async function Orders() {
  const user = await getRequestUser()

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Log in to continue.')}`)
  }

  let orders: Awaited<ReturnType<typeof getCustomerOrders>> = []

  try {
    orders = await getCustomerOrders({ user, limit: 50 })
  } catch {
    // Build may run before APIs are live on Payload Cloud.
  }

  return (
    <AccountPanel>
      <h1 className="mb-6 text-3xl font-semibold md:mb-8">Orders</h1>

      {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}

      {orders.length > 0 && (
        <ul className="flex flex-col gap-6">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderItem order={order} />
            </li>
          ))}
        </ul>
      )}
    </AccountPanel>
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
