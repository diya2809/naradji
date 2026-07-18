/** Hard confirm for money. Never place order from inference alone. */
const CONFIRM_RE =
  /\b(haan\s*pakka|han\s*pakka|haa[nṁ]\s*pakka|हाँ\s*पक्का|हां\s*पक्का|confirm|confirmed|place\s*order|order\s*karo)\b/i

export function isConfirmTranscript(transcript: string): boolean {
  return CONFIRM_RE.test(transcript.trim())
}
