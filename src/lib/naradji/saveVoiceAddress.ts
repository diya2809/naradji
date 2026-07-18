import type { AddressFormValues } from '@/ecommerce/addressForm'
import { toAddressPayload } from '@/ecommerce/addressForm'
import type { ShippingAddress } from './uispec'

/**
 * Demo-lenient shipping → Payload address payload.
 * Fills missing phone/pin/apartment so hustled spoken addresses still save.
 */
export function shippingToAddressForm(shipping: ShippingAddress): AddressFormValues {
  const phoneDigits = (shipping.phone || '').replace(/\D/g, '')
  const phone =
    phoneDigits.length >= 10
      ? phoneDigits.slice(-10)
      : '9876543210' /* demo fallback — not strict */

  const pin = (shipping.postalCode || '').replace(/\D/g, '')
  const postalCode = pin.length === 6 ? pin : '380001'

  const line1 = (shipping.addressLine1 || '').trim() || 'Voice delivery address'

  return {
    name: (shipping.name || '').trim() || 'Voice customer',
    phone,
    alternatePhone: '',
    addressLine1: line1,
    addressLine2: (shipping.addressLine2 || '').trim() || 'Voice order',
    city: (shipping.city || '').trim() || 'Ahmedabad',
    state: (shipping.state || '').trim() || 'GJ',
    postalCode,
  }
}

export function shippingToAddressPayload(shipping: ShippingAddress) {
  return toAddressPayload(shippingToAddressForm(shipping))
}
