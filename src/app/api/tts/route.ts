import { NextResponse } from 'next/server'
import { SarvamAIClient } from 'sarvamai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string
    language?: string
  }

  const text = (body.text || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }

  const key = process.env.SARVAM_API_KEY
  if (!key) {
    return NextResponse.json({ skipped: true, reason: 'no SARVAM_API_KEY' }, { status: 204 })
  }

  const lang = body.language || 'hi'
  const target_language_code =
    lang === 'gu' ? 'gu-IN' : lang === 'en' ? 'en-IN' : 'hi-IN'

  try {
    const client = new SarvamAIClient({ apiSubscriptionKey: key })
    const streamResponse = await client.textToSpeech.convertStream({
      text: text.slice(0, 3500),
      target_language_code,
      speaker: 'shubh',
      model: 'bulbul:v3',
    })
    const bytes = await streamResponse.bytes()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[tts]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'tts failed' },
      { status: 502 },
    )
  }
}
