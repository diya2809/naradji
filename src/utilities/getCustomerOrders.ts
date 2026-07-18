import type { Order, User } from '@/payload-types'
import configPromise from '@payload-config'
import {
  getCanonicalOrder,
  getOrderTransactionIds,
} from '@/plugins/cod/orderCompletionGuards'
import { orderLineProductPopulate } from '@/utilities/fetchListingProducts'
import { getPayload } from 'payload'

type GetCustomerOrdersArgs = {
  user: User
  limit?: number
}

export async function getCustomerOrders({
  user,
  limit = 5,
}: GetCustomerOrdersArgs): Promise<Order[]> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'orders',
    depth: 3,
    limit,
    overrideAccess: false,
    pagination: false,
    populate: orderLineProductPopulate,
    user,
    where: {
      customer: {
        equals: user.id,
      },
    },
  })

  const orders = result.docs as Order[]
  const canonicalByTransaction = new Map<string, Order>()
  const ordersWithoutTransaction: Order[] = []

  for (const order of orders) {
    const transactionIds = getOrderTransactionIds(order)

    if (transactionIds.length === 0) {
      ordersWithoutTransaction.push(order)
      continue
    }

    const transactionKey = [...transactionIds].sort().join(':')
    const existing = canonicalByTransaction.get(transactionKey)
    const canonical = getCanonicalOrder(existing ? [existing, order] : [order])

    if (canonical) {
      canonicalByTransaction.set(transactionKey, canonical)
    }
  }

  const dedupedOrders = [
    ...ordersWithoutTransaction,
    ...canonicalByTransaction.values(),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return dedupedOrders.slice(0, limit)
}
