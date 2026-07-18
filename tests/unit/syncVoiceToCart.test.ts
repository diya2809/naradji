import { describe, expect, it, vi } from 'vitest'
import { addVoiceItemsToCart, voiceCartFromStoreLines } from '../../src/lib/naradji/syncVoiceToCart'
import type { LeanProduct } from '../../src/lib/naradji/catalog'

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
    id: 'milk',
    productId: 'milk99',
    title: 'Milk',
    price: 28,
    unit: 'pack',
    category: 'dairy',
    slug: 'milk',
    aliases: ['doodh', 'milk'],
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

describe('voiceCartFromStoreLines', () => {
  it('maps Payload lines to catalog slugs and skips unmapped products', () => {
    expect(
      voiceCartFromStoreLines(
        [
          { id: 'line-atta', quantity: 2, product: { id: 'abc123' } },
          { id: 'line-milk', quantity: 1, product: 'milk99' },
          { id: 'line-x', quantity: 1, product: { id: 'unknown' } },
        ],
        catalog,
      ),
    ).toEqual([
      { id: 'atta', qty: 2, reason: null },
      { id: 'milk', qty: 1, reason: null },
    ])
  })
})

describe('addVoiceItemsToCart', () => {
  it('adds matched products and skips CSV-only rows without productId', async () => {
    const addItem = vi.fn(async () => undefined)
    const result = await addVoiceItemsToCart({
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'ghost', qty: 1, reason: null },
      ],
      catalog,
      addItem,
    })
    expect(result.synced).toBe(1)
    expect(result.skipped).toEqual(['ghost'])
    expect(addItem).toHaveBeenCalledWith({ product: 'abc123' }, 2)
  })
})
