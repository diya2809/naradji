import { z } from 'zod'

/** Core morph contract. Use .nullable() (not .optional()) for OpenAI-safe schemas. */
export const UISpecSchema = z.object({
  language: z.enum(['gu', 'hi', 'en', 'hinglish']),
  naradji_line: z.string(),
  layout: z.enum(['grid', 'express', 'confirm']),
  items: z.array(
    z.object({
      id: z.string(),
      qty: z.number().default(1),
      reason: z.string().nullable(),
    }),
  ),
  prefill: z
    .object({
      payment: z.enum(['cod']).nullable(),
      address_id: z.string().nullable(),
      size: z.string().nullable(),
      color: z.string().nullable(),
    })
    .nullable(),
  patch: z.boolean().default(false),
})

export type UISpec = z.infer<typeof UISpecSchema>

export const emptyUISpec = (): UISpec => ({
  language: 'hinglish',
  naradji_line: 'Boliye — grocery list bataiye.',
  layout: 'grid',
  items: [],
  prefill: null,
  patch: false,
})
