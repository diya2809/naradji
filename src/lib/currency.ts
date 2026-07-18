/**
 * Store currency: Indian Rupee only.
 * Payload ecommerce stores amounts in minor units (paise when decimals=2).
 */

export const INR = {
  code: 'INR' as const,
  decimals: 2,
  label: 'Indian Rupee',
  symbol: '₹',
}

export const currenciesConfig = {
  defaultCurrency: 'INR' as const,
  supportedCurrencies: [INR],
}

/** Whole rupees → paise (plugin / admin storage). */
export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * 100)
}

/** Paise → whole rupees for Naradji / speech UI. */
export function minorToRupees(minor: number): number {
  return Math.round(minor) / 100
}
