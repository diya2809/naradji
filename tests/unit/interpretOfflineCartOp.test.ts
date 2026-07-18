import { describe, expect, it } from 'vitest'
import { interpretOffline } from '../../src/lib/naradji/llm'
import type { LeanProduct } from '../../src/lib/naradji/catalog'
import { emptyUISpec } from '../../src/lib/naradji/uispec'

const catalog: LeanProduct[] = [
  {
    id: 'aashirvaad-atta-1kg',
    productId: 'p1',
    title: 'Aashirvaad Atta 1kg',
    price: 65,
    unit: 'pack',
    category: 'flour',
    slug: 'aashirvaad-atta-1kg',
    aliases: ['atta', 'aashirvaad'],
  },
  {
    id: 'amul-taaza-toned-milk-500ml',
    productId: 'p2',
    title: 'Amul Taaza Toned Milk 500ml',
    price: 28,
    unit: 'pack',
    category: 'dairy',
    slug: 'amul-taaza-toned-milk-500ml',
    aliases: ['milk', 'doodh', 'amul milk'],
  },
  {
    id: 'tata-tea-gold-250g',
    productId: 'p3',
    title: 'Tata Tea Gold 250g',
    price: 145,
    unit: 'pack',
    category: 'tea',
    slug: 'tata-tea-gold-250g',
    aliases: ['chai', 'tea', 'tata tea'],
  },
]

describe('interpretOffline add-only demo', () => {
  it('gujlish milk add → cartOp add with milk id', () => {
    const spec = interpretOffline('milk add karjo ne', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('add')
    expect(spec.items.map((i) => i.id)).toEqual(['amul-taaza-toned-milk-500ml'])
  })

  it('grocery list adds multiple items', () => {
    const spec = interpretOffline('do kilo atta, do doodh', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('add')
    expect(spec.items.length).toBe(2)
  })

  it('remove phrasing still adds when product is named (demo: add-only)', () => {
    const spec = interpretOffline('doodh hata do', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('add')
    expect(spec.items.map((i) => i.id)).toEqual(['amul-taaza-toned-milk-500ml'])
  })

  it('clear with no product → empty items, still cartOp add', () => {
    const spec = interpretOffline('clear cart', catalog, emptyUISpec())
    expect(spec.cartOp).toBe('add')
    expect(spec.items).toEqual([])
  })

  it('bare nahi → empty, no invented SKU', () => {
    const spec = interpretOffline('nahi', catalog, emptyUISpec())
    expect(spec.items).toEqual([])
    expect(spec.cartOp).toBe('add')
  })
})
