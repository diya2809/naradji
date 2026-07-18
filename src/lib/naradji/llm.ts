import { streamObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from 'ai'
import { UISpecSchema, type UISpec } from './uispec'
import type { LeanProduct } from './catalog'
import { matchAliases, wantsCOD } from './aliases'

const NARADJI_SYSTEM = `You are Naradji, the voice of an Indian daily-needs storefront.
Return ONLY a UISpec JSON object matching the schema.
Rules:
- Mirror the user's language in language + naradji_line (gu/hi/en/hinglish).
- naradji_line: ONE short spoken line, max ~12 words.
- Day-one layouts only: grid | express | confirm.
- Grocery lists with multiple items → layout "express".
- When user is ready to pay / COD and items are set → layout "confirm".
- items[].id MUST be one of the catalog ids provided. Never invent SKUs.
- qty defaults to 1. reason is a short nullable why (or null).
- prefill.payment is "cod" when they said COD, else null.
- patch:true only when correcting a previous list (e.g. "nahi Maggi nahi").
- Prefer alias-matched items; fill gaps from catalog titles.`

function leanForPrompt(catalog: LeanProduct[]) {
  return catalog.map(({ id, title, price, unit, category, aliases }) => ({
    id,
    title,
    price,
    unit,
    category,
    aliases: aliases.slice(0, 6),
  }))
}

function mergeAliasFirst(
  transcript: string,
  catalog: LeanProduct[],
  llm: UISpec,
): UISpec {
  const aliasHits = matchAliases(transcript, catalog)
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const validLlm = llm.items.filter((i) => byId.has(i.id))

  const items =
    aliasHits.length > 0
      ? [
          ...aliasHits.map((h) => ({
            id: h.id,
            qty: h.qty,
            reason: null as string | null,
          })),
          ...validLlm.filter((i) => !aliasHits.some((h) => h.id === i.id)),
        ]
      : validLlm

  const layout =
    llm.layout === 'confirm' || items.length >= 2
      ? items.length >= 2 && llm.layout !== 'confirm'
        ? 'express'
        : llm.layout
      : items.length === 1
        ? 'express'
        : 'grid'

  const payment = wantsCOD(transcript) || llm.prefill?.payment === 'cod' ? 'cod' : null

  return {
    ...llm,
    layout: items.length === 0 ? 'grid' : layout,
    items,
    prefill: {
      payment,
      address_id: llm.prefill?.address_id ?? null,
      size: llm.prefill?.size ?? null,
      color: llm.prefill?.color ?? null,
    },
  }
}

function resolveModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
    return gateway('anthropic/claude-haiku-4.5')
  }
  return anthropic('claude-haiku-4.5')
}

/** Alias-first interpret via AI SDK streamObject (Haiku). */
export function interpretStream(opts: {
  transcript: string
  catalog: LeanProduct[]
  state: UISpec | null
}) {
  const { transcript, catalog, state } = opts
  const aliasHits = matchAliases(transcript, catalog)

  return streamObject({
    model: resolveModel(),
    schema: UISpecSchema,
    system: NARADJI_SYSTEM,
    prompt: JSON.stringify({
      transcript,
      aliasHits,
      catalog: leanForPrompt(catalog),
      state,
    }),
    onFinish: ({ object }) => {
      // merge happens on client after parse; keep server stream raw schema
      void object
    },
  })
}

export function finalizeUISpec(
  transcript: string,
  catalog: LeanProduct[],
  llm: UISpec,
): UISpec {
  return mergeAliasFirst(transcript, catalog, llm)
}

/** Deterministic demo path when LLM/keys missing. */
export function interpretOffline(
  transcript: string,
  catalog: LeanProduct[],
): UISpec {
  const hits = matchAliases(transcript, catalog)
  const cod = wantsCOD(transcript)
  const items = hits.map((h) => ({ id: h.id, qty: h.qty, reason: null as string | null }))
  const layout = items.length >= 2 || cod ? (cod && items.length ? 'confirm' : 'express') : items.length ? 'express' : 'grid'
  return {
    language: /[\u0A80-\u0AFF]/.test(transcript)
      ? 'gu'
      : /[\u0900-\u097F]/.test(transcript)
        ? 'hi'
        : /[a-z]/i.test(transcript) && /[अ-हઅ-હ]/.test(transcript)
          ? 'hinglish'
          : 'hinglish',
    naradji_line:
      items.length > 0
        ? cod
          ? 'Theek hai — COD ready. Bol do haan pakka.'
          : `Mil gaya — ${items.length} items. COD chahiye?`
        : 'Dobara boliye — atta, anda, Maggi…',
    layout,
    items,
    prefill: { payment: cod ? 'cod' : null, address_id: null, size: null, color: null },
    patch: /nahi|नहीं|ના/.test(transcript.toLowerCase()),
  }
}
