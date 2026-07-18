import { normalizeSpeech } from './aliases'
import type { UISpec } from './uispec'

/** How this utterance should change the cart. Folded into UISpec as data. */
export type CartOp = 'add' | 'remove' | 'replace' | 'clear'

export type CartLine = UISpec['items'][number]

/** Clamp once at the cart boundary — session + Payload must share this. */
export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1
  return Math.max(1, Math.min(99, Math.round(qty)))
}

/** Unicode-aware word match (JS \\b breaks on Devanagari). */
function hasPhrase(text: string, pattern: string): boolean {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${pattern})(?=$|[^\\p{L}\\p{N}])`, 'iu').test(text)
}

const CLEAR_PATTERN =
  'clear\\s*cart|empty\\s*cart|cart\\s*clear|cart\\s*khali|sab\\s*hata|sab\\s*nikal|pura\\s*cart\\s*hata|खाली|साफ'

const REMOVE_PATTERN =
  'hata|hatao|hata\\s*do|hata\\s*dena|nikal|nikalo|nikal\\s*do|remove|delete|mat\\s*chahiye|nahi\\s*chahiye|नहीं\\s*चाहिए|ना\\s*जोईए|kaato|काटो|हटा|हटाओ|हटा\\s*दो|निकाल'

/** "sirf chai chahiye" / "only tea" — not only "sirf yeh". */
const REPLACE_PATTERN =
  'sirf|only|bas\\s*(yeh|yahi|ye|yehi)|replace|badal\\s*do|नया\\s*list'

/** Bare refusal with no product — must clarify, never invent an add. */
const BARE_NEGATION = /^(nahi|na|no|नहीं|ना|Nope)$/iu

/**
 * Classify cart intent from speech before alias matching.
 * Remove/negation must win over bare product mentions (otherwise "doodh hata do" becomes add).
 */
export function detectCartOp(transcript: string): CartOp {
  const t = normalizeSpeech(transcript)
  if (!t) return 'add'
  if (hasPhrase(t, CLEAR_PATTERN)) return 'clear'
  if (hasPhrase(t, REMOVE_PATTERN)) return 'remove'
  if (hasPhrase(t, REPLACE_PATTERN)) return 'replace'
  return 'add'
}

/** True when the utterance is only a bare "no" — not a cart command. */
export function isBareNegation(transcript: string): boolean {
  const t = normalizeSpeech(transcript).trim()
  return BARE_NEGATION.test(t)
}

/** Apply a cart op to the session cart. `next` is the utterance's target ids. */
export function applyCartOp(prev: CartLine[], next: CartLine[], op: CartOp): CartLine[] {
  switch (op) {
    case 'clear':
      return []
    case 'replace':
      return next.map((i) => ({ ...i, qty: clampQty(i.qty || 1) }))
    case 'remove': {
      const removeIds = new Set(next.map((i) => i.id))
      return prev.filter((i) => !removeIds.has(i.id))
    }
    case 'add': {
      const map = new Map(prev.map((i) => [i.id, { ...i, qty: clampQty(i.qty || 1) }]))
      for (const item of next) {
        const existing = map.get(item.id)
        const qty = clampQty(item.qty || 1)
        if (existing) {
          map.set(item.id, { ...existing, qty: clampQty((existing.qty || 1) + qty) })
        } else {
          map.set(item.id, { ...item, qty })
        }
      }
      return [...map.values()]
    }
    default:
      return prev
  }
}
