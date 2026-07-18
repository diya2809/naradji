import { z } from 'zod'

/** Spoken / COD shipping — nullable fields for OpenAI structured-output safety. */
export const ShippingSchema = z
  .object({
    name: z.string().nullable(),
    phone: z.string().nullable(),
    addressLine1: z.string().nullable(),
    addressLine2: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    postalCode: z.string().nullable(),
    country: z.string().nullable(),
  })
  .nullable()

export type ShippingAddress = NonNullable<z.infer<typeof ShippingSchema>>

export const PrefillSchema = z
  .object({
    payment: z.enum(['cod']).nullable(),
    address_id: z.string().nullable(),
    size: z.string().nullable(),
    color: z.string().nullable(),
    shipping: ShippingSchema,
  })
  .nullable()

/** Core morph contract. Use .nullable() (not .optional()) for OpenAI-safe schemas. */
export const UISpecSchema = z.object({
  language: z.enum(['gu', 'hi', 'en', 'hinglish']),
  naradji_line: z.string(),
  /** express=cart, confirm=COD gate, compare=product Q&A cards, grid=idle/browse */
  layout: z.enum(['grid', 'express', 'confirm', 'compare']),
  items: z.array(
    z.object({
      id: z.string(),
      qty: z.number(),
      reason: z.string().nullable(),
    }),
  ),
  prefill: PrefillSchema,
  patch: z.boolean(),
})

export type UISpec = z.infer<typeof UISpecSchema>

export function emptyPrefill(): NonNullable<UISpec['prefill']> {
  return {
    payment: null,
    address_id: null,
    size: null,
    color: null,
    shipping: null,
  }
}

export const emptyUISpec = (): UISpec => ({
  language: 'hinglish',
  naradji_line: 'Boliye — grocery list bataiye.',
  layout: 'grid',
  items: [],
  prefill: emptyPrefill(),
  patch: false,
})

export function hasUsableShipping(shipping: ShippingAddress | null | undefined): boolean {
  if (!shipping) return false
  const line = (shipping.addressLine1 || '').trim()
  const phone = (shipping.phone || '').replace(/\D/g, '')
  const pin = (shipping.postalCode || '').replace(/\D/g, '')
  return line.length >= 5 && (phone.length >= 10 || pin.length === 6)
}
