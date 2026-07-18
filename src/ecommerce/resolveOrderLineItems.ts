import type { Payload, PayloadRequest } from 'payload'

export type ResolvedOrderLineItem = {
  productTitle: string
  variantTitle: string
  quantity: number
  price: number
  total: number
}

type OrderItemLike = {
  product?: unknown
  variant?: unknown
  quantity?: number | null
}

const getRelId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  return null
}

export async function resolveOrderLineItems(
  payload: Payload,
  items: OrderItemLike[] | null | undefined,
  options?: {
    productNamesFallback?: string | null
    productTotalFallback?: number
    req?: PayloadRequest
  },
): Promise<ResolvedOrderLineItem[]> {
  const list = Array.isArray(items) ? items : []

  const resolved = await Promise.all(
    list.map(async (item) => {
      const productId = getRelId(item.product)
      const variantId = getRelId(item.variant)

      let productTitle = 'Unknown Product'
      let variantTitle = 'Default'
      let price = 0

      if (productId) {
        try {
          const prod = await payload.findByID({
            collection: 'products',
            id: productId,
            depth: 0,
            overrideAccess: true,
            ...(options?.req ? { req: options.req } : {}),
          })
          if (prod && typeof prod.title === 'string' && prod.title.trim()) {
            productTitle = prod.title
          }
        } catch {
          // Fall through to unknown product label.
        }
      }

      if (variantId) {
        try {
          const variant = await payload.findByID({
            collection: 'variants',
            id: variantId,
            depth: 0,
            overrideAccess: true,
            ...(options?.req ? { req: options.req } : {}),
          })
          if (variant) {
            price = variant.priceInINR || 0
            if (variant.options && Array.isArray(variant.options)) {
              const optionLabels = await Promise.all(
                variant.options.map(async (opt: unknown) => {
                  const optionId = getRelId(opt)
                  if (!optionId) return ''
                  try {
                    const optDoc = await payload.findByID({
                      collection: 'variantOptions',
                      id: optionId,
                      depth: 0,
                      overrideAccess: true,
                      ...(options?.req ? { req: options.req } : {}),
                    })
                    return optDoc?.label || ''
                  } catch {
                    return ''
                  }
                }),
              )
              const filtered = optionLabels.filter(Boolean)
              if (filtered.length > 0) variantTitle = filtered.join(', ')
            }
          }
        } catch {
          // Keep default variant label and price.
        }
      }

      const quantity = item.quantity || 1

      return {
        productTitle,
        variantTitle,
        quantity,
        price,
        total: price * quantity,
      }
    }),
  )

  if (resolved.length > 0) {
    return resolved
  }

  const fallbackName =
    typeof options?.productNamesFallback === 'string' ? options.productNamesFallback.trim() : ''
  if (fallbackName) {
    const fallbackTotal = Math.max(0, options?.productTotalFallback ?? 0)
    return [
      {
        productTitle: fallbackName,
        variantTitle: '—',
        quantity: 1,
        price: fallbackTotal,
        total: fallbackTotal,
      },
    ]
  }

  return []
}