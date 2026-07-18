import type { CollectionAfterChangeHook } from 'payload'
import type { Order } from '@/payload-types'
import {
  buildAdminOrderNotificationHtml,
  buildCustomerOrderConfirmationHtml,
} from '@/ecommerce/orderEmailTemplates'
import { getRelId, resolveOrderCustomerContact } from '@/ecommerce/resolveOrderCustomer'
import { isCanonicalPaidOrder } from '@/ecommerce/isCanonicalPaidOrder'
import { resolveOrderLineItems } from '@/ecommerce/resolveOrderLineItems'
import { siteName } from '@/lib/site'
import { getServerSideURL } from '@/utilities/getURL'

const adminNotificationEmail = 'bordanensi24@gmail.com'

export const sendOrderConfirmationEmails: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc: _previousDoc,
}) => {
  if (req.context?.skipConfirmationEmails) {
    return
  }

  const payload = req.payload
  const isPaid = doc.status === 'processing' || doc.status === 'completed'
  const alreadySent = doc.emailSent

  if (isPaid && !alreadySent) {
    payload.logger.info(`[Email] Sending confirmation emails for order ${doc.id}`)

    try {
      // Always load the persisted order so emails include line items and totals,
      // including when this hook runs from a partial admin/API update.
      const order = (await payload.findByID({
        collection: 'orders',
        id: doc.id,
        depth: 0,
        overrideAccess: true,
        req,
      })) as Order

      const shouldSendEmails = await isCanonicalPaidOrder(payload, order, req)
      if (!shouldSendEmails) {
        payload.logger.warn(
          `[Email] Skipping duplicate order confirmation emails for order ${order.id}`,
        )

        await payload.update({
          collection: 'orders',
          id: order.id,
          data: {
            emailSent: true,
          },
          req,
          depth: 0,
          overrideAccess: true,
          context: {
            skipConfirmationEmails: true,
            skipDuplicateOrderCleanup: true,
          },
        })

        return
      }

      const addr = order.shippingAddress as
        | {
            name?: string | null
            phone?: string | null
            alternatePhone?: string | null
            addressLine1?: string | null
            addressLine2?: string | null
            city?: string | null
            state?: string | null
            postalCode?: string | null
            country?: string | null
          }
        | null
        | undefined

      // Prefer delivery-address contact (name/phone entered at checkout)
      const deliveryName =
        (typeof addr?.name === 'string' && addr.name.trim()) ||
        (typeof order.customerName === 'string' && order.customerName.trim()) ||
        'Customer'
      const primaryPhone =
        (typeof addr?.phone === 'string' && addr.phone.trim()) ||
        (typeof order.customerPhone === 'string' && order.customerPhone.trim()) ||
        ''
      const alternatePhone =
        typeof addr?.alternatePhone === 'string' && addr.alternatePhone.trim()
          ? addr.alternatePhone.trim()
          : ''
      const deliveryPhoneDisplay = primaryPhone
        ? alternatePhone
          ? `${primaryPhone} / ${alternatePhone}`
          : primaryPhone
        : 'N/A'
      let customerEmail =
        (
          await resolveOrderCustomerContact({
            customerEmail: order.customerEmail,
            payload,
            req,
            transactionCustomer: order.customer,
            userId:
              typeof order.customer === 'object' && order.customer !== null
                ? order.customer.id
                : order.customer,
            userEmail:
              typeof order.customer === 'object' && order.customer !== null
                ? order.customer.email
                : undefined,
          })
        ).customerEmail || ''

      if (!customerEmail && Array.isArray(order.transactions) && order.transactions.length > 0) {
        const transactionId = getRelId(order.transactions[0])
        if (transactionId) {
          try {
            const transaction = await payload.findByID({
              collection: 'transactions',
              id: transactionId,
              depth: 0,
              overrideAccess: true,
              req,
            })
            customerEmail =
              (
                await resolveOrderCustomerContact({
                  customerEmail: transaction.customerEmail,
                  payload,
                  req,
                  transactionCustomer: transaction.customer,
                  transactionCustomerEmail: transaction.customerEmail,
                })
              ).customerEmail || ''
          } catch {
            // Fall through; admin notification still sends below.
          }
        }
      }

      if (!customerEmail) {
        payload.logger.warn(
          `[Email] Order ${order.id} has no customer email — customer confirmation will be skipped`,
        )
      }

      const streetLine = addr
        ? `${addr.addressLine1 || ''}${addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}, ${addr.country || ''}`
            .replace(/\s+/g, ' ')
            .replace(/^,\s*|,\s*$/g, '')
            .trim()
        : ''

      // Always include name + phone in the address block so they are visible even if rows are skimmed
      const formattedAddress = addr
        ? [
            deliveryName,
            primaryPhone
              ? alternatePhone
                ? `Phone: ${primaryPhone} · Alt: ${alternatePhone}`
                : `Phone: ${primaryPhone}`
              : null,
            streetLine || null,
          ]
            .filter(Boolean)
            .join('<br/>')
        : 'No shipping address provided'

      // Shipping is stored in ₹ on the order (default 0 for older orders).
      const shippingCharge: number =
        typeof order.shippingCharge === 'number' ? order.shippingCharge : 0
      const productTotal = Math.max(0, (order.amount || 0) - shippingCharge)
      const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          })
        : 'N/A'
      const adminOrderUrl = `${getServerSideURL()}/admin/collections/orders/${order.id}`

      const resolvedItems = await resolveOrderLineItems(payload, order.items, {
        productNamesFallback: order.productNames,
        productTotalFallback: productTotal,
        req,
      })

      if (resolvedItems.length === 0) {
        payload.logger.warn(
          `[Email] Order ${order.id} has no line items to include in admin notification`,
        )
      }

      // 1. Customer confirmation — separate template; never includes admin URLs or internal fields.
      if (customerEmail && !req.context?.skipCustomerConfirmationEmail) {
        await payload.sendEmail({
          to: customerEmail,
          subject: `Your ${siteName} Order Confirmation - #${order.id}`,
          html: buildCustomerOrderConfirmationHtml({
            amount: order.amount || 0,
            orderId: order.id,
            productTotal,
            shippingCharge,
            siteName,
          }),
        })
      }

      // 2. Admin notification — separate recipient and template only.
      await payload.sendEmail({
        to: adminNotificationEmail,
        subject: `New Storefront Order Received - #${order.id}`,
        html: buildAdminOrderNotificationHtml({
          adminOrderUrl,
          amount: order.amount || 0,
          customerEmail,
          deliveryName,
          deliveryPhoneDisplay,
          formattedAddress,
          orderDate,
          orderId: order.id,
          productTotal,
          resolvedItems,
          shippingCharge,
          siteName,
        }),
      })

      // Update flag so we don't send emails again for this order
      await payload.update({
        collection: 'orders',
        id: doc.id,
        data: {
          emailSent: true,
        },
        req,
        depth: 0,
        overrideAccess: true,
        context: {
          skipConfirmationEmails: true,
        },
      })

      payload.logger.info(`[Email] Successfully sent confirmation emails for order ${doc.id}`)
    } catch (err) {
      payload.logger.error({ err, msg: `Failed to send order confirmation emails for order ${doc.id}` })
    }
  }
}
