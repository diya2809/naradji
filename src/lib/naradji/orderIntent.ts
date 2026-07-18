import { normalizeSpeech } from './aliases'

const PLACE_ORDER_PATTERN =
  /(?:^|[^\p{L}\p{N}])(?:place\s*(?:the\s*)?order|order\s*(?:place|karo|kar\s*do|karjo)|checkout\s*karo|haan\s*pakka|ઓર્ડર\s*કરો|ऑर्डर\s*करो)(?=$|[^\p{L}\p{N}])/iu

/** Explicit order command only. Product phrases never place money-moving orders. */
export function isPlaceOrderTranscript(transcript: string): boolean {
  return PLACE_ORDER_PATTERN.test(normalizeSpeech(transcript))
}
