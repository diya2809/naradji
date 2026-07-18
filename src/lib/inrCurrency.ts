import type { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

export const STORE_CURRENCY_CODE = 'INR' as const

/** Payload ecommerce plugin field names (derived from currency code). */
export const priceFieldName = `priceIn${STORE_CURRENCY_CODE}` as const
export const priceEnabledFieldName = `${priceFieldName}Enabled` as const
export const compareAtPriceFieldName = `compareAtPriceIn${STORE_CURRENCY_CODE}` as const

/**
 * INR uses decimals=2 → plugin stores paise in priceInINR / cart / order amounts.
 * Format for humans by converting minor → major first.
 */
export const INR_DECIMALS = 2

export const minorToMajor = (minor: number): number => minor / 10 ** INR_DECIMALS

export const majorToMinor = (major: number): number => Math.round(major * 10 ** INR_DECIMALS)

/** Deterministic storefront formatter — avoids SSR/client drift from `useCurrency()`. */
export const formatInrAmount = (amountMinor: number): string =>
  new Intl.NumberFormat('en-IN', {
    currency: STORE_CURRENCY_CODE,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(minorToMajor(amountMinor))

export const inrCurrencyConfig: CurrenciesConfig = {
  defaultCurrency: STORE_CURRENCY_CODE,
  supportedCurrencies: [
    {
      code: STORE_CURRENCY_CODE,
      decimals: INR_DECIMALS,
      label: 'Indian Rupee',
      symbol: '₹',
      symbolDisplay: 'symbol',
    },
  ],
}

export const storeCurrencyCode = inrCurrencyConfig.defaultCurrency
