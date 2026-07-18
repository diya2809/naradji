import type { LeanProduct } from './catalog'

const QTY_WORDS: Record<string, number> = {
  ek: 1,
  ekam: 1,
  one: 1,
  a: 1,
  એક: 1,
  एक: 1,
  be: 2,
  do: 2,
  two: 2,
  બે: 2,
  दो: 2,
  tran: 3,
  teen: 3,
  three: 3,
  ત્રણ: 3,
  तीन: 3,
  char: 4,
  chaar: 4,
  four: 4,
  ચાર: 4,
  चार: 4,
  paanch: 5,
  panch: 5,
  five: 5,
  પાંચ: 5,
  पांच: 5,
  पाँच: 5,
  chhe: 6,
  chha: 6,
  six: 6,
  છ: 6,
  छह: 6,
  saat: 7,
  seven: 7,
  સાત: 7,
  सात: 7,
  aath: 8,
  eight: 8,
  આઠ: 8,
  आठ: 8,
  nav: 9,
  nau: 9,
  nine: 9,
  નવ: 9,
  नौ: 9,
  das: 10,
  ten: 10,
  દસ: 10,
  दस: 10,
  dozen: 12,
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
    .replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)))
    .replace(/[૦-૯]/g, (digit) => String('૦૧૨૩૪૫૬૭૮૯'.indexOf(digit)))
    .replace(/[-_./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const COUNT_UNIT =
  'kilo|kg|packet|packets|pack|packs|piece|pieces|bottle|bottles|unit|units|dabba|dabbe'

function quantityNearAlias(
  text: string,
  aliasStart: number,
  aliasEnd: number,
  qtyAlt: string,
): number {
  const left = text.slice(Math.max(0, aliasStart - 50), aliasStart)

  // "ek dozen anda" → 12; kilo/kg are count units ("do kilo atta" → 2).
  if (/(?:^|[^\p{L}\p{N}])(?:ek|one|a|એક|एक)?\s*dozen\s*$/iu.test(left)) {
    return 12
  }

  const before = left.match(
    new RegExp(
      `(?:(\\d+)(?=$|[^\\p{L}\\p{N}])|(?:^|[^\\p{L}\\p{N}])(${qtyAlt})(?=$|[^\\p{L}\\p{N}]))(?:\\s+(?:${COUNT_UNIT}))?\\s*$`,
      'iu',
    ),
  )
  if (before?.[1]) return Number(before[1])
  if (before?.[2]) return QTY_WORDS[before[2].toLowerCase()] || 1

  // Natural speech often puts count after the item: "milk 2", "atta 3 packets".
  const right = text.slice(aliasEnd, Math.min(text.length, aliasEnd + 50))
  const after = right.match(
    new RegExp(
      `^\\s*(?:x\\s*)?(?:(\\d+)(?=$|[^\\p{L}\\p{N}])|(${qtyAlt})(?=$|[^\\p{L}\\p{N}]))(?:\\s+(?:${COUNT_UNIT}))?`,
      'iu',
    ),
  )
  if (after?.[1]) return Number(after[1])
  if (after?.[2]) return QTY_WORDS[after[2].toLowerCase()] || 1

  return 1
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
  const matches: Array<AliasMatch & { at: number }> = []
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
    const found = re.exec(text)
    if (!found) continue

    const at = found.index + found[0].indexOf(alias)
    const qty = quantityNearAlias(text, at, at + alias.length, qtyAlt)

    seenIds.add(id)
    claimedAliases.add(alias)
    matches.push({ id, qty, matchedAlias: alias, at })
  }

  return matches
    .sort((a, b) => a.at - b.at)
    .map(({ id, qty, matchedAlias }) => ({ id, qty, matchedAlias }))
}

export function wantsCOD(transcript: string): boolean {
  return /\b(cod|cash\s*on\s*delivery|delivery\s*pe\s*paisa|डिलीवरी)\b/i.test(transcript)
}
