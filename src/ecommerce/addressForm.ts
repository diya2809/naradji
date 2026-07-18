import type { Address } from '@/payload-types'

export const DEFAULT_ADDRESS_COUNTRY = 'IN' as const

export type AddressFormValues = {
  name: string
  phone: string
  alternatePhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
}

export type AddressInput = Partial<Omit<Address, 'country'>> & {
  country?: string
}

export function normalizePincode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function isValidPincode(value: string): boolean {
  return /^\d{6}$/.test(normalizePincode(value))
}

/** Keep digits only; allow leading + for international-style input. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

/** Indian mobile: 10 digits, or +91 / 91 with 10 digits. */
export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value)
  if (!normalized) return false
  const digits = normalized.replace(/\D/g, '')
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits)
  if (digits.length === 12 && digits.startsWith('91')) return /^91[6-9]\d{9}$/.test(digits)
  return false
}

export function toAddressFormValues(initialData?: AddressInput | null): AddressFormValues {
  return {
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    alternatePhone: initialData?.alternatePhone || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    state: initialData?.state || '',
  }
}

export function toAddressPayload(
  values: AddressFormValues,
): Omit<Address, 'id' | 'customer' | 'updatedAt' | 'createdAt'> {
  const alternatePhone = normalizePhone(values.alternatePhone)
  // Lenient: keep whatever the user typed; empty fields stay empty (nothing compulsory).
  const pinRaw = (values.postalCode || '').trim()
  const pinDigits = normalizePincode(pinRaw)

  return {
    name: values.name.trim(),
    phone: normalizePhone(values.phone) || values.phone.trim(),
    ...(alternatePhone ? { alternatePhone } : { alternatePhone: null }),
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim(),
    city: values.city.trim(),
    country: DEFAULT_ADDRESS_COUNTRY,
    // Prefer digits when present; otherwise keep free-text so partial notes still save.
    postalCode: pinDigits || pinRaw,
    state: values.state.trim(),
  }
}

export function formatAddressSummary(address: AddressInput): string[] {
  const phoneLine = [address.phone, address.alternatePhone].filter(Boolean).join(' · ')

  return [
    address.name,
    phoneLine || undefined,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state].filter(Boolean).join(', '),
    address.postalCode,
  ].filter((line): line is string => Boolean(line?.trim()))
}

/** No contact fields are compulsory — always empty (lenient checkout). */
export function getAddressContactIssues(_address?: AddressInput | null): string[] {
  return []
}

export function formatAddressContactError(issues: string[]): string {
  if (issues.length === 0) return ''

  if (issues.length === 1) {
    return `Please add your ${issues[0]} to the delivery address, then try again.`
  }

  if (issues.length === 2) {
    return `Please add your ${issues[0]} and ${issues[1]} to the delivery address, then try again.`
  }

  const last = issues[issues.length - 1]
  const rest = issues.slice(0, -1).join(', ')
  return `Please add your ${rest}, and ${last} to the delivery address, then try again.`
}

/** Any selected/saved address is checkout-ready — fields may be partial or empty. */
export function isAddressReadyForCheckout(address?: AddressInput | null): boolean {
  return Boolean(address)
}
