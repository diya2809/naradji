# Naradji (cursor-ahm)

**Normal Payload ecommerce storefront + Naradji voice layer on top.**

Browse `/`, `/shop`, `/products`, cart, and checkout as usual. Hold the mic (or
use Demo grocery breath) and the store morphs a voice cart sheet → COD with
**haan pakka**.

Build story (every step + skills): see [`STEPS.md`](./STEPS.md).

## Quick start

```bash
pnpm install --config.minimum-release-age=0
cp .env.example .env   # DATABASE_URL, PAYLOAD_SECRET, SARVAM_API_KEY, OPENAI_API_KEY
pnpm seed:naradji      # 12 grocery SKUs + aliases
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — shop as normal.
Add `?demo=1` for STT fallback. Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Architecture

```
Payload ecommerce shell (Header, Footer, CMS pages, /shop, /checkout)
  + NaradjiVoiceLayer (MicPill + morph sheet Express/Confirm)
```

Voice never replaces the homepage. It overlays every storefront route (not `/admin`).

## Demo path

1. Open `/` — see the normal store + ambient mic
2. Click **Demo grocery breath** (or hold the mic)
3. Morph sheet → express list + COD
4. Say / click **haan pakka**
5. Order appears in `/admin` → Orders

## Tests

```bash
pnpm test:unit   # UISpec + aliases + confirm regex
```

Built on Payload ecommerce + Vercel AI SDK (`gpt-4o-mini`) + Sarvam (Saaras STT / Bulbul TTS).
