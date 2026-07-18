import { describe, expect, it } from 'vitest'
import { matchAliases, normalizeSpeech, wantsCOD } from '../../src/lib/naradji/aliases'
import { FALLBACK_CATALOG } from '../../src/lib/naradji/catalog'
import { DEMO_BREATH_TRANSCRIPT } from '../../src/lib/naradji/demoBreath'
import type { LeanProduct } from '../../src/lib/naradji/catalog'

describe('alias matching', () => {
  it('loads the IndiaMART seller CSV as the sole fallback catalog', () => {
    expect(FALLBACK_CATALOG.length).toBe(151)
    expect(FALLBACK_CATALOG.every((p) => p.slug && p.aliases.length)).toBe(true)
  })

  it('maps grocery breath to catalog ids with qty', () => {
    const hits = matchAliases(DEMO_BREATH_TRANSCRIPT, FALLBACK_CATALOG)
    const ids = hits.map((h) => h.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'aashirvaad-atta-1kg',
        'amul-taaza-toned-milk-500ml',
        'tata-tea-gold-250g',
        'oreo-original-cookies-120g',
      ]),
    )
    expect(hits.find((h) => h.id === 'aashirvaad-atta-1kg')?.qty).toBe(2)
    expect(hits.find((h) => h.id === 'tata-tea-gold-250g')?.qty).toBe(5)
    expect(wantsCOD(DEMO_BREATH_TRANSCRIPT)).toBe(true)
  })

  it('normalizes hyphen/space so Parle-G matches parle g aliases', () => {
    expect(normalizeSpeech('Parle-G')).toBe('parle g')
    const catalog: LeanProduct[] = [
      {
        id: 'parle-g-gold',
        productId: null,
        title: 'Parle-G Gold Biscuits',
        price: 35,
        unit: 'pack',
        category: 'snacks',
        slug: 'parle-g-gold',
        aliases: ['parle g', 'biscuit'],
      },
      {
        id: 'parle-monaco',
        productId: null,
        title: 'Parle Monaco',
        price: 20,
        unit: 'pack',
        category: 'snacks',
        slug: 'parle-monaco',
        aliases: ['monaco'],
      },
    ]
    const hits = matchAliases('do Parle-G', catalog)
    expect(hits.map((h) => h.id)).toEqual(['parle-g-gold'])
  })

  it('prefers dedicated short alias over brand-colliding titles', () => {
    const catalog: LeanProduct[] = [
      {
        id: 'maggi-ketchup',
        productId: null,
        title: 'Maggi Tomato Ketchup 1kg',
        price: 140,
        unit: 'bottle',
        category: 'sauces',
        slug: 'maggi-ketchup',
        aliases: ['maggi ketchup 1kg', 'maggi ketchup'],
      },
      {
        id: 'maggi-noodles',
        productId: null,
        title: 'Maggi 2-Minute Noodles Masala 70g',
        price: 14,
        unit: 'pack',
        category: 'snacks',
        slug: 'maggi-noodles',
        aliases: ['maggi', 'noodles', 'maggi noodles'],
      },
    ]
    const hits = matchAliases('paanch maggi', catalog)
    expect(hits).toHaveLength(1)
    expect(hits[0].id).toBe('maggi-noodles')
    expect(hits[0].qty).toBe(5)
  })

  it.each([
    '2 milk, 3 atta, 4 chai, 5 oreo, 6 butter',
    'milk 2, atta 3, chai 4, oreo 5, butter 6',
    '2 packets milk, 3 packets atta, 4 packets chai, 5 packets oreo, 6 packets butter',
    'be doodh, tran atta, chaar chai, paanch oreo, chha butter',
    '૨ doodh, ૩ atta, ૪ chai, ૫ oreo, ૬ butter',
  ])('preserves five different item quantities: %s', (transcript) => {
    const hits = matchAliases(transcript, FALLBACK_CATALOG)
    expect(hits.map(({ id, qty }) => ({ id, qty }))).toEqual([
      { id: 'amul-taaza-toned-milk-500ml', qty: 2 },
      { id: 'aashirvaad-atta-1kg', qty: 3 },
      { id: 'tata-tea-gold-250g', qty: 4 },
      { id: 'oreo-original-cookies-120g', qty: 5 },
      { id: 'amul-butter-100g', qty: 6 },
    ])
  })
})
