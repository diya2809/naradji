import { describe, expect, it } from 'vitest'
import { answerProductQuery, looksLikeProductQuery } from '../../src/lib/naradji/productQuery'
import { FALLBACK_CATALOG } from '../../src/lib/naradji/catalog'

describe('productQuery', () => {
  it('detects cheaper / compare cues', () => {
    expect(looksLikeProductQuery('Tata tea aur Red Label mein kaun sasta')).toBe(true)
    expect(looksLikeProductQuery('do kilo atta')).toBe(false)
  })

  it('answers which tea brand is cheaper from catalog', () => {
    const spec = answerProductQuery(
      'Tata tea aur Red Label mein kaun sasta',
      FALLBACK_CATALOG,
    )
    expect(spec).not.toBeNull()
    expect(spec!.layout).toBe('compare')
    expect(spec!.items.length).toBeGreaterThanOrEqual(2)
    expect(spec!.naradji_line).toMatch(/sasta|₹/i)
    const cheapest = spec!.items.find((i) => i.reason === 'cheapest')
    expect(cheapest).toBeTruthy()
  })
})
