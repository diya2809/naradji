import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { getCatalog } from '@/lib/naradji/catalog'
import { matchAliases } from '@/lib/naradji/aliases'
import { detectCartOp, isBareNegation } from '@/lib/naradji/cartIntent'
import { looksLikeAddress } from '@/lib/naradji/parseAddress'
import { looksLikeProductQuery } from '@/lib/naradji/productQuery'
import {
  finalizeUISpec,
  hasLLMKey,
  interpretOffline,
  interpretStream,
  resolveModel,
} from '@/lib/naradji/llm'
import { UISpecSchema, type UISpec } from '@/lib/naradji/uispec'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    transcript?: string
    state?: UISpec | null
    stream?: boolean
  }

  const transcript = (body.transcript || '').trim()
  if (!transcript) {
    return NextResponse.json({ error: 'transcript required' }, { status: 400 })
  }

  const catalog = await getCatalog()
  const state = body.state ?? null

  const aliasHits = matchAliases(transcript, catalog)
  const cartOp = detectCartOp(transcript)

  // Deterministic paths first — never let LLM invent cart SKUs for clear/remove/replace/alias.
  if (
    !body.stream &&
    (looksLikeAddress(transcript) ||
      looksLikeProductQuery(transcript) ||
      isBareNegation(transcript) ||
      cartOp === 'clear' ||
      cartOp === 'remove' ||
      cartOp === 'replace' ||
      aliasHits.length > 0)
  ) {
    const offline = interpretOffline(transcript, catalog, state)
    const mode = looksLikeAddress(transcript)
      ? 'address'
      : offline.layout === 'compare'
        ? 'compare'
        : aliasHits.length > 0
          ? 'alias'
          : 'offline'
    return NextResponse.json({ uispec: offline, mode })
  }

  if (!hasLLMKey()) {
    const offline = interpretOffline(transcript, catalog, state)
    return NextResponse.json({ uispec: offline, mode: 'offline' })
  }

  if (body.stream) {
    const result = interpretStream({ transcript, catalog, state })
    return result.toTextStreamResponse()
  }

  try {
    const { object } = await generateObject({
      model: resolveModel(),
      schema: UISpecSchema,
      system:
        'You are Naradji. Return UISpec. Mirror language. Short naradji_line. ids from catalog only. layouts: grid|express|confirm|compare. cartOp: add|remove|replace|clear. Remove/hata/nahi chahiye → cartOp remove with items to drop. Clear cart → cartOp clear. Compare/cheaper → compare layout. Address → fill prefill.shipping.',
      prompt: JSON.stringify({
        transcript,
        catalog: catalog.map(({ id, title, price, unit, aliases }) => ({
          id,
          title,
          price,
          unit,
          aliases: aliases.slice(0, 6),
        })),
        state,
      }),
    })
    const uispec = finalizeUISpec(transcript, catalog, object)
    return NextResponse.json({ uispec, mode: 'llm' })
  } catch (err) {
    console.error('[interpret]', err)
    const offline = interpretOffline(transcript, catalog, state)
    return NextResponse.json({ uispec: offline, mode: 'offline-fallback' })
  }
}
