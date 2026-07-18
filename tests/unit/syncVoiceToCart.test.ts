import { describe, expect, it, vi } from 'vitest'
import { syncVoiceCartOp, syncVoiceItemsToStoreCart } from '../../src/lib/naradji/syncVoiceToCart'
import type { LeanProduct } from '../../src/lib/naradji/catalog'
import type { UISpec } from '../../src/lib/naradji/uispec'

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

describe('syncVoiceItemsToStoreCart', () => {
  it('adds Payload product ids and skips CSV-only rows', async () => {
    const uispec: UISpec = {
      language: 'hinglish',
      naradji_line: '',
      layout: 'express',
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'ghost', qty: 1, reason: null },
      ],
      prefill: null,
      cartOp: 'add',
    }
    const addItem = vi.fn(async () => undefined)
    const result = await syncVoiceItemsToStoreCart(uispec, catalog, addItem)
    expect(result.synced).toBe(1)
    expect(result.skipped).toEqual(['ghost'])
    expect(addItem).toHaveBeenCalledWith({ product: 'abc123' }, 2)
  })
})

describe('syncVoiceCartOp', () => {
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
