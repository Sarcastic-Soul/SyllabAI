# TODO

Working list for the polish and hardening pass (branch `polish-and-hardening`).

## Packages
- [x] Upgrade all packages to latest, fix what breaks
- [x] Replace `@google/generative-ai` (deprecated) with `@google/genai`
- [x] Replace `lucide-react` with `@phosphor-icons/react`
- [x] Remove `@tsparticles/*`, `react-parallax-tilt`, `react-intersection-observer` (motion covers it)
- [x] Fix `lint` script (`next lint` no longer exists in Next 16)

## Bugs found on the way
- [x] Embedding models `text-embedding-004` and `embedding-001` no longer exist on the Gemini API, so embeddings return null and document search is silently off. Move to `gemini-embedding-001` at 768 dimensions
- [x] PDF upload cap is 5 MB but Vercel rejects request bodies over 4.5 MB. Lower the cap to 4 MB on client and server

## Backend
- [x] Gemini structured output (`responseSchema`) + Zod check + one repair retry for syllabus, quiz, flashcards
- [x] `generation_logs` table: step, model, tokens in/out, duration, success, error type
- [x] Admin page: tokens, p50/p95 time per step, invalid-output rate
- [x] Smaller chunks (about 1000 chars) and a higher chunk cap
- [x] Hybrid search (Postgres full-text + pgvector, reciprocal rank fusion) in one shared retrieval module
- [x] Retrieval eval: `eval/questions.json`, script, `eval/RESULTS.md` with recall@5 and MRR
- [x] Count query for the free-plan course check
- [x] Remove dead progress route and `lib/queue`

## Code health
- [x] Turn off `ignoreBuildErrors`, fix type errors
- [x] CI: frozen lockfile, lint, typecheck
- [x] Remove leftover template CSS and one-off scripts, rename package

## UI
- [x] Landing page: remove fake stats, cut stacked effects, rebuild hero around the real product
- [x] Fonts: load Bricolage once, add a body font
- [x] Warm-tinted neutrals, one accent
- [x] App screens (dashboard, course, chapter, study buddy, profile, admin): consistent tokens and icons
- [x] Screenshots at 1440px and 390px, fix what looks off

## Needed your OK (given, done)
- [x] Apply the DB migration to Neon
- [x] Run the retrieval eval against Neon (uses Gemini embedding quota)

## Redis removal
- [x] Remove Upstash Redis: no rate limit, no syllabus or embedding cache, daily quota counted from `generation_logs`
- [x] Primary model moved to `gemini-3.8-flash` (fallback stays `gemini-3.5-flash-lite`)

## Left open
- [ ] Look at the signed-in screens in a browser (needs a Clerk login) and run the `impeccable` audit on them
- [ ] Fill in prices in `lib/ai/pricing.ts` if cost in dollars is wanted on the admin page (tokens are shown now)
- [ ] Plan text ("Generate Upto 2 Courses") lives in the Clerk dashboard, fix the wording there
- [ ] TypeScript 7: wait until `typescript-eslint` supports it (pinned to 6.0.3 for now)
- [ ] Two lint warnings: `<img>` in `app/profile/page.tsx`, `useMemo` deps in `components/dashboard/DashboardStats.tsx`
