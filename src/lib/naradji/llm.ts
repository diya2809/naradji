import { createGateway, streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { UISpecSchema, emptyPrefill, type UISpec } from './uispec'
import type { LeanProduct } from './catalog'
import { matchAliases, wantsCOD } from './aliases'
import { answerProductQuery, looksLikeProductQuery } from './productQuery'

const NARADJI_SYSTEM = `You are Naradji, the voice of an Indian daily-needs storefront.
Return ONLY a UISpec JSON object matching the schema.
Rules:
- Mirror the user's language in language + naradji_line (gu/hi/en/hinglish).
- naradji_line: ONE short spoken line, max ~16 words.
- Grocery lists → layout "express", cartOp "add", items from catalog ids only.
- Prefer alias-matched items; never invent SKUs.
- cartOp must always be "add" for this demo.
- qty defaults to 1. reason nullable.
- prefill fields null unless needed.`

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

/** Force add-only: alias hits win; never invent SKUs. */
function mergeAliasFirst(
  transcript: string,
  catalog: LeanProduct[],
  llm: UISpec,
): UISpec {
  const aliasHits = matchAliases(transcript, catalog)
  const items =
    aliasHits.length > 0
      ? aliasHits.map((h) => ({
          id: h.id,
          qty: h.qty,
          reason: null as string | null,
        }))
      : []

  const payment = wantsCOD(transcript) || llm.prefill?.payment === 'cod' ? 'cod' : null

  return {
    ...llm,
    cartOp: 'add',
    layout: items.length ? 'express' : llm.layout === 'compare' ? 'compare' : 'grid',
    items,
    naradji_line:
      items.length > 0
        ? llm.naradji_line || `${items.length} items cart mein.`
        : llm.naradji_line || 'Match nahi hua. Dobara boliye — doodh, atta, chai…',
    prefill: {
      ...emptyPrefill(),
      payment,
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
      cartOpHint: 'add',
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
 * Deterministic interpret for the hackathon demo: product mention → ADD.
 * No remove / clear / address / replace paths — those stole cart adds.
 */
export function interpretOffline(
  transcript: string,
  catalog: LeanProduct[],
  _state: UISpec | null = null,
): UISpec {
  const language = detectLanguage(transcript)
  const hits = matchAliases(transcript, catalog)
  const items = hits.map((h) => ({ id: h.id, qty: h.qty, reason: null as string | null }))

  if (items.length > 0) {
    const cod = wantsCOD(transcript)
    return {
      language,
      naradji_line: cod
        ? `${items.length} items cart mein. Haan pakka?`
        : `${items.length} items cart mein.`,
      layout: 'express',
      items,
      prefill: emptyPrefill(),
      cartOp: 'add',
    }
  }

  if (looksLikeProductQuery(transcript)) {
    const answered = answerProductQuery(transcript, catalog)
    if (answered) return { ...answered, cartOp: 'add', prefill: emptyPrefill() }
  }

  return {
    language,
    naradji_line: 'Match nahi hua. Dobara boliye — doodh, atta, chai…',
    layout: 'grid',
    items: [],
    prefill: emptyPrefill(),
    cartOp: 'add',
  }
}
