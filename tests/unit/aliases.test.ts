import { describe, expect, it } from 'vitest'
import { matchAliases, wantsCOD } from '../../src/lib/naradji/aliases'
import { FALLBACK_CATALOG } from '../../src/lib/naradji/catalog'

describe('alias matching', () => {
  it('maps grocery breath to catalog ids with qty', () => {
    const hits = matchAliases(
      'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD',
      FALLBACK_CATALOG,
    )
    const ids = hits.map((h) => h.id)
    expect(ids).toEqual(expect.arrayContaining(['atta', 'anda', 'maggi', 'parle-g']))
    expect(hits.find((h) => h.id === 'atta')?.qty).toBe(2)
    expect(hits.find((h) => h.id === 'maggi')?.qty).toBe(5)
    expect(wantsCOD('do kilo atta, COD')).toBe(true)
  })
})
