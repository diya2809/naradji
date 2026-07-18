import type { ShippingAddress } from './uispec'

/** Cues that mark an utterance as address dictation (detection only). */
const ADDRESS_CUE =
  /\b(address|pata|pataa|ghar|deliver|delivery|bhej|ship|pin\s*code|pincode|postal|phone|mobile|number|nagar|road|society|apartment|flat|block)\b|पता|घर|पिन/i

/** Words to strip from the street line — never remove road/nagar/etc (part of addresses). */
const STRIP_FROM_LINE =
  /\b(address|pata|pataa|ghar|deliver|delivery|bhej|ship|pin\s*code|pincode|postal|phone|mobile|number|mera|mere|my|hai|hain|is|please|plz|ji|naam|name)\b|पता|घर|पिन/gi

/** True when utterance looks like an address dictation, not a grocery list. */
export function looksLikeAddress(transcript: string): boolean {
  const t = transcript.trim()
  if (!t) return false
  const pin = t.match(/\b\d{6}\b/)
  const phone = t.match(/(?:\+?91[\s-]*)?[6-9]\d{9}\b/)
  if (ADDRESS_CUE.test(t) && (pin || phone || t.length > 24)) return true
  if (pin && phone) return true
  return false
}

/**
 * Deterministic spoken-address parse (Hinglish).
 * Pattern-based — works across cities; city/state filled when recognized.
 */
export function parseSpokenAddress(transcript: string): ShippingAddress | null {
  if (!looksLikeAddress(transcript)) return null

  const text = transcript.replace(/\s+/g, ' ').trim()
  const phoneMatch = text.match(/(?:\+?91[\s-]*)?([6-9]\d{9})\b/)
  const pinMatch = text.match(/\b(\d{6})\b/)
  const phone = phoneMatch?.[1] ?? null
  const postalCode = pinMatch?.[1] ?? null

  let city: string | null = null
  let state: string | null = null
  const cityMap: { re: RegExp; city: string; state: string }[] = [
    { re: /\bahmedabad\b|\bamdavad\b|\bअमदावाद\b/i, city: 'Ahmedabad', state: 'GJ' },
    { re: /\bsurat\b/i, city: 'Surat', state: 'GJ' },
    { re: /\bvadodara\b|\bbaroda\b/i, city: 'Vadodara', state: 'GJ' },
    { re: /\bmumbai\b|\bbombay\b/i, city: 'Mumbai', state: 'MH' },
    { re: /\bdelhi\b/i, city: 'Delhi', state: 'DL' },
    { re: /\bbengaluru\b|\bbangalore\b/i, city: 'Bengaluru', state: 'KA' },
    { re: /\bhyderabad\b/i, city: 'Hyderabad', state: 'TS' },
    { re: /\bpune\b/i, city: 'Pune', state: 'MH' },
    { re: /\bjaipur\b/i, city: 'Jaipur', state: 'RJ' },
    { re: /\bkolkata\b/i, city: 'Kolkata', state: 'WB' },
    { re: /\bchennai\b/i, city: 'Chennai', state: 'TN' },
  ]
  for (const c of cityMap) {
    if (c.re.test(text)) {
      city = c.city
      state = c.state
      break
    }
  }

  // Strip meta cues / phone / pin for the street line (keep Road, Nagar, etc.)
  let line = text
    .replace(STRIP_FROM_LINE, ' ')
    .replace(/(?:\+?91[\s-]*)?[6-9]\d{9}\b/g, ' ')
    .replace(/\b\d{6}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (city) {
    line = line.replace(new RegExp(`\\b${city}\\b`, 'i'), ' ').replace(/\s+/g, ' ').trim()
  }
  line = line.replace(/^[,.\-\s]+|[,.\-\s]+$/g, '').trim()

  if (!line && !phone && !postalCode) return null

  return {
    name: 'Voice customer',
    phone,
    addressLine1: line || (city ? `${city} delivery` : 'Voice address'),
    addressLine2: null,
    city: city || 'Ahmedabad',
    state: state || 'GJ',
    postalCode: postalCode || '380001',
    country: 'IN',
  }
}

export function addressReadback(shipping: ShippingAddress): string {
  const parts = [
    shipping.addressLine1,
    shipping.city,
    shipping.postalCode,
    shipping.phone ? `phone ${shipping.phone}` : null,
  ].filter(Boolean)
  return `Address note kiya: ${parts.join(', ')}. Ab haan pakka boliye.`
}
