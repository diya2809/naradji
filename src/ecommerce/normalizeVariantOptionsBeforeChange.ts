import { normalizeVariantOptionIds } from '@/utilities/normalizeVariantOptionIds'
import type { CollectionBeforeChangeHook } from 'payload'

export const normalizeVariantOptionsBeforeChange: CollectionBeforeChangeHook = ({ data }) => {
  if (!data || !('options' in data)) {
    return data
  }

  data.options = normalizeVariantOptionIds(data.options)
  return data
}
