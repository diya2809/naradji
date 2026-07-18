import type { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

export const STORE_CURRENCY_CODE = 'INR' as const

/** Payload ecommerce plugin field names (derived from currency code). */
export const priceFieldName = `priceIn${STORE_CURRENCY_CODE}` as const
export const priceEnabledFieldName = `${priceFieldName}Enabled` as const
export const compareAtPriceFieldName = `compareAtPriceIn${STORE_CURRENCY_CODE}` as const

/** Deterministic storefront formatter — avoids SSR/client drift from `useCurrency()`. */
export const formatInrAmount = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    currency: STORE_CURRENCY_CODE,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(amount)

export const inrCurrencyConfig: CurrenciesConfig = {
  defaultCurrency: STORE_CURRENCY_CODE,
  supportedCurrencies: [
    {
      code: STORE_CURRENCY_CODE,
      decimals: 0,
      label: 'Indian Rupee',
      symbol: '₹',
      symbolDisplay: 'symbol',
    },
  ],
}

export const storeCurrencyCode = inrCurrencyConfig.defaultCurrency
