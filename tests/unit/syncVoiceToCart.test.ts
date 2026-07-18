import { describe, expect, it, vi } from 'vitest'
import { syncVoiceCartOp, voiceCartFromStoreLines } from '../../src/lib/naradji/syncVoiceToCart'
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

describe('syncVoiceCartOp', () => {
  it('add skips CSV-only rows without productId', async () => {
    const addItem = vi.fn(async () => undefined)
    const result = await syncVoiceCartOp({
      op: 'add',
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'ghost', qty: 1, reason: null },
      ],
      desiredCart: [],
      catalog,
      cartLines: [],
      addItem,
      removeItem: vi.fn(async () => undefined),
      clearCart: vi.fn(async () => undefined),
    })
    expect(result.synced).toBe(1)
    expect(result.skipped).toEqual(['ghost'])
    expect(addItem).toHaveBeenCalledWith({ product: 'abc123' }, 2)
  })

  it('remove deletes matching store cart lines by product id', async () => {
    const removeItem = vi.fn(async () => undefined)
    const addItem = vi.fn(async () => undefined)
    const clearCart = vi.fn(async () => undefined)

    const result = await syncVoiceCartOp({
      op: 'remove',
      items: [{ id: 'milk', qty: 1, reason: null }],
      desiredCart: [{ id: 'atta', qty: 1, reason: null }],
      catalog,
      cartLines: [
        { id: 'line-atta', quantity: 1, product: { id: 'abc123' } },
        { id: 'line-milk', quantity: 2, product: { id: 'milk99' } },
      ],
      addItem,
      removeItem,
      clearCart,
    })

    expect(result.removed).toBe(1)
    expect(removeItem).toHaveBeenCalledWith('line-milk')
    expect(removeItem).not.toHaveBeenCalledWith('line-atta')
    expect(addItem).not.toHaveBeenCalled()
    expect(clearCart).not.toHaveBeenCalled()
  })

  it('clear calls clearCart', async () => {
    const clearCart = vi.fn(async () => undefined)
    const result = await syncVoiceCartOp({
      op: 'clear',
      items: [],
      desiredCart: [],
      catalog,
      cartLines: [{ id: 'line-1', quantity: 1, product: { id: 'abc123' } }],
      addItem: vi.fn(async () => undefined),
      removeItem: vi.fn(async () => undefined),
      clearCart,
    })
    expect(clearCart).toHaveBeenCalledOnce()
    expect(result.removed).toBe(1)
  })
})
