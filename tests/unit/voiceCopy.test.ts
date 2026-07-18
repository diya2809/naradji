import { describe, expect, it } from 'vitest'
import {
  buildReadbackLine,
  cartTotal,
  GREETING_LINE,
  resolveCartLines,
} from '../../src/lib/naradji/voiceCopy'
import type { LeanProduct } from '../../src/lib/naradji/catalog'
import type { UISpec } from '../../src/lib/naradji/uispec'

const catalog: LeanProduct[] = [
  {
    id: 'atta',
    productId: 'p1',
    title: 'Aashirvaad Atta 1kg',
    price: 60,
    unit: 'pack',
    category: 'flour',
    slug: 'atta',
    aliases: ['atta'],
  },
  {
    id: 'milk',
    productId: 'p2',
    title: 'Amul Taaza Toned Milk 500ml',
    price: 28,
    unit: 'pack',
    category: 'dairy',
    slug: 'milk',
    aliases: ['doodh'],
  },
]

describe('voiceCopy', () => {
  it('greeting is short and invites the order', () => {
    expect(GREETING_LINE).toMatch(/Narayan Narayan/)
    expect(GREETING_LINE.length).toBeLessThan(80)
  })

  it('readback lists items and total with confirm prompt', () => {
    const uispec: UISpec = {
      language: 'hinglish',
      naradji_line: '',
      layout: 'express',
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'milk', qty: 2, reason: null },
      ],
      prefill: null,
      cartOp: 'add',
    }
    const lines = resolveCartLines(uispec, catalog)
    expect(cartTotal(lines)).toBe(2 * 60 + 2 * 28)
    const line = buildReadbackLine(lines)
    expect(line).toMatch(/Cart mein/)
    expect(line).toMatch(/Total ₹176/)
    expect(line).toMatch(/Haan pakka/)
  })

  it('empty match fails visibly', () => {
    expect(buildReadbackLine([])).toMatch(/match nahi/i)
  })
})
