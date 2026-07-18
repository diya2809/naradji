import type { LeanProduct } from './catalog'
import { matchAliases, normalizeSpeech } from './aliases'
import { emptyPrefill, type UISpec } from './uispec'

const COMPARE_CUE =
  /\b(sasta|sasti|saste|cheaper|cheap|compare|comparison|vs|versus|kaun|konsa|which|between|beech|farq|difference|mehnga|mehngi|price|keemat|kimat)\b|सस्ता|कौन|सस्ते|तुलना/i

/** Product Q&A / compare — not an add-to-cart breath. */
export function looksLikeProductQuery(transcript: string): boolean {
  return COMPARE_CUE.test(transcript)
}

function detectLanguage(transcript: string): UISpec['language'] {
  if (/[\u0A80-\u0AFF]/.test(transcript)) return 'gu'
  if (/[\u0900-\u097F]/.test(transcript)) return 'hi'
  return 'hinglish'
}

function shortName(title: string): string {
  return (title.split(/[,(]/)[0] || title).trim()
}

/**
 * Answer compare / cheaper queries from catalog.
 * Picks matched SKUs (or category peers when user names a category like tea/chai).
 */
export function answerProductQuery(transcript: string, catalog: LeanProduct[]): UISpec | null {
  if (!looksLikeProductQuery(transcript)) return null

  const text = normalizeSpeech(transcript)
  let candidates = matchAliases(transcript, catalog).map((h) => {
    const p = catalog.find((c) => c.id === h.id)!
    return p
  })

  // Category peer expand: "tea" / "chai" with compare cue → tea SKUs
  if (candidates.length < 2) {
    const categoryHints: { re: RegExp; cat: string }[] = [
      { re: /\b(tea|chai|चाय)\b/i, cat: 'tea' },
      { re: /\b(oil|tel|तेल)\b/i, cat: 'oil' },
      { re: /\b(atta|flour|आटा)\b/i, cat: 'flour' },
      { re: /\b(milk|doodh|दूध)\b/i, cat: 'dairy' },
      { re: /\b(biscuit|cookie)\b/i, cat: 'biscuit' },
    ]
    for (const hint of categoryHints) {
      if (!hint.re.test(transcript)) continue
      const peers = catalog.filter(
        (p) =>
          p.category.toLowerCase().includes(hint.cat) ||
          normalizeSpeech(p.title).includes(hint.cat === 'tea' ? 'tea' : hint.cat),
      )
      if (peers.length >= 2) {
        // Prefer 250g packs for fair tea compare when present
        const fair = peers.filter((p) => /250g|250 g/i.test(p.title))
        candidates = (fair.length >= 2 ? fair : peers)
          .slice()
          .sort((a, b) => a.price - b.price)
          .slice(0, 4)
        break
      }
    }
  }

  // Brand-name scan if still thin
  if (candidates.length < 2) {
    const byBrand = catalog.filter((p) => {
      const blob = normalizeSpeech([p.title, ...p.aliases].join(' '))
      // tokens longer than 3 that appear in transcript
      return blob.split(' ').some((tok) => tok.length >= 4 && text.includes(tok))
    })
    if (byBrand.length >= 2) {
      candidates = byBrand.slice().sort((a, b) => a.price - b.price).slice(0, 4)
    }
  }

  // Dedupe + keep best
  const seen = new Set<string>()
  candidates = candidates.filter((p) => {
    if (!p || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  if (candidates.length < 2) {
    return {
      language: detectLanguage(transcript),
      naradji_line: 'Do products ke naam boliye — main compare karunga.',
      layout: 'compare',
      items: [],
      prefill: emptyPrefill(),
      patch: false,
    }
  }

  const sorted = [...candidates].sort((a, b) => a.price - b.price)
  const cheapest = sorted[0]!
  const others = sorted.slice(1, 3)
  const items = [cheapest, ...others].map((p) => ({
    id: p.id,
    qty: 1,
    reason: p.id === cheapest.id ? 'cheapest' : 'compare',
  }))

  const vs = others.map((o) => `${shortName(o.title)} ₹${o.price}`).join(', ')
  const line = `${shortName(cheapest.title)} sasta — ₹${cheapest.price}. Vs ${vs}.`

  return {
    language: detectLanguage(transcript),
    naradji_line: line,
    layout: 'compare',
    items,
    prefill: emptyPrefill(),
    patch: false,
  }
}
