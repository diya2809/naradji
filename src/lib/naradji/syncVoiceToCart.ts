import type { LeanProduct } from './catalog'
import type { UISpec } from './uispec'

type AddItemFn = (
  item: { product: string; variant?: string },
  quantity?: number,
) => Promise<void>

/**
 * Push matched voice lines into the Payload ecommerce cart.
 * Uses productId (Payload doc id). Skips SKUs that only exist in CSV fallback.
 */
export async function syncVoiceItemsToStoreCart(
  uispec: UISpec,
  catalog: LeanProduct[],
  addItem: AddItemFn,
): Promise<{ synced: number; skipped: string[] }> {
  const byId = new Map(catalog.map((p) => [p.id, p]))
  let synced = 0
  const skipped: string[] = []

  for (const item of uispec.items) {
    const product = byId.get(item.id)
    if (!product?.productId) {
      skipped.push(item.id)
      continue
    }
    const qty = Math.max(1, Math.min(99, Math.round(item.qty || 1)))
    await addItem({ product: product.productId }, qty)
    synced += 1
  }

  return { synced, skipped }
}
