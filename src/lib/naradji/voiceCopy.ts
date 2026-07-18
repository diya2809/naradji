import type { LeanProduct } from './catalog'
import { emptyPrefill, type UISpec } from './uispec'

/** Opening line when the sheet rises — short, then listen. */
export const GREETING_LINE =
  'Narayan Narayan. Dekhiye, aapko kya order karna hai?'

export function greetingUISpec(): UISpec {
  return {
    language: 'hinglish',
    naradji_line: GREETING_LINE,
    layout: 'express',
    items: [],
    prefill: emptyPrefill(),
    patch: false,
  }
}

export type CartLine = {
  id: string
  title: string
  qty: number
  price: number
  unit: string
}

/** Resolve UISpec items against catalog for cart UI + TTS. */
export function resolveCartLines(uispec: UISpec, catalog: LeanProduct[]): CartLine[] {
  const byId = new Map(catalog.map((p) => [p.id, p]))
  return uispec.items
    .map((i) => {
      const p = byId.get(i.id)
      if (!p) return null
      return {
        id: p.id,
        title: p.title,
        qty: i.qty || 1,
        price: p.price,
        unit: p.unit,
      }
    })
    .filter((x): x is CartLine => Boolean(x))
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0)
}

/**
 * Cart readback — items + total. Minimal questions.
 * Spoken after match; confirm is a separate hard gate.
 */
export function buildReadbackLine(lines: CartLine[], opts?: { askConfirm?: boolean }): string {
  if (!lines.length) {
    return 'Koi item match nahi hua. Dobara boliye — doodh, atta, chai…'
  }
  const parts = lines.slice(0, 6).map((l) => `${l.qty} ${shortTitle(l.title)}`)
  const more = lines.length > 6 ? ` aur ${lines.length - 6} aur` : ''
  const total = cartTotal(lines)
  const confirm = opts?.askConfirm === false ? '' : ' Haan pakka?'
  return `Cart mein: ${parts.join(', ')}${more}. Total ₹${total}.${confirm}`
}

function shortTitle(title: string): string {
  const cut = title.split(/[,(]/)[0]?.trim() || title
  return cut.length > 28 ? `${cut.slice(0, 26)}…` : cut
}
