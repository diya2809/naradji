import type { LeanProduct } from './catalog'

const QTY_WORDS: Record<string, number> = {
  ek: 1,
  one: 1,
  a: 1,
  do: 2,
  two: 2,
  teen: 3,
  three: 3,
  char: 4,
  four: 4,
  paanch: 5,
  panch: 5,
  five: 5,
  chhe: 6,
  six: 6,
  saat: 7,
  seven: 7,
  aath: 8,
  eight: 8,
  nau: 9,
  nine: 9,
  das: 10,
  ten: 10,
  dozen: 12,
  kilo: 1,
  kg: 1,
}

export type AliasMatch = {
  id: string
  qty: number
  matchedAlias: string
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Alias map first — returns catalog ids found in the transcript with qty hints. */
export function matchAliases(transcript: string, catalog: LeanProduct[]): AliasMatch[] {
  const text = transcript.toLowerCase()
  const matches: AliasMatch[] = []
  const seen = new Set<string>()

  const entries = catalog
    .flatMap((p) =>
      [...p.aliases, p.title, p.slug].map((alias) => ({
        id: p.id,
        alias: alias.toLowerCase().trim(),
      })),
    )
    .filter((e) => e.alias.length >= 2)
    .sort((a, b) => b.alias.length - a.alias.length)

  const qtyAlt = Object.keys(QTY_WORDS).sort((a, b) => b.length - a.length).map(escapeRe).join('|')

  for (const { id, alias } of entries) {
    if (seen.has(id)) continue
    const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRe(alias)}(?:$|[^\\p{L}\\p{N}])`, 'iu')
    if (!re.test(text)) continue

    const idx = text.search(re)
    const at = idx < 0 ? text.indexOf(alias) : idx
    // Nearest qty token immediately before this alias (ignore earlier list items)
    const left = text.slice(Math.max(0, at - 40), at)
    let qty = 1
    // "ek dozen anda" → 12; "do kilo atta" → 2 (kilo is unit, not qty)
    if (/\bdozen\s*$/i.test(left)) {
      qty = 12
    } else {
      const near = left.match(
        new RegExp(`(?:(\\d+)|\\b(${qtyAlt})\\b)(?:\\s+(?:kilo|kg))?\\s*$`, 'i'),
      )
      if (near?.[1]) qty = Number(near[1])
      else if (near?.[2]) qty = QTY_WORDS[near[2].toLowerCase()] || 1
    }

    seen.add(id)
    matches.push({ id, qty, matchedAlias: alias })
  }

  return matches
}

export function wantsCOD(transcript: string): boolean {
  return /\b(cod|cash\s*on\s*delivery|delivery\s*pe\s*paisa|डिलीवरी)\b/i.test(transcript)
}
