import { createGateway, streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { UISpecSchema, emptyPrefill, type UISpec } from './uispec'
import type { LeanProduct } from './catalog'
import { matchAliases, wantsCOD } from './aliases'
import { detectCartOp } from './cartIntent'
import { addressReadback, looksLikeAddress, parseSpokenAddress } from './parseAddress'
import { answerProductQuery, looksLikeProductQuery } from './productQuery'

const NARADJI_SYSTEM = `You are Naradji, the voice of an Indian daily-needs storefront.
Return ONLY a UISpec JSON object matching the schema.
Rules:
- Mirror the user's language in language + naradji_line (gu/hi/en/hinglish).
- naradji_line: ONE short spoken line, max ~16 words.
- Layouts: grid | express | confirm | compare.
- Grocery lists → layout "express", cartOp "add", items from catalog ids only.
- Remove / hata / nahi chahiye → cartOp "remove", items = ids to drop (not add).
- Clear cart / sab hata → cartOp "clear", items [].
- Replace / sirf yeh → cartOp "replace", items = new full list.
- Compare / cheaper / which brand → layout "compare", put candidate ids in items, answer in naradji_line.
- Address dictation → keep prior items, fill prefill.shipping, short confirm line.
- COD ready → layout "confirm" when items exist.
- qty defaults to 1. reason nullable.
- prefill.payment is "cod" when they said COD, else null.
- Prefer alias-matched items; never invent SKUs.
- Never treat a remove utterance as an add.`

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

function detectLanguage(transcript: string): UISpec['language'] {
  if (/[\u0A80-\u0AFF]/.test(transcript)) return 'gu'
  if (/[\u0900-\u097F]/.test(transcript)) return 'hi'
  return 'hinglish'
}

function mergeAliasFirst(
  transcript: string,
  catalog: LeanProduct[],
  llm: UISpec,
): UISpec {
  const cartOp = detectCartOp(transcript)

  if (llm.layout === 'compare') {
    const byId = new Map(catalog.map((p) => [p.id, p]))
    return {
      ...llm,
      cartOp: 'add',
      items: llm.items.filter((i) => byId.has(i.id)),
      prefill: {
        ...emptyPrefill(),
        ...llm.prefill,
        shipping: llm.prefill?.shipping ?? null,
      },
    }
  }

  if (cartOp === 'clear') {
    return {
      ...llm,
      cartOp: 'clear',
      layout: 'express',
      items: [],
      naradji_line: llm.naradji_line || 'Cart khali kar diya.',
      prefill: {
        ...emptyPrefill(),
        ...llm.prefill,
        shipping: llm.prefill?.shipping ?? null,
      },
    }
  }

  const aliasHits = matchAliases(transcript, catalog)
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const validLlm = llm.items.filter((i) => byId.has(i.id))

  const items =
    aliasHits.length > 0
      ? aliasHits.map((h) => ({
          id: h.id,
          qty: h.qty,
          reason: null as string | null,
        }))
      : validLlm

  const layout =
    llm.layout === 'confirm' || items.length >= 2
      ? items.length >= 2 && llm.layout !== 'confirm'
        ? 'express'
        : llm.layout
      : items.length === 1
        ? 'express'
        : cartOp === 'remove'
          ? 'express'
          : 'grid'

  const payment = wantsCOD(transcript) || llm.prefill?.payment === 'cod' ? 'cod' : null

  return {
    ...llm,
    cartOp,
    layout: items.length === 0 && cartOp === 'add' ? 'grid' : layout,
    items,
    prefill: {
      ...emptyPrefill(),
      ...llm.prefill,
      payment,
      shipping: llm.prefill?.shipping ?? null,
    },
  }
}

export function resolveModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })('openai/gpt-4o-mini')
  }
  return openai('gpt-4o-mini')
}

export function hasLLMKey() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY)
}

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
      cartOpHint: detectCartOp(transcript),
      catalog: leanForPrompt(catalog),
      state,
    }),
  })
}

export function finalizeUISpec(
  transcript: string,
  catalog: LeanProduct[],
  llm: UISpec,
): UISpec {
  return mergeAliasFirst(transcript, catalog, llm)
}

/**
 * Deterministic interpret: address → compare/Q&A → cart op + alias.
 * Keeps LLM off the hot path when patterns hit.
 */
export function interpretOffline(
  transcript: string,
  catalog: LeanProduct[],
  state: UISpec | null = null,
): UISpec {
  const language = detectLanguage(transcript)
  const prevItems = state?.items ?? []
  const prevPrefill = state?.prefill ?? emptyPrefill()
  const cartOp = detectCartOp(transcript)

  if (looksLikeAddress(transcript)) {
    const shipping = parseSpokenAddress(transcript)
    if (shipping) {
      return {
        language,
        naradji_line: addressReadback(shipping),
        layout: prevItems.length ? 'confirm' : 'express',
        items: prevItems,
        prefill: {
          ...emptyPrefill(),
          ...prevPrefill,
          payment: 'cod',
          shipping,
        },
        cartOp: 'add',
      }
    }
  }

  // Product Q&A only when not a cart remove/clear (those can contain brand names).
  if (cartOp === 'add' && looksLikeProductQuery(transcript)) {
    const answered = answerProductQuery(transcript, catalog)
    if (answered) return answered
  }

  if (cartOp === 'clear') {
    return {
      language,
      naradji_line: 'Cart khali kar diya.',
      layout: 'express',
      items: [],
      prefill: {
        ...emptyPrefill(),
        payment: null,
        shipping: prevPrefill?.shipping ?? null,
      },
      cartOp: 'clear',
    }
  }

  const hits = matchAliases(transcript, catalog)
  const cod = wantsCOD(transcript)
  const items = hits.map((h) => ({ id: h.id, qty: h.qty, reason: null as string | null }))

  if (cartOp === 'remove') {
    return {
      language,
      naradji_line:
        items.length > 0
          ? `${items.length} item cart se hata diya.`
          : 'Kya hataun? Item ka naam boliye.',
      layout: 'express',
      items,
      prefill: {
        ...emptyPrefill(),
        payment: null,
        shipping: prevPrefill?.shipping ?? null,
      },
      cartOp: 'remove',
    }
  }

  if (cartOp === 'replace') {
    return {
      language,
      naradji_line:
        items.length > 0
          ? `Cart update: ${items.length} items.`
          : 'Nayi list nahi samajh aayi.',
      layout: items.length ? 'express' : 'grid',
      items,
      prefill: {
        ...emptyPrefill(),
        payment: cod ? 'cod' : null,
        shipping: prevPrefill?.shipping ?? null,
      },
      cartOp: 'replace',
    }
  }

  // add
  const layout =
    items.length >= 2 || cod
      ? cod && items.length
        ? 'confirm'
        : 'express'
      : items.length
        ? 'express'
        : 'grid'
  return {
    language,
    naradji_line:
      items.length > 0
        ? cod
          ? `${items.length} items cart mein. Haan pakka?`
          : `${items.length} items cart mein.`
        : 'Match nahi hua. Dobara boliye.',
    layout,
    items,
    prefill: {
      ...emptyPrefill(),
      payment: cod ? 'cod' : null,
      shipping: prevPrefill?.shipping ?? null,
    },
    cartOp: 'add',
  }
}
