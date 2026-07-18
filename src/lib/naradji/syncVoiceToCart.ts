import type { LeanProduct } from './catalog'
import { clampQty, type CartLine, type CartOp } from './cartIntent'
import type { UISpec } from './uispec'

type AddItemFn = (
  item: { product: string; variant?: string },
  quantity?: number,
) => Promise<void>

type RemoveItemFn = (lineId: string) => Promise<void>
type ClearCartFn = () => Promise<void>

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

function linesForProduct(cartLines: StoreCartLine[], productId: string): StoreCartLine[] {
  return cartLines.filter((line) => productIdOf(line.product) === productId && line.id)
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
 * Apply a voice cart op to the Payload ecommerce cart.
 *
 * - add: only add uttered lines (does not wipe manual cart lines)
 * - remove: remove matching product lines from the store cart
 * - replace: reconcile store cart to the desired Naradji cart
 * - clear: clearCart()
 */
export async function syncVoiceCartOp(opts: {
  op: CartOp
  /** Uttered targets for add/remove; full desired cart for replace. */
  items: UISpec['items']
  /** Full desired Naradji cart after applyCartOp (used for replace). */
  desiredCart: UISpec['items']
  catalog: LeanProduct[]
  cartLines: StoreCartLine[]
  addItem: AddItemFn
  removeItem: RemoveItemFn
  clearCart: ClearCartFn
}): Promise<{ synced: number; removed: number; skipped: string[] }> {
  const { op, items, desiredCart, catalog, cartLines, addItem, removeItem, clearCart } = opts
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const skipped: string[] = []
  let synced = 0
  let removed = 0

  if (op === 'clear') {
    if (cartLines.length) {
      await clearCart()
      removed = cartLines.length
    }
    return { synced, removed, skipped }
  }

  if (op === 'remove') {
    for (const item of items) {
      const product = byId.get(item.id)
      if (!product?.productId) {
        skipped.push(item.id)
        continue
      }
      const matches = linesForProduct(cartLines, String(product.productId))
      for (const line of matches) {
        if (!line.id) continue
        await removeItem(line.id)
        removed += 1
      }
    }
    return { synced, removed, skipped }
  }

  if (op === 'add') {
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
    return { synced, removed, skipped }
  }

  // replace — reconcile store cart to desiredCart
  const desiredByProductId = new Map<string, number>()
  for (const item of desiredCart) {
    const product = byId.get(item.id)
    if (!product?.productId) {
      skipped.push(item.id)
      continue
    }
    desiredByProductId.set(String(product.productId), clampQty(item.qty || 1))
  }

  for (const line of cartLines) {
    const pid = productIdOf(line.product)
    if (!pid || !line.id) continue
    if (!desiredByProductId.has(pid)) {
      await removeItem(line.id)
      removed += 1
    }
  }

  for (const [pid, wantQty] of desiredByProductId) {
    const matches = linesForProduct(cartLines, pid)
    const haveQty = matches.reduce((sum, l) => sum + (l.quantity || 1), 0)
    if (haveQty === 0) {
      await addItem({ product: pid }, wantQty)
      synced += 1
    } else if (wantQty > haveQty) {
      await addItem({ product: pid }, wantQty - haveQty)
      synced += 1
    } else if (wantQty < haveQty) {
      for (const line of matches) {
        if (!line.id) continue
        await removeItem(line.id)
        removed += 1
      }
      await addItem({ product: pid }, wantQty)
      synced += 1
    }
  }

  return { synced, removed, skipped }
}
