import type { CollectionSlug } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { Transaction } from '@/payload-types'
import { flattenCartItems } from './lib/flattenCart'
import { storeCurrency, toPaise } from './lib/currency'
import type { CodAdapterArgs } from './types'
import { getShippingCharge } from '@/lib/shippingCharge'

export const initiatePayment =
  (_props: CodAdapterArgs): NonNullable<PaymentAdapter>['initiatePayment'] =>
  async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const customerEmail = data.customerEmail
    const cart = data.cart
    const productSubtotal = cart.subtotal ?? 0
    const shippingCharge = getShippingCharge(productSubtotal)
    const amountInRupees = productSubtotal + shippingCharge
    const billingAddressFromData = data.billingAddress
    const shippingAddressFromData = data.shippingAddress

    if (!cart?.items?.length) {
      throw new Error('Cart is empty or not provided.')
    }

    // Email optional for demo — fall back so COD is never blocked on contact fields.
    const email =
      typeof customerEmail === 'string' && customerEmail.trim()
        ? customerEmail.trim()
        : 'demo@naradji.local'

    // Address optional — proceed with whatever was provided (including undefined).
    const amount = toPaise(amountInRupees ?? 0)
    const flattenedCart = flattenCartItems(cart as { items: NonNullable<typeof cart.items> })
    const reference = `cod_${String(cart.id).slice(-8)}_${Date.now().toString(36)}`.slice(0, 40)

    try {
      await payload.create({
        collection: transactionsSlug as CollectionSlug,
        data: {
          ...(req.user
            ? {
                customer: req.user.id,
                ...(req.user.email ? { customerEmail: req.user.email } : {}),
              }
            : { customerEmail: email }),
          amount,
          billingAddress: billingAddressFromData,
          cart: cart.id,
          currency: storeCurrency,
          items: flattenedCart as Transaction['items'],
          paymentMethod: 'cod',
          shippingCharge,
          status: 'pending',
          cod: {
            reference,
          },
        },
        req,
      })

      return {
        amount,
        currency: storeCurrency,
        message: 'COD order ready to confirm',
        orderID: reference,
        reference,
      }
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Error initiating COD order',
      })
      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating COD order')
    }
  }
