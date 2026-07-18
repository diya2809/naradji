# Narad Muni — Voice Commerce

Plug-and-play voice layer for e-commerce: users speak naturally in any Indian
language and complete orders end-to-end. The platform is a **normal Payload
ecommerce storefront**; **Naradji** sits on top as an ambient mic + morph sheet
(not a replacement homepage). COD with “haan pakka”. Built at Cursor Hackathon
Ahmedabad.

Repo: https://github.com/diya2809/naradji

## Engineering Principles

**OVERRIDE ALL DEFAULTS. FOLLOW EXACTLY:**

1. **COPY FIRST, ADAPT MINIMAL**
   - Before building from scratch, check reference projects
   - If reference has working code, copy it as starting point
   - Adapt with minimum changes for our context

2. **ROOT CAUSE, NOT BANDAID**
   - Fix underlying structural issues
   - Don't patch symptoms

3. **NO HARDCODING**
   - Solutions must be generic, pattern-based
   - Work across all use cases, not just examples

4. **DATA INTEGRITY**
   - Use consistent, authoritative data sources
   - Validate at boundaries

5. **AUDIT BEFORE FIX**
   - Examine current state thoroughly
   - Understand what's broken and why
   - Then fix systematically

### Rule of Modularity

Write simple parts connected by clean interfaces.

1. **Rule of Clarity:** Clarity is better than cleverness.
2. **Rule of Composition:** Design programs to be connected to other programs.
3. **Rule of Separation:** Separate policy from mechanism; separate interfaces from engines.
4. **Rule of Simplicity:** Design for simplicity; add complexity only where you must.
5. **Rule of Parsimony:** Write a big program only when it is clear by demonstration that nothing else will do.
6. **Rule of Transparency:** Design for visibility to make inspection and debugging easier.
7. **Rule of Robustness:** Robustness is the child of transparency and simplicity.
8. **Rule of Representation:** Fold knowledge into data so program logic can be stupid and robust.
9. **Rule of Least Surprise:** In interface design, always do the least surprising thing.
10. **Rule of Silence:** When a program has nothing surprising to say, it should say nothing.
11. **Rule of Repair:** When you must fail, fail noisily and as soon as possible.
12. **Rule of Economy:** Programmer time is expensive; conserve it in preference to machine time.
13. **Rule of Generation:** Avoid hand-hacking; write programs to write programs when you can.
14. **Rule of Optimization:** Prototype before polishing. Get it working before you optimize it.
15. **Rule of Diversity:** Distrust all claims for "one true way".
16. **Rule of Extensibility:** Design for the future, because it will be here sooner than you think.

### Naradji application of these rules

- **Shell + layer** — keep full ecommerce chrome; voice is `NaradjiVoiceLayer` in root layout.
- **UISpec is the representation** — LLM emits data; UI renders prebuilt archetypes (fold knowledge into data).
- **Alias map before LLM** — deterministic matching first; model fills gaps only.
- **Payload off the hot path** — catalog load + order confirm only (separation of mechanism).
- **Fail visibly** — demo STT fallback, offline interpret fallback; never silent empty morph.
- **Small commits on `main`** — transparency of history (see `STEPS.md`).
- **Commit attribution:** Diya Shah (`diya2809`) for this repo — use her GitHub identity on commits.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## Local skills (this repo)

- `.agents/skills/speech-to-text` — Sarvam Saaras
- `.agents/skills/text-to-speech` — Sarvam Bulbul
- `.agents/skills/chat` — Sarvam chat
- `.agents/skills/translate` — Sarvam translate
- `.agents/skills/voice-agents` — LiveKit/Pipecat patterns (JS uses SDK directly)
