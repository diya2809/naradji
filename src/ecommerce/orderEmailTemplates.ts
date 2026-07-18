import type { ResolvedOrderLineItem } from '@/ecommerce/resolveOrderLineItems'

export type CustomerOrderEmailContent = {
  amount: number
  orderId: string
  productTotal: number
  shippingCharge: number
  siteName: string
}

/** Customer-facing confirmation only — no admin URLs, contacts, or internal fields. */
export function buildCustomerOrderConfirmationHtml({
  amount,
  orderId,
  productTotal,
  shippingCharge,
  siteName,
}: CustomerOrderEmailContent): string {
  return `
          <div style="background-color: #FAF6F6; padding: 40px 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #E5D5D5; padding: 40px; box-shadow: 0 4px 16px rgba(154, 43, 67, 0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 22px; font-weight: 700; color: #111111; letter-spacing: -0.02em;">${siteName}</div>
              </div>
              <h2 style="font-size: 20px; font-weight: 600; color: #111111; margin-top: 0; margin-bottom: 16px; text-align: center;">Thank You for Your Order!</h2>
              <p style="font-size: 15px; color: #444444; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                Your payment has been successfully received and your order is confirmed. We are currently preparing your items for delivery.
              </p>
              
              <table style="border-collapse: collapse; font-size: 14px; margin: 24px auto; text-align: left; width: auto;">
                <tr>
                  <td style="padding: 6px 16px 6px 0; color: #666666; font-weight: 500; white-space: nowrap; vertical-align: top;">Order ID:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: 600; word-break: break-all; max-width: 280px;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 6px 0; color: #666666; font-weight: 500; white-space: nowrap; vertical-align: top;">Products:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: 600;">₹${productTotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 6px 0; color: #666666; font-weight: 500; white-space: nowrap; vertical-align: top;">Shipping:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: 600;">${shippingCharge > 0 ? `₹${shippingCharge.toLocaleString('en-IN')}` : 'Free'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 6px 0; color: #666666; font-weight: 500; white-space: nowrap; vertical-align: top;">Total Amount:</td>
                  <td style="padding: 6px 0; color: #9A2B43; font-weight: 700; font-size: 16px;">₹${amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 6px 0; color: #666666; font-weight: 500; white-space: nowrap; vertical-align: top;">Payment Status:</td>
                  <td style="padding: 6px 0; color: #1A8035; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Paid</td>
                </tr>
              </table>
              
              <p style="font-size: 13px; color: #888888; line-height: 1.5; text-align: center; margin-top: 40px; border-top: 1px solid #FAF6F6; padding-top: 20px;">
                Designed in India. © 2026 ${siteName}. All rights reserved.
              </p>
            </div>
          </div>
        `.trim()
}

export type AdminOrderEmailContent = {
  adminOrderUrl: string
  amount: number
  customerEmail: string
  deliveryName: string
  deliveryPhoneDisplay: string
  formattedAddress: string
  orderDate: string
  orderId: string
  productTotal: number
  resolvedItems: ResolvedOrderLineItem[]
  shippingCharge: number
  siteName: string
}

/** Internal admin notification — never sent to customers. */
export function buildAdminOrderNotificationHtml({
  adminOrderUrl,
  amount,
  customerEmail,
  deliveryName,
  deliveryPhoneDisplay,
  formattedAddress,
  orderDate,
  orderId,
  productTotal,
  resolvedItems,
  shippingCharge,
  siteName,
}: AdminOrderEmailContent): string {
  const itemsRowsHtml =
    resolvedItems.length > 0
      ? resolvedItems
          .map(
            (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #FAF6F6; color: #111111;">
            <div style="font-weight: 600;">${item.productTitle}</div>
            <div style="font-size: 12px; color: #666666;">Variant: ${item.variantTitle}</div>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #FAF6F6; text-align: center; color: #444444;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #FAF6F6; text-align: right; color: #444444;">₹${item.price.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #FAF6F6; text-align: right; font-weight: 600; color: #111111;">₹${item.total.toLocaleString('en-IN')}</td>
        </tr>
      `,
          )
          .join('')
      : `
        <tr>
          <td colspan="4" style="padding: 12px 0; color: #666666; text-align: center; font-style: italic;">
            No line items were stored on this order. Open the admin panel to review the full record.
          </td>
        </tr>
      `

  return `
        <div style="background-color: #FAF6F6; padding: 40px 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #E5D5D5; padding: 40px; box-shadow: 0 4px 16px rgba(154, 43, 67, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 22px; font-weight: 700; color: #111111; letter-spacing: -0.02em;">${siteName}</div>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; color: #111111; margin-top: 0; margin-bottom: 16px; text-align: center;">New Order Received!</h2>
            <p style="font-size: 15px; color: #444444; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              A new storefront order has been successfully created and paid. Please review the details below.
            </p>
            
            <div style="background-color: #FAF6F6; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #E5D5D5;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500;">Order ID:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111111; font-weight: 600;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500;">Order Date:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111111; font-weight: 600;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500;">Payment Status:</td>
                  <td style="padding: 6px 0; text-align: right; color: #1A8035; font-weight: 600; text-transform: uppercase;">Paid</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500;">Products:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111111; font-weight: 600;">₹${productTotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500;">Shipping:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111111; font-weight: 600;">${shippingCharge > 0 ? `₹${shippingCharge.toLocaleString('en-IN')}` : 'Free'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: 500; font-size: 15px;">Total Amount:</td>
                  <td style="padding: 6px 0; text-align: right; color: #9A2B43; font-weight: 700; font-size: 18px;">₹${amount.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <h3 style="font-size: 15px; font-weight: 600; color: #9A2B43; border-bottom: 2px solid #FAF6F6; padding-bottom: 8px; margin-top: 0;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <thead>
                <tr style="text-align: left; color: #666666;">
                  <th style="padding-bottom: 8px; border-bottom: 1px solid #E5D5D5; font-weight: 500;">Item</th>
                  <th style="padding-bottom: 8px; border-bottom: 1px solid #E5D5D5; text-align: center; font-weight: 500;">Qty</th>
                  <th style="padding-bottom: 8px; border-bottom: 1px solid #E5D5D5; text-align: right; font-weight: 500;">Price</th>
                  <th style="padding-bottom: 8px; border-bottom: 1px solid #E5D5D5; text-align: right; font-weight: 500;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <h3 style="font-size: 15px; font-weight: 600; color: #9A2B43; border-bottom: 2px solid #FAF6F6; padding-bottom: 8px;">Customer & Delivery Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="padding: 6px 0; color: #666666; font-weight: 500; width: 130px; vertical-align: top;">Name:</td>
                <td style="padding: 6px 0; color: #111111; font-weight: 600;">${deliveryName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666666; font-weight: 500; width: 130px; vertical-align: top;">Mobile:</td>
                <td style="padding: 6px 0; color: #111111; font-weight: 600;">${deliveryPhoneDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666666; font-weight: 500; width: 130px; vertical-align: top;">Email:</td>
                <td style="padding: 6px 0; color: #111111;">${customerEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666666; font-weight: 500; width: 130px; vertical-align: top;">Delivery Address:</td>
                <td style="padding: 6px 0; color: #111111; font-weight: 500;">${formattedAddress}</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #FAF6F6; padding-top: 20px;">
              <a href="${adminOrderUrl}" style="background-color: #9A2B43; color: #ffffff; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                View Order in Admin
              </a>
            </div>
          </div>
        </div>
      `.trim()
}