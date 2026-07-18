import { describe, expect, it } from 'vitest'
import {
  looksLikeAddress,
  parseSpokenAddress,
  addressReadback,
} from '../../src/lib/naradji/parseAddress'
import { hasUsableShipping } from '../../src/lib/naradji/uispec'

describe('parseSpokenAddress', () => {
  it('detects address cues with pin and phone', () => {
    const t = 'Mera address 12 CG Road Ahmedabad 380009 phone 9876543210'
    expect(looksLikeAddress(t)).toBe(true)
    const ship = parseSpokenAddress(t)
    expect(ship).not.toBeNull()
    expect(ship?.city).toBe('Ahmedabad')
    expect(ship?.postalCode).toBe('380009')
    expect(ship?.phone).toBe('9876543210')
    expect(hasUsableShipping(ship)).toBe(true)
    expect(addressReadback(ship!)).toMatch(/Address note/)
  })

  it('ignores grocery lists', () => {
    expect(looksLikeAddress('do kilo atta, do doodh')).toBe(false)
    expect(parseSpokenAddress('do kilo atta, do doodh')).toBeNull()
  })
})
