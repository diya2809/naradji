import { describe, expect, it } from 'vitest'
import { interpretOffline } from '../../src/lib/naradji/llm'
import type { LeanProduct } from '../../src/lib/naradji/catalog'
import { emptyUISpec } from '../../src/lib/naradji/uispec'

const catalog: LeanProduct[] = [
  {
    id: 'milk',
    productId: 'p-milk',
    title: 'Amul Milk',
    price: 28,
    unit: 'pack',
    category: 'dairy',
    slug: 'milk',
    aliases: ['doodh', 'milk'],
  },
  {
    id: 'atta',
    productId: 'p-atta',
    title: 'Atta',
    price: 60,
    unit: 'kg',
    category: 'flour',
    slug: 'atta',
    aliases: ['atta'],
  },
]

describe('interpretOffline cartOp', () => {
  it('remove utterance yields cartOp remove with product ids (not add)', () => {
    const state = {
      ...emptyUISpec(),
      items: [
        { id: 'milk', qty: 2, reason: null },
        { id: 'atta', qty: 1, reason: null },
      ],
    }
    const spec = interpretOffline('doodh hata do', catalog, state)
    expect(spec.cartOp).toBe('remove')
    expect(spec.items.map((i) => i.id)).toEqual(['milk'])
  })

  it('nahi chahiye is remove, not replace-with-item', () => {
    const spec = interpretOffline('oreo nahi chahiye', catalog, emptyUISpec())
    // oreo not in this catalog — still remove op, empty targets
    expect(spec.cartOp).toBe('remove')
  })

  it('grocery list stays add', () => {
    const spec = interpretOffline('do kilo atta, do doodh', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('add')
    expect(spec.items.map((i) => i.id).sort()).toEqual(['atta', 'milk'])
  })

  it('clear cart empties items', () => {
    const spec = interpretOffline('clear cart', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('clear')
    expect(spec.items).toEqual([])
  })

  it('sirf product replaces rather than appends', () => {
    const state = {
      ...emptyUISpec(),
      items: [
        { id: 'milk', qty: 2, reason: null },
        { id: 'atta', qty: 1, reason: null },
      ],
    }
    const spec = interpretOffline('sirf doodh chahiye', catalog, state)
    expect(spec.cartOp).toBe('replace')
    expect(spec.items.map((i) => i.id)).toEqual(['milk'])
  })

  it('bare nahi clarifies without inventing items', () => {
    const spec = interpretOffline('nahi', catalog, emptyUISpec())
    expect(spec.items).toEqual([])
    expect(spec.cartOp).toBe('add')
  })
})
