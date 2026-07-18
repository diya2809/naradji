import type { CollectionSlug, Payload, PayloadRequest } from 'payload'
import type { Order, Transaction } from '@/payload-types'

export type OrderCompletionResult = {
  message: string
  orderID: string
  transactionID: string
  accessToken?: string
}

export const buildOrderCompletionResult = (
  order: Order,
  transactionId: string,
  message: string,
): OrderCompletionResult => ({
  message,
  orderID: order.id,
  transactionID: transactionId,
  ...(order.accessToken ? { accessToken: order.accessToken } : {}),
})

export async function findOrdersForTransaction(
  payload: Payload,
  transactionId: string,
  ordersSlug: CollectionSlug,
  req: PayloadRequest,
): Promise<Order[]> {
  const { docs } = await payload.find({
    collection: ordersSlug,
    depth: 0,
    limit: 10,
    overrideAccess: true,
    req,
    sort: 'createdAt',
    where: {
      transactions: {
        contains: transactionId,
      },
    },
  })

  return docs as Order[]
}

export async function findExistingOrderForTransaction(
  payload: Payload,
  transactionId: string,
  ordersSlug: CollectionSlug,
  req: PayloadRequest,
): Promise<Order | undefined> {
  const orders = await findOrdersForTransaction(payload, transactionId, ordersSlug, req)
  return orders[0]
}

export function getCanonicalOrder(orders: Order[]): Order | undefined {
  if (orders.length === 0) return undefined
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )[0]
}

export function getOrderTransactionIds(order: Order): string[] {
  if (!Array.isArray(order.transactions)) return []

  return order.transactions
    .map((transaction) =>
      typeof transaction === 'object' && transaction !== null ? transaction.id : transaction,
    )
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function resolveExistingOrderCompletion(
  payload: Payload,
  transaction: Transaction,
  ordersSlug: CollectionSlug,
  req: PayloadRequest,
  options?: { retryMs?: number },
): Promise<OrderCompletionResult | null> {
  const linkedOrderId =
    typeof transaction.order === 'object' && transaction.order !== null
      ? transaction.order.id
      : transaction.order

  if (linkedOrderId) {
    try {
      const order = (await payload.findByID({
        collection: ordersSlug,
        id: linkedOrderId,
        depth: 0,
        overrideAccess: true,
        req,
      })) as Order

      return buildOrderCompletionResult(order, transaction.id, 'Order already confirmed')
    } catch {
      // Fall through
    }
  }

  let existingOrder = await findExistingOrderForTransaction(
    payload,
    transaction.id,
    ordersSlug,
    req,
  )

  if (!existingOrder && options?.retryMs) {
    await sleep(options.retryMs)
    existingOrder = await findExistingOrderForTransaction(
      payload,
      transaction.id,
      ordersSlug,
      req,
    )
  }

  if (!existingOrder) {
    return null
  }

  return buildOrderCompletionResult(existingOrder, transaction.id, 'Order already confirmed')
}

/** Atomically claim a pending COD transaction so only one confirm wins. */
export async function claimCodTransaction(
  payload: Payload,
  transaction: Transaction,
  reference: string,
  req: PayloadRequest,
): Promise<Transaction | null> {
  const result = await payload.db.updateOne({
    collection: 'transactions',
    data: {
      cod: {
        ...(typeof transaction === 'object' && 'cod' in transaction
          ? ((transaction as { cod?: Record<string, string | null> }).cod ?? {})
          : {}),
        reference,
      },
    },
    req,
    returning: true,
    where: {
      and: [
        { id: { equals: transaction.id } },
        { status: { equals: 'pending' } },
        {
          or: [
            { 'cod.reference': { exists: false } },
            { 'cod.reference': { equals: null } },
            { 'cod.reference': { equals: '' } },
          ],
        },
      ],
    },
  })

  return (result as unknown as Transaction | null) ?? null
}
