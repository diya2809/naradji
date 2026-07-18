import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'
import { filterVariantOptionDocs } from '@/utilities/filterVariantOptionDocs'

export function getSellableVariants(product: Product): Variant[] {
  return (
    product.variants?.docs?.filter(
      (variant): variant is Variant => typeof variant === 'object' && variant !== null,
    ) ?? []
  )
}

export function getVariantTypesWithOptions(product: Product): VariantType[] {
  const mapped =
    product.variantTypes
      ?.map((type) => {
        if (!type || typeof type !== 'object') return null

        const docs = filterVariantOptionDocs(type.options?.docs)
        if (!docs.length) return null

        return {
          ...type,
          options: {
            ...type.options,
            docs,
          },
        }
      })
      .filter((type) => type !== null) ?? []

  return mapped as VariantType[]
}

export function productHasVariants(product: Product): boolean {
  return Boolean(
    product.enableVariants &&
      getSellableVariants(product).length > 0 &&
      getVariantTypesWithOptions(product).length > 0,
  )
}

export function productShowsVariantSelector(product: Product): boolean {
  return productHasVariants(product)
}

export function productHasSellableVariants(product: Product): boolean {
  return product.enableVariants === true && getSellableVariants(product).length > 0
}

export function getVariantOptions(product: Product): VariantOption[] {
  return getVariantTypesWithOptions(product).flatMap(
    (type) =>
      type.options?.docs?.filter(
        (option): option is VariantOption => typeof option === 'object' && option !== null,
      ) ?? [],
  )
}
