import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/naradji/catalog'
import { interpretOffline, interpretStream, finalizeUISpec } from '@/lib/naradji/llm'
import { UISpecSchema, type UISpec } from '@/lib/naradji/uispec'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from 'ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function hasLLMKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY)
}

function resolveModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })('anthropic/claude-haiku-4.5')
  }
  return anthropic('claude-haiku-4.5')
}

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

  if (!hasLLMKey()) {
    const offline = interpretOffline(transcript, catalog)
    return NextResponse.json({ uispec: offline, mode: 'offline' })
  }

  // Prefer non-stream JSON for reliable client morph; stream when requested
  if (body.stream) {
    const result = interpretStream({ transcript, catalog, state })
    return result.toTextStreamResponse()
  }

  try {
    const { object } = await generateObject({
      model: resolveModel(),
      schema: UISpecSchema,
      system:
        'You are Naradji. Return UISpec. Mirror language. One short naradji_line. ids from catalog only. layouts: grid|express|confirm.',
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
    const offline = interpretOffline(transcript, catalog)
    return NextResponse.json({ uispec: offline, mode: 'offline-fallback' })
  }
}
