import type { PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'

export type CodAdapterArgs = PaymentAdapterArgs & {
  label?: string
}
