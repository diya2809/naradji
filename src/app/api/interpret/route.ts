import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { getCatalog } from '@/lib/naradji/catalog'
import { matchAliases } from '@/lib/naradji/aliases'
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

/**
 * Interpret speech → UISpec.
 * Demo path: alias match → cartOp add. No remove/clear/address branching here.
 */
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

  // Alias hits are deterministic — never wait on LLM for grocery add.
  if (!body.stream && aliasHits.length > 0) {
    const offline = interpretOffline(transcript, catalog, state)
    return NextResponse.json({ uispec: offline, mode: 'alias' })
  }

  if (!body.stream) {
    const offline = interpretOffline(transcript, catalog, state)
    if (offline.items.length > 0 || offline.layout === 'compare') {
      return NextResponse.json({
        uispec: offline,
        mode: offline.layout === 'compare' ? 'compare' : 'offline',
      })
    }
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
        'You are Naradji. Return UISpec for grocery ADD only. Mirror language. Short naradji_line. ids from catalog only. cartOp: add. layout: grid|express.',
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
