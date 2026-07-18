import type { VariantOption } from '@/payload-types'

type MaybeOption = VariantOption | string | null | undefined

/** Drops join holes from trashed or deleted variant options. */
export function filterVariantOptionDocs(options: MaybeOption[] | null | undefined): VariantOption[] {
  if (!options?.length) return []

  return options.filter((option): option is VariantOption => {
    if (!option || typeof option !== 'object') return false
    return typeof option.id === 'string' && typeof option.label === 'string'
  })
}
