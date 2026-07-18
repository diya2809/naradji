import { describe, expect, it } from 'vitest'
import { currenciesConfig, INR, minorToRupees, rupeesToMinor } from '../../src/lib/currency'
import { formatInrAmount, inrCurrencyConfig, minorToMajor } from '../../src/lib/inrCurrency'

describe('currency INR', () => {
  it('uses one config for plugin + helpers (decimals=2 / paise)', () => {
    expect(currenciesConfig).toBe(inrCurrencyConfig)
    expect(currenciesConfig.defaultCurrency).toBe('INR')
    expect(currenciesConfig.supportedCurrencies).toHaveLength(1)
    expect(currenciesConfig.supportedCurrencies[0].decimals).toBe(INR.decimals)
    expect(currenciesConfig.supportedCurrencies[0].symbol).toBe('₹')
  })

  it('converts whole rupees to paise for plugin storage', () => {
    expect(rupeesToMinor(28)).toBe(2800)
    expect(rupeesToMinor(54.5)).toBe(5450)
    expect(rupeesToMinor(65)).toBe(6500)
  })

  it('converts paise back to rupees for Naradji UI', () => {
    expect(minorToRupees(2800)).toBe(28)
    expect(minorToRupees(5450)).toBe(54.5)
  })

  it('formats storefront amounts from paise, not raw minor as rupees', () => {
    expect(formatInrAmount(6500)).toBe('₹65')
    expect(formatInrAmount(2800)).toBe('₹28')
  })

  it('exposes major units for Schema.org offers (not raw paise)', () => {
    expect(minorToMajor(6500)).toBe(65)
    expect(minorToMajor(2800)).toBe(28)
  })
})
