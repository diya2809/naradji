import { majorToMinor } from '@/lib/inrCurrency'

/** Shipping charge business rules — amounts in INR minor units (paise). */

/** Product subtotal threshold above which shipping is free (inclusive), in paise. */
export const FREE_SHIPPING_THRESHOLD = majorToMinor(1499)

/** Flat shipping fee when below threshold, in paise. */
export const SHIPPING_CHARGE_AMOUNT = majorToMinor(80)

/**
 * Returns the shipping charge (paise) for a given product subtotal (paise).
 * ₹80  → when subtotal < ₹1,499
 * ₹0   → when subtotal ≥ ₹1,499 (free shipping)
 */
export function getShippingCharge(productSubtotalMinor: number): number {
  return productSubtotalMinor < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGE_AMOUNT : 0
}
