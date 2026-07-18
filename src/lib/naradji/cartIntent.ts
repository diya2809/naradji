import { normalizeSpeech } from './aliases'
import type { UISpec } from './uispec'

/** How this utterance should change the cart. Folded into UISpec as data. */
export type CartOp = 'add' | 'remove' | 'replace' | 'clear'

export type CartLine = UISpec['items'][number]

const CLEAR_RE =
  /\b(clear\s*cart|empty\s*cart|cart\s*clear|cart\s*khali|sab\s*hata|sab\s*nikal|pura\s*cart\s*hata|खाली|साफ)\b/i

const REMOVE_RE =
  /\b(hata|hatao|hata\s*do|hata\s*dena|nikal|nikalo|nikal\s*do|remove|delete|mat\s*chahiye|nahi\s*chahiye|नहीं\s*चाहिए|ना\s*जोईए|kaato|काटो|हटा|हटाओ|हटा\s*दो|निकाल)\b/i

const REPLACE_RE =
  /\b(sirf\s*(yeh|yahi|ye)|only\s*(this|these|that)|bas\s*(yeh|yahi)|replace|badal\s*do|नया\s*list)\b/i

/**
 * Classify cart intent from speech before alias matching.
 * Remove/negation must win over bare product mentions (otherwise "doodh hata do" becomes add).
 */
export function detectCartOp(transcript: string): CartOp {
  const t = normalizeSpeech(transcript)
  if (!t) return 'add'
  if (CLEAR_RE.test(t)) return 'clear'
  if (REMOVE_RE.test(t)) return 'remove'
  if (REPLACE_RE.test(t)) return 'replace'
  return 'add'
}

/** Apply a cart op to the session cart. `next` is the utterance's target ids. */
export function applyCartOp(prev: CartLine[], next: CartLine[], op: CartOp): CartLine[] {
  switch (op) {
    case 'clear':
      return []
    case 'replace':
      return next.map((i) => ({ ...i, qty: Math.max(1, i.qty || 1) }))
    case 'remove': {
      const removeIds = new Set(next.map((i) => i.id))
      return prev.filter((i) => !removeIds.has(i.id))
    }
    case 'add': {
      const map = new Map(prev.map((i) => [i.id, { ...i }]))
      for (const item of next) {
        const existing = map.get(item.id)
        const qty = Math.max(1, item.qty || 1)
        if (existing) {
          map.set(item.id, { ...existing, qty: (existing.qty || 1) + qty })
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
