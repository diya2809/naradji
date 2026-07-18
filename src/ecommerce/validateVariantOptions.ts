import { normalizeVariantOptionIds } from '@/utilities/normalizeVariantOptionIds'
import type { Variant } from '@/payload-types'
import type { CollectionSlug, Validate } from 'payload'

type ValidateVariantOptionsArgs = {
  productsCollectionSlug?: string
}

// findByID + select narrows joins/relationships to `{}`; describe what we read.
type ProductForValidation = {
  variants?: { docs?: Array<Variant | string | null> } | null
  variantTypes?: unknown
}

const getVariantTypeCount = (variantTypes: unknown): number => {
  if (!Array.isArray(variantTypes)) return 0
  return variantTypes.length
}

export const validateVariantOptions =
  ({ productsCollectionSlug = 'products' }: ValidateVariantOptionsArgs = {}): Validate =>
  async (values, { data, req }) => {
    // Plugin-ecommerce registers these translation keys at runtime; they aren't
    // part of req.t's typed key union, so call through a string-keyed alias.
    const t = req.t as unknown as (key: string) => string

    const optionIds = normalizeVariantOptionIds(values)

    if (optionIds.length === 0) {
      return t('plugin-ecommerce:variantOptionsRequired')
    }

    const productID = data?.product
    if (!productID) {
      return t('plugin-ecommerce:productRequired')
    }

    const findByIDArgs = {
      id: productID,
      collection: productsCollectionSlug as CollectionSlug,
      depth: 1,
      joins: {
        variants: {
          where: {
            deletedAt: {
              exists: false,
            },
            ...(data?.id
              ? {
                  id: {
                    not_equals: data.id,
                  },
                }
              : {}),
          },
        },
      },
      select: {
        variants: true,
        variantTypes: true,
      },
      user: req.user,
    } as unknown as Parameters<typeof req.payload.findByID>[0]

    const product = (await req.payload.findByID(findByIDArgs)) as unknown as ProductForValidation

    const variantTypeCount = getVariantTypeCount(product.variantTypes)
    if (variantTypeCount > 0 && optionIds.length < variantTypeCount) {
      return t('plugin-ecommerce:variantOptionsRequiredAll')
    }

    const variants = (product.variants?.docs ?? []).filter(
      (variant): variant is Variant => typeof variant === 'object' && variant !== null,
    )

    if (variants.length > 0) {
      const existingCombos = variants
        .map((variant) => normalizeVariantOptionIds(variant.options))
        .filter((combo) => combo.length > 0)

      const duplicate = existingCombos.some(
        (combo) =>
          combo.length === optionIds.length &&
          combo.every((id) => optionIds.includes(id)),
      )

      if (duplicate) {
        return t('plugin-ecommerce:variantOptionsAlreadyExists')
      }
    }

    return true
  }
