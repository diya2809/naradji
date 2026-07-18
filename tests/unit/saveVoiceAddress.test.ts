import { describe, expect, it } from 'vitest'
import { shippingToAddressForm, shippingToAddressPayload } from '../../src/lib/naradji/saveVoiceAddress'

describe('shippingToAddressForm', () => {
  it('fills demo defaults for hustled / incomplete spoken address', () => {
    const form = shippingToAddressForm({
      name: null,
      phone: null,
      addressLine1: 'CG Road pe',
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
      country: null,
    })
    expect(form.addressLine1).toBe('CG Road pe')
    expect(form.addressLine2).toBe('Voice order')
    expect(form.city).toBe('Ahmedabad')
    expect(form.postalCode).toBe('380001')
    expect(form.phone).toHaveLength(10)
    const payload = shippingToAddressPayload({
      name: 'Voice customer',
      phone: '9876543210',
      addressLine1: '12 CG Road',
      addressLine2: null,
      city: 'Ahmedabad',
      state: 'GJ',
      postalCode: '380009',
      country: 'IN',
    })
    expect(payload.addressLine2).toBe('Voice order')
    expect(payload.postalCode).toBe('380009')
  })
})
