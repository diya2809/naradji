import type { CollectionAfterChangeHook } from 'payload'
import type { Order } from '@/payload-types'
import {
  findOrdersForTransaction,
  getCanonicalOrder,
  getOrderTransactionIds,
} from '@/plugins/cod/orderCompletionGuards'

/**
 * Removes duplicate storefront orders that share the same payment transaction.
 * Keeps the earliest created order as the single source of truth.
 */
export const dedupeOrdersForTransaction: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (req.context?.skipDuplicateOrderCleanup) {
    return
  }

  const order = doc as Order
  if (order.paymentStatus !== 'paid') {
    return
  }

  if (order.status !== 'processing' && order.status !== 'completed') {
    return
  }

  const payload = req.payload
  const transactionIds = getOrderTransactionIds(order)
  if (transactionIds.length === 0) {
    return
  }

  for (const transactionId of transactionIds) {
    const relatedOrders = await findOrdersForTransaction(payload, transactionId, 'orders', req)
    const canonicalOrder = getCanonicalOrder(relatedOrders)

    if (!canonicalOrder || relatedOrders.length <= 1) {
      continue
    }

    const duplicateOrders = relatedOrders.filter((related) => related.id !== canonicalOrder.id)

    for (const duplicate of duplicateOrders) {
      payload.logger.warn(
        `[Orders] Removing duplicate order ${duplicate.id} for transaction ${transactionId}. Keeping ${canonicalOrder.id}.`,
      )

      await payload.delete({
        collection: 'orders',
        id: duplicate.id,
        overrideAccess: true,
        req,
        context: {
          skipConfirmationEmails: true,
          skipDuplicateOrderCleanup: true,
        },
      })
    }
  }
}