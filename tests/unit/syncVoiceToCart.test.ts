import { describe, expect, it, vi } from 'vitest'
import { syncVoiceItemsToStoreCart } from '../../src/lib/naradji/syncVoiceToCart'
import type { LeanProduct } from '../../src/lib/naradji/catalog'
import type { UISpec } from '../../src/lib/naradji/uispec'

describe('syncVoiceItemsToStoreCart', () => {
  it('adds Payload product ids and skips CSV-only rows', async () => {
    const catalog: LeanProduct[] = [
      {
        id: 'atta',
        productId: 'abc123',
        title: 'Atta',
        price: 60,
        unit: 'pack',
        category: 'flour',
        slug: 'atta',
        aliases: ['atta'],
      },
      {
        id: 'ghost',
        productId: null,
        title: 'Ghost',
        price: 1,
        unit: 'pack',
        category: 'x',
        slug: 'ghost',
        aliases: ['ghost'],
      },
    ]
    const uispec: UISpec = {
      language: 'hinglish',
      naradji_line: '',
      layout: 'express',
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'ghost', qty: 1, reason: null },
      ],
      prefill: null,
      patch: false,
    }
    const addItem = vi.fn(async () => undefined)
    const result = await syncVoiceItemsToStoreCart(uispec, catalog, addItem)
    expect(result.synced).toBe(1)
    expect(result.skipped).toEqual(['ghost'])
    expect(addItem).toHaveBeenCalledWith({ product: 'abc123' }, 2)
  })
})
