# Resume ATS — Cloudflare Backend (No R2, D1 + GraphQL)

Separate backend track for **no-R2 / no server-side resume file storage** migration.

## Hard rules implemented by design
- **No R2 / no file uploads / no binary storage in D1.** Original resumes stay on device.
- Client extracts text locally, then sends **extracted text + metadata** to GraphQL (`submitAtsAnalysis`).
- Worker calls AI provider securely (server-side `AI_API_KEY`) and stores results/metadata in D1.
- Auth/ownership checks, Zod validation, body/field limits, query depth/alias limits, basic usage guard.

## Stack
- Cloudflare Worker + Hono
- D1 (`migrations/0001_initial.sql` Better Auth baseline, `migrations/0002_no_r2_schema.sql` no-R2 app schema)
- GraphQL Yoga at `/graphql` (use existing Axios from app)
- Self-hosted Better Auth scaffold at `/api/auth/*` (D1/Kysely) — verify schema/version compatibility before production

## Key GraphQL operations
- `submitAtsAnalysis(input)` — accepts extracted text, runs server AI, persists `resume_records`, `job_descriptions`, `ats_reports`, increments `usage_limits`
- `atsReports`, `atsReport`, `resumeRecords`, `resumeRecord`, `usageStatus`

## Setup
```bash
cd cloudflare-backend
npm install
# set real D1 database_id in wrangler.jsonc
npx wrangler d1 migrations apply resume_ats_db --remote
npx wrangler secret put AI_API_KEY
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler deploy
```
> Run the Better Auth CLI generate/migrate for your installed `better-auth` version and reconcile with D1 schema before enabling production auth.

## Notes
- `extracted_text` is **not stored** by default (`storeExtractedText=false`) to minimize sensitive data/cost; only metadata/hash/results stored unless explicitly required.
- Never log resume contents or secrets. Apply Cloudflare rate limiting/WAF in production.
- Existing Expo/Firebase app remains untouched/default until approved integration switch.

## Safety rules (non-negotiable)

- Original resumes remain on the user's device; **never** permanently store resume binaries on the server.
- R2 is for **temporary** ATS uploads only; delete after processing (and on failure paths).
- ATS scores/analysis persist in D1; results remain available after temp file deletion.
- Store only a client-generated local device reference ID server-side if needed — **not** raw device URIs/paths.

## Setup

```bash
cd cloudflare-backend
npm install
cp .dev.vars.example .dev.vars
# set D1 database_id in wrangler.jsonc (wrangler d1 create resume_ats_db)
npx wrangler d1 migrations apply resume_ats_db --local
npm run dev
```

## D1 migrations

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

Review `migrations/0001_initial.sql` against the exact Better Auth version/migration output you deploy; do not duplicate/conflict auth tables.

## GraphQL (examples)

`POST /graphql` (JSON body, same shape Axios uses). Protected fields require authenticated context (Phase 4 wiring).

```graphql
query { health }
```

## Environment / secrets

Configure via Wrangler secrets/vars (never commit): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google OAuth secrets (if used), AI secrets for server-side ATS (Phase 3). Bindings: `DB` (D1), `TEMP_UPLOADS` (R2).

## Rollback

Keep `API_PROVIDER=existing` (default) in the mobile app until Phase 4 testing is complete and production switch is explicitly approved. This Worker can be deployed independently without affecting the existing Firebase backend.
