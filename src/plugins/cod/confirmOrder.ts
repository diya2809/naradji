import type { CollectionSlug } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import { completeOrderFromTransaction } from './completeOrder'
import type { CodAdapterArgs } from './types'
import type { Transaction } from '@/payload-types'

export const confirmOrder =
  (_props: CodAdapterArgs): NonNullable<PaymentAdapter>['confirmOrder'] =>
  async ({ cartsSlug, data, ordersSlug, req, transactionsSlug }) => {
    const payload = req.payload
    const customerEmail = data.customerEmail as string | undefined
    const reference = (data.reference || data.orderID) as string | undefined

    if (!reference) {
      throw new Error('COD reference is required to confirm the order')
    }

    try {
      const transactionsResults = await payload.find({
        collection: (transactionsSlug || 'transactions') as CollectionSlug,
        req,
        where: {
          'cod.reference': {
            equals: reference,
          },
        },
      })

      const transaction = transactionsResults.docs[0] as Transaction | undefined

      if (!transactionsResults.totalDocs || !transaction) {
        throw new Error('No transaction found for this COD order')
      }

      return completeOrderFromTransaction({
        cartsSlug: cartsSlug as CollectionSlug | undefined,
        customerEmail,
        ordersSlug: ordersSlug as CollectionSlug | undefined,
        reference,
        req,
        transaction,
        transactionsSlug: transactionsSlug as CollectionSlug | undefined,
      })
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Error confirming COD order',
      })
      throw new Error(error instanceof Error ? error.message : 'Unknown error confirming COD order')
    }
  }
