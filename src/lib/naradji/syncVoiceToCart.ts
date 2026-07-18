import type { LeanProduct } from './catalog'
import { clampQty, type CartLine } from './cartIntent'
import type { UISpec } from './uispec'

type AddItemFn = (
  item: { product: string; variant?: string },
  quantity?: number,
) => Promise<void>

/** Minimal shape from Payload useCart().cart.items */
export type StoreCartLine = {
  id?: string | null
  quantity?: number | null
  product?: string | { id?: string | null } | null
}

function productIdOf(product: StoreCartLine['product']): string | null {
  if (!product) return null
  if (typeof product === 'string') return product
  if (typeof product === 'object' && product.id != null) return String(product.id)
  return null
}

/**
 * Derive Naradji cart lines from the Payload store cart.
 * Payload is the only authority — session cart is a mirror of this.
 */
export function voiceCartFromStoreLines(
  cartLines: StoreCartLine[],
  catalog: LeanProduct[],
): CartLine[] {
  const byProductId = new Map(
    catalog.filter((p) => p.productId).map((p) => [String(p.productId), p]),
  )
  const merged = new Map<string, CartLine>()
  for (const line of cartLines) {
    const pid = productIdOf(line.product)
    if (!pid) continue
    const product = byProductId.get(pid)
    if (!product) continue
    const qty = clampQty(line.quantity || 1)
    const existing = merged.get(product.id)
    if (existing) {
      merged.set(product.id, { ...existing, qty: clampQty((existing.qty || 1) + qty) })
    } else {
      merged.set(product.id, { id: product.id, qty, reason: null })
    }
  }
  return [...merged.values()]
}

/**
 * Add voice-matched items into the Payload cart.
 * Demo path is add-only — no remove/replace/clear here.
 */
export async function addVoiceItemsToCart(opts: {
  items: UISpec['items']
  catalog: LeanProduct[]
  addItem: AddItemFn
}): Promise<{ synced: number; skipped: string[] }> {
  const { items, catalog, addItem } = opts
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const skipped: string[] = []
  let synced = 0

  for (const item of items) {
    const product = byId.get(item.id)
    if (!product?.productId) {
      skipped.push(item.id)
      continue
    }
    const qty = clampQty(item.qty || 1)
    await addItem({ product: product.productId }, qty)
    synced += 1
  }

  return { synced, skipped }
}
