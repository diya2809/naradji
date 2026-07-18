import { describe, expect, it } from 'vitest'
import { applyCartOp, detectCartOp } from '../../src/lib/naradji/cartIntent'

describe('detectCartOp', () => {
  it('detects remove phrases before treating product as add', () => {
    expect(detectCartOp('doodh hata do')).toBe('remove')
    expect(detectCartOp('oreo nahi chahiye')).toBe('remove')
    expect(detectCartOp('remove milk')).toBe('remove')
    expect(detectCartOp('atta nikal do')).toBe('remove')
  })

  it('detects clear and replace', () => {
    expect(detectCartOp('cart khali kar do')).toBe('clear')
    expect(detectCartOp('clear cart')).toBe('clear')
    expect(detectCartOp('sirf yeh doodh rakho')).toBe('replace')
  })

  it('defaults grocery lists to add', () => {
    expect(detectCartOp('do kilo atta, do doodh')).toBe('add')
  })
})

describe('applyCartOp', () => {
  const cart = [
    { id: 'atta', qty: 2, reason: null },
    { id: 'milk', qty: 1, reason: null },
    { id: 'tea', qty: 5, reason: null },
  ]

  it('adds by merging qty', () => {
    expect(applyCartOp(cart, [{ id: 'milk', qty: 2, reason: null }], 'add')).toEqual([
      { id: 'atta', qty: 2, reason: null },
      { id: 'milk', qty: 3, reason: null },
      { id: 'tea', qty: 5, reason: null },
    ])
  })

  it('removes matched ids only', () => {
    expect(applyCartOp(cart, [{ id: 'milk', qty: 1, reason: null }], 'remove')).toEqual([
      { id: 'atta', qty: 2, reason: null },
      { id: 'tea', qty: 5, reason: null },
    ])
  })

  it('replace and clear', () => {
    expect(applyCartOp(cart, [{ id: 'oreo', qty: 1, reason: null }], 'replace')).toEqual([
      { id: 'oreo', qty: 1, reason: null },
    ])
    expect(applyCartOp(cart, [], 'clear')).toEqual([])
  })
})
