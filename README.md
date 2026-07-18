# Naradji (cursor-ahm)

Voice-morphing Indian daily-needs storefront for Cursor Hackathon Ahmedabad.

Speak a grocery list → store morphs → COD with **haan pakka**.

## Quick start

```bash
pnpm install --config.minimum-release-age=0
cp .env.example .env   # set DATABASE_URL, PAYLOAD_SECRET, SARVAM_API_KEY, ANTHROPIC_API_KEY
pnpm dev
# optional: seed 12 grocery SKUs into Mongo
pnpm seed:naradji
```

Open [http://localhost:3000](http://localhost:3000) — or `/?demo=1` for STT fallback.

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Demo path

1. Click **Demo grocery breath** (or hold the mic)
2. Store morphs to express list + COD
3. Say / click **haan pakka**
4. Order appears in `/admin` → Orders

## Tests

```bash
pnpm test:unit   # UISpec + aliases + confirm regex
```

Built on Payload ecommerce + Vercel AI SDK + Sarvam (Saaras STT / Bulbul TTS).
