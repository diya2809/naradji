import { z } from 'zod'

/** How the utterance mutates the cart. Representation for applyCartOp / sync. */
export const CartOpSchema = z.enum(['add', 'remove', 'replace', 'clear'])

export const PrefillSchema = z
  .object({
    payment: z.enum(['cod']).nullable(),
    address_id: z.string().nullable(),
    size: z.string().nullable(),
    color: z.string().nullable(),
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
  /**
   * Cart mutation for this turn.
   * - add: merge uttered items into cart
   * - remove: drop uttered ids from cart
   * - replace: cart becomes uttered items only
   * - clear: empty cart
   */
  cartOp: CartOpSchema,
})

export type UISpec = z.infer<typeof UISpecSchema>
export type CartOp = z.infer<typeof CartOpSchema>

export function emptyPrefill(): NonNullable<UISpec['prefill']> {
  return {
    payment: null,
    address_id: null,
    size: null,
    color: null,
  }
}

export const emptyUISpec = (): UISpec => ({
  language: 'hinglish',
  naradji_line: 'Boliye — grocery list bataiye.',
  layout: 'grid',
  items: [],
  prefill: emptyPrefill(),
  cartOp: 'add',
})
