/** Storefront amounts are whole rupees; transactions store paise (INR × 100). */
export const toPaise = (amountInRupees: number): number => {
  if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
    throw new Error('A valid amount is required to place an order.')
  }

  return Math.round(amountInRupees * 100)
}

export const storeCurrency = 'INR'
