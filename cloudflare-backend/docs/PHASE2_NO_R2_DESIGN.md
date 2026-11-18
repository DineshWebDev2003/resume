# Phase 2 — No-R2 Cloudflare Backend Design (Approved)

**Scope:** Backend architecture/schema/GraphQL design prepared separately. **No existing Expo app source files modified.**  
**Objective:** Cloudflare Worker + Hono + D1 + GraphQL (Axios client). **No R2, no Supabase Storage, no server-side resume file storage, no binaries in D1.**

## Architecture
- `POST /graphql` (Hono + GraphQL Yoga): authenticated, ownership-enforced resolvers, Zod validation, query depth/alias limits, pagination caps.
- `/api/auth/*` (self-hosted Better Auth scaffold, D1/Kysely) — must reconcile Better Auth CLI migrations with `better-auth` version before production.
- AI analysis runs **in Worker** using server-side secret `AI_API_KEY` (Groq/Gemini supported in `src/lib/ai.ts`); API key never exposed to mobile.
- **No upload endpoints, no R2 bindings, no cron cleanup.** `wrangler.jsonc` binds only D1.

## Data flow (target)
1. User selects PDF/DOCX on device; app extracts text locally (SDK-compatible; verify before install).
2. App sends extracted text + metadata via GraphQL `submitAtsAnalysis` (Axios). Optional `storeExtractedText=false` by default.
3. Worker validates/rate-limits, calls AI, persists metadata/results to D1, returns ATS score/analysis/missing keywords/skills/suggestions/job compatibility.
4. Original resume remains on device; local URI/ref stored in local app storage only. Previous reports fetched from D1 and opened from device (prompt reselect if missing).

## D1 schema
- `migrations/0001_initial.sql`: Better Auth baseline tables (retain; verify compatibility).
- `migrations/0002_no_r2_schema.sql`: drops prior R2/temp tables (`temporary_uploads`,`ats_jobs`,`resumes`) and creates app tables:
  - `users`, `resume_records`, `ats_reports`, `job_descriptions`, `job_matches`, `application_history`, `usage_limits`
- `resume_records.extracted_text` stored only when explicitly requested (`storeExtractedText=true`); hash stored for dedupe/integrity signals. No binary fields.

## GraphQL (implemented scaffold)
- **Queries:** `health`, `me`, `atsReport(id)`, `atsReports(limit,offset)`, `resumeRecord(id)`, `resumeRecords(limit,offset)`, `usageStatus(periodKey)`
- **Mutations:** `submitAtsAnalysis(input)`, `upsertResumeRecord(input)`
- `submitAtsAnalysis` input includes `resumeName`, `fileType`, `fileSize`, `clientResumeId`, `extractedText` (required, capped), optional `jobTitle/company/jobDescription/sourceUrl`, `storeExtractedText`.
- Result: report scores/analysis/missingKeywords/skillsAnalysis/improvementSuggestions/jobCompatibilityScore + resume record metadata.

## Security & limits
- Auth required + user ownership on all user data; request/field size caps in Zod; depth/alias limits; daily usage counter guard in D1 (`usage_limits`) + recommend Cloudflare WAF/rate limiting in prod.
- No logging of resume contents/secrets. Extracted text minimized in storage.

## Deployment notes
- Set real `database_id` in `wrangler.jsonc` (done: `ff4ed118-f399-47a3-869f-459a7e7d2e72`). Apply migrations: `0001` applied remotely earlier; **apply `0002_no_r2_schema`** before using no-R2 API (`wrangler d1 migrations apply ... --remote`).
- Secrets: `AI_API_KEY`, `AI_PROVIDER` (`groq`/`gemini`), `AI_MODEL` (optional), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- `tsc --noEmit` passes in `cloudflare-backend/`.

## Phase 3/4 follow-ups (pending approval)
- Apply/reconcile D1 migrations in target env, configure secrets, deploy and test APIs.
- Integrate mobile via existing Axios with `API_PROVIDER` switch (default `existing`), local PDF/DOCX extraction, send text only; preserve UI/nav; handle missing local originals.
- Do not switch production or remove existing backend without full testing and approval.
