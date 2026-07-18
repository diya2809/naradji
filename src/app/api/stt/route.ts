import { NextResponse } from 'next/server'
import { SarvamAIClient } from 'sarvamai'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { createReadStream } from 'fs'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Deterministic demo grocery breath — inject via ?demo=1 or form field demo=1 */
export const DEMO_TRANSCRIPT =
  'do kilo atta, ek dozen anda, paanch Maggi, do Parle-G, COD'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const form = await req.formData().catch(() => null)
  const demoFlag =
    url.searchParams.get('demo') === '1' ||
    form?.get('demo') === '1' ||
    form?.get('demo') === 'true'

  if (demoFlag) {
    return NextResponse.json({
      transcript: DEMO_TRANSCRIPT,
      language_code: 'hi-IN',
      mode: 'demo',
    })
  }

  const key = process.env.SARVAM_API_KEY
  if (!key) {
    // No key → still deliverable for rehearsal
    return NextResponse.json({
      transcript: DEMO_TRANSCRIPT,
      language_code: 'hi-IN',
      mode: 'demo-no-key',
    })
  }

  const file = form?.get('file') || form?.get('audio')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 })
  }

  const ext = file.type.includes('webm')
    ? 'webm'
    : file.type.includes('wav')
      ? 'wav'
      : file.type.includes('mp4')
        ? 'mp4'
        : 'webm'

  const tmp = path.join(tmpdir(), `naradji-stt-${randomUUID()}.${ext}`)
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(tmp, buf)

    const client = new SarvamAIClient({ apiSubscriptionKey: key })
    const response = await client.speechToText.transcribe({
      file: createReadStream(tmp),
      model: 'saaras:v3',
      mode: 'codemix',
    })

    const transcript =
      (response as { transcript?: string }).transcript?.trim() || DEMO_TRANSCRIPT

    return NextResponse.json({
      transcript,
      language_code: (response as { language_code?: string }).language_code ?? null,
      mode: 'sarvam',
    })
  } catch (err) {
    console.error('[stt]', err)
    return NextResponse.json({
      transcript: DEMO_TRANSCRIPT,
      language_code: 'hi-IN',
      mode: 'demo-fallback',
      error: err instanceof Error ? err.message : 'stt failed',
    })
  } finally {
    await unlink(tmp).catch(() => undefined)
  }
}
