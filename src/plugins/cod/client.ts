import type { PaymentAdapterClient } from '@payloadcms/plugin-ecommerce/types'

export const codAdapterClient = (): PaymentAdapterClient => ({
  name: 'cod',
  confirmOrder: true,
  initiatePayment: true,
  label: 'Cash on Delivery',
})
