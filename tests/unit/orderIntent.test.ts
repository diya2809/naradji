import { describe, expect, it } from 'vitest'
import { isPlaceOrderTranscript } from '../../src/lib/naradji/orderIntent'

describe('isPlaceOrderTranscript', () => {
  it.each([
    'place order',
    'place the order',
    'order karo',
    'order karjo',
    'checkout karo',
    'haan pakka',
    'ઓર્ડર કરો',
    'ऑर्डर करो',
  ])('recognizes explicit order command: %s', (transcript) => {
    expect(isPlaceOrderTranscript(transcript)).toBe(true)
  })

  it.each(['milk add karjo ne', 'doodh add karo', 'do kilo atta', 'order biscuits'])(
    'does not place an order from a product command: %s',
    (transcript) => {
      expect(isPlaceOrderTranscript(transcript)).toBe(false)
    },
  )
})
