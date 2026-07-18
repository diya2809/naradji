# Naradji — How we build this (step by step)

Small commits on **`main` only**, after every logical step, so the git history
reads like a story. This file is the human-readable version of that story.

**Product one-liner:** Speak a grocery list in Gujarati/Hinglish → the storefront
morphs → COD order with “haan pakka”.

---

## Why many commits?

| Rule | Why |
|------|-----|
| Commit after each step | Easy to understand, demo, or roll back one piece |
| Stay on `main` | Hackathon speed — no branch juggling |
| Never commit `.env` | Secrets stay local |
| Author as **Diya Shah** (`shahdiya304@gmail.com`) | Repo is diya2809/naradji — not challengerate/srjay |

Recent trail (newest first):

```
fix: make UISpec OpenAI structured-output safe
feat: switch interpret LLM to OpenAI gpt-4o-mini
chore: relax pnpm release-age/deps checks
fix: parse “ek dozen” as qty 12
feat: Naradji voice morph storefront on Payload
chore: scaffold Payload ecommerce at repo root (MongoDB)
Initial public repo…
```

---

## Steps

### 1. Decide the goal
**Status:** done

- Spine: one spoken grocery list + one hard confirm (“haan pakka”) = full order.
- Bet: the **store itself** is the agent (UI morphs), not a chat sidecar.
- Skills used earlier: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`.
- Lock layout at repo root (`cursor-ahm`), MongoDB Atlas DB `cursor-ahm`, localhost demo first.

### 2. Scaffold with Payload ecommerce (Payload skill)
**Status:** done · commit `chore: scaffold Payload ecommerce…`

```bash
pnpx create-payload-app@latest cursor-ahm \
  -t ecommerce \
  --db mongodb \
  --db-connection-string "$DATABASE_URL" \
  --use-pnpm --no-agent
```

- Merge into repo root (keep `.git`, skills, planning docs).
- MongoDB + local media storage.
- Free `/admin` for the “order appeared” reveal beat.
- Skill: **payload** (collections, Local API, drafts, access control gotchas).

### 3. Env + hide Stripe (COD only)
**Status:** done

- `.env`: `DATABASE_URL`, `PAYLOAD_SECRET`, later `SARVAM_API_KEY`, `OPENAI_API_KEY`.
- Redirect `/checkout` → home; leave Stripe packages installed but unused.
- Payment path = COD only.

### 4. Seed 12 grocery SKUs + aliases
**Status:** done · `pnpm seed:naradji`

- Products get `aliases[]` + `unit` (voice matching).
- In-memory catalog (`lib/naradji/catalog.ts`) loads once; fallback list if DB is cold.
- **Rule:** Payload only at load time + order confirm — never per utterance.

### 5. Define the UISpec contract first
**Status:** done · Vitest covers this

- Zod schema: language, one `naradji_line`, layouts `grid | express | confirm`, items, prefill, patch.
- Use `.nullable()` (not `.optional()`); avoid `.default()` so OpenAI structured outputs accept the schema.
- Skill: **ai-sdk** for `generateObject` / `streamObject`.

### 6. Alias-first matching + interpret API
**Status:** done

- `matchAliases(transcript, catalog)` runs first (Hinglish qty words: do, paanch, dozen…).
- LLM (`gpt-4o-mini` via `@ai-sdk/openai`) fills gaps against catalog ids only.
- Offline fallback if the LLM key/call fails — demo never dies.
- Route: `POST /api/interpret`.

### 7. Morphing storefront UI
**Status:** done

- `StoreCanvas` + archetypes `Grid` / `Express` / `Confirm`.
- Framer Motion `layout` so items glide between layouts.
- Fixed anchors: brand + cart total; mic pill at bottom.
- Skill: **vercel-react-best-practices** (no waterfalls on hot path, thin client props).

### 8. Voice in — Sarvam STT (speech-to-text skill)
**Status:** done

- Browser `MediaRecorder` → `audio/webm` → `POST /api/stt`.
- Sarvam Saaras `saaras:v3`, mode `codemix`.
- Safety: `/?demo=1` or “Demo grocery breath” injects a known transcript.
- Skill: **speech-to-text** / **voice-agents** (JS uses SDK methods directly).

### 9. Hard confirm + COD order
**Status:** done

- Client regex on `haan pakka` / `confirm` (never order from inference alone).
- `POST /api/order` → Payload `orders` create; show in `/admin`.
- Optimistic UI so the demo feels instant.

### 10. Voice out — Sarvam TTS (text-to-speech skill)
**Status:** done

- `POST /api/tts` → Bulbul `bulbul:v3`, speaker `shubh`.
- Speaks only `uispec.naradji_line`, **after** morph starts — never blocks UI.
- Skill: **text-to-speech**.

### 11. Contract tests (3 + OpenAI safety)
**Status:** done · `pnpm test:unit`

1. UISpec parse / reject stretch layouts  
2. Alias map + qty words  
3. Confirm regex  
4. (extra) qty required for OpenAI structured outputs  

Skip heavy E2E for day one.

### 12. Rehearse the demo script
**Status:** in progress / your turn

1. Open `/` — normal shelf + mic pill.  
2. “Demo grocery breath” or speak the list.  
3. Store → express (items + COD).  
4. “haan pakka” → order id → open `/admin`.  
5. Optional: Gujarati line → mirrored language + TTS.

### 13. Optional stretch (only if core is buttery)
**Status:** deferred · see `TODOS.md`

- Mission/gift morph, streaming STT WebSocket, Vercel deploy, bargain/memory, Stripe live.

---

## Skills map (when we used what)

| Skill | Used for |
|-------|----------|
| **payload** | Ecommerce template, Products/Orders, seed, Local API |
| **ai-sdk** | `generateObject` / `streamObject`, OpenAI provider |
| **speech-to-text** | Sarvam Saaras STT proxy |
| **text-to-speech** | Sarvam Bulbul TTS proxy |
| **chat** / **translate** | Available if we need Sarvam LLM/translate later |
| **voice-agents** | Pattern guidance (JS = individual SDK calls) |
| **vercel-react-best-practices** | Store UI / Next data path |
| **gstack** (`/office-hours`, reviews) | Goal, scope, eng locks before coding |

---

## Run it locally

```bash
pnpm install --config.minimum-release-age=0
# .env: DATABASE_URL, PAYLOAD_SECRET, SARVAM_API_KEY, OPENAI_API_KEY
pnpm seed:naradji   # once
pnpm dev            # http://localhost:3000  ·  /admin
pnpm test:unit
```

---

## Hot-path reminder

```
mic → /api/stt → alias + /api/interpret → StoreCanvas morph → /api/tts (last)
                                                      ↓
                                              haan pakka → /api/order
```

Payload is **not** on the morph hot path.
