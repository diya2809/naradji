import { describe, expect, it } from 'vitest'
import { UISpecSchema, emptyUISpec } from '../../src/lib/naradji/uispec'

describe('UISpec', () => {
  it('parses a valid express grocery spec', () => {
    const parsed = UISpecSchema.parse({
      language: 'hinglish',
      naradji_line: 'Paanch items ready — COD?',
      layout: 'express',
      items: [
        { id: 'atta', qty: 2, reason: null },
        { id: 'maggi', qty: 5, reason: null },
      ],
      prefill: {
        payment: 'cod',
        address_id: null,
        size: null,
        color: null,
        shipping: null,
      },
      patch: false,
    })
    expect(parsed.items).toHaveLength(2)
    expect(parsed.layout).toBe('express')
  })

  it('rejects unknown layouts (mission is stretch)', () => {
    expect(() =>
      UISpecSchema.parse({
        ...emptyUISpec(),
        layout: 'mission',
      }),
    ).toThrow()
  })

  it('requires qty (OpenAI structured-output safe)', () => {
    expect(() =>
      UISpecSchema.parse({
        ...emptyUISpec(),
        items: [{ id: 'atta', reason: null }],
      }),
    ).toThrow()
  })
})
