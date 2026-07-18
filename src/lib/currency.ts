/**
 * Single INR money model for the store.
 * Re-exports the ecommerce config + minor/major helpers used by seed + Naradji.
 */
export {
  inrCurrencyConfig as currenciesConfig,
  INR_DECIMALS,
  majorToMinor as rupeesToMinor,
  minorToMajor as minorToRupees,
  STORE_CURRENCY_CODE,
} from '@/lib/inrCurrency'

export const INR = {
  code: 'INR' as const,
  decimals: 2,
  label: 'Indian Rupee',
  symbol: '₹',
}
