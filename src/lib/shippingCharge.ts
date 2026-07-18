/** Shipping charge business rules — single source of truth. */

/** Product subtotal threshold above which shipping is free (inclusive). */
export const FREE_SHIPPING_THRESHOLD = 1499

/** Flat shipping fee charged when the product subtotal is below the threshold. */
export const SHIPPING_CHARGE_AMOUNT = 80

/**
 * Returns the shipping charge (in ₹) for a given product subtotal.
 * ₹80  → when subtotal < ₹1,499
 * ₹0   → when subtotal ≥ ₹1,499 (free shipping)
 */
export function getShippingCharge(productSubtotal: number): number {
  return productSubtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGE_AMOUNT : 0
}
