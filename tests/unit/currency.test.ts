import { describe, expect, it } from 'vitest'
import { currenciesConfig, INR, minorToRupees, rupeesToMinor } from '../../src/lib/currency'

describe('currency INR', () => {
  it('is the only supported store currency with ₹ symbol', () => {
    expect(currenciesConfig.defaultCurrency).toBe('INR')
    expect(currenciesConfig.supportedCurrencies).toHaveLength(1)
    expect(currenciesConfig.supportedCurrencies[0]).toEqual(INR)
    expect(INR.symbol).toBe('₹')
    expect(INR.code).toBe('INR')
  })

  it('converts whole rupees to paise for plugin storage', () => {
    expect(rupeesToMinor(28)).toBe(2800)
    expect(rupeesToMinor(54.5)).toBe(5450)
  })

  it('converts paise back to rupees for Naradji UI', () => {
    expect(minorToRupees(2800)).toBe(28)
    expect(minorToRupees(5450)).toBe(54.5)
  })
})
