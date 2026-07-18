import type { CollectionSlug, Payload, PayloadRequest } from 'payload'
import type { Order } from '@/payload-types'
import {
  findOrdersForTransaction,
  getCanonicalOrder,
  getOrderTransactionIds,
} from '@/plugins/cod/orderCompletionGuards'

export async function isCanonicalPaidOrder(
  payload: Payload,
  order: Order,
  req: PayloadRequest,
  ordersSlug: CollectionSlug = 'orders',
): Promise<boolean> {
  if (order.paymentStatus !== 'paid') {
    return true
  }

  const transactionIds = getOrderTransactionIds(order)
  if (transactionIds.length === 0) {
    return true
  }

  for (const transactionId of transactionIds) {
    const relatedOrders = await findOrdersForTransaction(payload, transactionId, ordersSlug, req)
    const canonicalOrder = getCanonicalOrder(relatedOrders)

    if (canonicalOrder && canonicalOrder.id !== order.id) {
      return false
    }
  }

  return true
}