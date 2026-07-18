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

  return {
    name: values.name.trim(),
    phone: normalizePhone(values.phone),
    ...(alternatePhone ? { alternatePhone } : { alternatePhone: null }),
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim(),
    city: values.city.trim(),
    country: DEFAULT_ADDRESS_COUNTRY,
    postalCode: normalizePincode(values.postalCode),
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

/** Missing/invalid contact fields required before checkout payment. */
export function getAddressContactIssues(address?: AddressInput | null): string[] {
  const issues: string[] = []

  if (!address?.name?.trim()) {
    issues.push('full name')
  }

  if (!address?.phone?.trim()) {
    issues.push('phone number')
  } else if (!isValidPhone(address.phone)) {
    issues.push('a valid 10-digit phone number')
  }

  if (address?.alternatePhone?.trim() && !isValidPhone(address.alternatePhone)) {
    issues.push('a valid alternate phone number')
  }

  return issues
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

export function isAddressReadyForCheckout(address?: AddressInput | null): boolean {
  return Boolean(address) && getAddressContactIssues(address).length === 0
}
