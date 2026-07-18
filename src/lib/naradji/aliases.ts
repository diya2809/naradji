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

/** Normalize speech/alias text: Parle-G ≈ parle g, collapse spaces. */
export function normalizeSpeech(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Alias map first — returns catalog ids found in the transcript with qty hints.
 *
 * One spoken alias claims one product. Otherwise "Maggi" would match every Maggi
 * SKU in a 400+ CSV catalog. Prefer longer aliases, then rarer aliases, then
 * shorter titles.
 */
export function matchAliases(transcript: string, catalog: LeanProduct[]): AliasMatch[] {
  const text = normalizeSpeech(transcript)
  const matches: AliasMatch[] = []
  const seenIds = new Set<string>()
  const claimedAliases = new Set<string>()

  const titleLen = new Map(catalog.map((p) => [p.id, p.title.length]))

  const rawEntries = catalog.flatMap((p) =>
    [...p.aliases, p.title, p.slug].map((alias) => ({
      id: p.id,
      alias: normalizeSpeech(alias),
    })),
  )

  const aliasFreq = new Map<string, number>()
  for (const e of rawEntries) {
    if (e.alias.length < 2) continue
    aliasFreq.set(e.alias, (aliasFreq.get(e.alias) || 0) + 1)
  }

  const entries = rawEntries
    .filter((e) => e.alias.length >= 2)
    .sort((a, b) => {
      const byAlias = b.alias.length - a.alias.length
      if (byAlias !== 0) return byAlias
      // Prefer rarer aliases (dedicated CSV phrases beat brand collisions)
      const byFreq = (aliasFreq.get(a.alias) || 99) - (aliasFreq.get(b.alias) || 99)
      if (byFreq !== 0) return byFreq
      return (titleLen.get(a.id) || 99) - (titleLen.get(b.id) || 99)
    })

  const qtyAlt = Object.keys(QTY_WORDS).sort((a, b) => b.length - a.length).map(escapeRe).join('|')

  for (const { id, alias } of entries) {
    if (seenIds.has(id) || claimedAliases.has(alias)) continue
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

    seenIds.add(id)
    claimedAliases.add(alias)
    matches.push({ id, qty, matchedAlias: alias })
  }

  return matches
}

export function wantsCOD(transcript: string): boolean {
  return /\b(cod|cash\s*on\s*delivery|delivery\s*pe\s*paisa|डिलीवरी)\b/i.test(transcript)
}
