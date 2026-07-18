import type { CollectionSlug, PayloadRequest } from 'payload'
import type { Order, Transaction } from '@/payload-types'
import { resolveOrderCustomerContact } from '@/ecommerce/resolveOrderCustomer'
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_CHARGE_AMOUNT,
  getShippingCharge,
} from '@/lib/shippingCharge'
import {
  buildOrderCompletionResult,
  claimCodTransaction,
  findExistingOrderForTransaction,
  resolveExistingOrderCompletion,
} from './orderCompletionGuards'

type CompleteOrderArgs = {
  cartsSlug?: CollectionSlug
  customerEmail?: string
  ordersSlug?: CollectionSlug
  reference: string
  req: PayloadRequest
  transaction: Transaction
  transactionsSlug?: CollectionSlug
}

type TransactionWithShipping = Transaction & {
  shippingCharge?: number | null
  cod?: { reference?: string | null } | null
}

const resolveShippingCharge = (transaction: TransactionWithShipping): number => {
  if (typeof transaction.shippingCharge === 'number' && Number.isFinite(transaction.shippingCharge)) {
    return Math.max(0, transaction.shippingCharge)
  }

  const totalAmountInRupees = Math.round((transaction.amount ?? 0) / 100)

  if (totalAmountInRupees >= FREE_SHIPPING_THRESHOLD) {
    return 0
  }

  if (totalAmountInRupees >= SHIPPING_CHARGE_AMOUNT) {
    const productSubtotal = totalAmountInRupees - SHIPPING_CHARGE_AMOUNT
    return getShippingCharge(productSubtotal)
  }

  return 0
}

export const completeOrderFromTransaction = async ({
  cartsSlug = 'carts',
  customerEmail,
  ordersSlug = 'orders',
  reference,
  req,
  transaction,
  transactionsSlug = 'transactions',
}: CompleteOrderArgs) => {
  const payload = req.payload

  const freshTransaction = (await payload.findByID({
    collection: transactionsSlug,
    id: transaction.id,
    depth: 0,
    overrideAccess: true,
    req,
  })) as TransactionWithShipping

  const existingCompletion = await resolveExistingOrderCompletion(
    payload,
    freshTransaction,
    ordersSlug,
    req,
  )

  if (existingCompletion) {
    return existingCompletion
  }

  const claimedTransaction = await claimCodTransaction(
    payload,
    freshTransaction,
    reference,
    req,
  )

  if (!claimedTransaction) {
    const racedCompletion = await resolveExistingOrderCompletion(
      payload,
      (await payload.findByID({
        collection: transactionsSlug,
        id: transaction.id,
        depth: 0,
        overrideAccess: true,
        req,
      })) as Transaction,
      ordersSlug,
      req,
      { retryMs: 750 },
    )

    if (racedCompletion) {
      return racedCompletion
    }

    throw new Error('This order is already being confirmed. Please check your orders.')
  }

  transaction = claimedTransaction as TransactionWithShipping

  const cartID = typeof transaction.cart === 'object' ? transaction.cart?.id : transaction.cart
  if (!cartID) {
    throw new Error('Cart ID not found on transaction')
  }

  const cartItemsSnapshot = transaction.items
  if (!cartItemsSnapshot || !Array.isArray(cartItemsSnapshot) || cartItemsSnapshot.length === 0) {
    throw new Error('Cart items not found on transaction')
  }

  const shippingAddress = transaction.billingAddress
  const totalAmountInRupees = Math.round((transaction.amount ?? 0) / 100)
  const shippingCharge = resolveShippingCharge(transaction)

  const existingBeforeCreate = await findExistingOrderForTransaction(
    payload,
    transaction.id,
    ordersSlug,
    req,
  )

  if (existingBeforeCreate) {
    return buildOrderCompletionResult(
      existingBeforeCreate,
      transaction.id,
      'Order already confirmed',
    )
  }

  const { customerId, customerEmail: resolvedCustomerEmail } = await resolveOrderCustomerContact({
    customerEmail,
    payload,
    req,
    transactionCustomer: transaction.customer,
    transactionCustomerEmail: transaction.customerEmail,
    userEmail: req.user?.email,
    userId: req.user?.id,
  })

  const order = (await payload.create({
    collection: ordersSlug,
    data: {
      amount: totalAmountInRupees,
      currency: transaction.currency,
      shippingCharge,
      ...(customerId ? { customer: customerId } : {}),
      ...(resolvedCustomerEmail ? { customerEmail: resolvedCustomerEmail } : {}),
      items: cartItemsSnapshot,
      shippingAddress,
      status: 'processing',
      // COD — collect payment on delivery
      paymentStatus: 'pending',
      transactions: [transaction.id],
    },
    req,
  })) as Order

  const timestamp = new Date().toISOString()

  await payload.update({
    id: cartID,
    collection: cartsSlug,
    data: {
      items: [],
      purchasedAt: timestamp,
    },
    req,
  })

  await payload.update({
    id: transaction.id,
    collection: transactionsSlug,
    data: {
      order: order.id,
      status: 'succeeded',
      cod: {
        reference,
      },
    },
    req,
  })

  return buildOrderCompletionResult(order, transaction.id, 'COD order confirmed successfully')
}
