import type { GroupField } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import { confirmOrder } from './confirmOrder'
import { initiatePayment } from './initiatePayment'
import type { CodAdapterArgs } from './types'

export const codAdapter = (props: CodAdapterArgs = {}): PaymentAdapter => {
  const { groupOverrides } = props
  const label = props.label || 'Cash on Delivery'

  const baseFields = [
    {
      name: 'reference',
      type: 'text' as const,
      label: 'COD Reference',
    },
  ]

  const groupField: GroupField = {
    name: 'cod',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'cod',
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'cod',
    confirmOrder: confirmOrder(props),
    group: groupField,
    initiatePayment: initiatePayment(props),
    label,
  }
}

export { codAdapterClient } from './client'
