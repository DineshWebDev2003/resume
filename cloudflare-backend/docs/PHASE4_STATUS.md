# Phase 4 Status (integration scaffolding)

## Mobile app (Expo) — additive, default-safe
- **No existing UI/navigation/native config changes.** No Expo SDK upgrade, no EAS/native file changes.
- Added provider switch in `constants/config.ts`:
  - `API_PROVIDER: "existing" | "cloudflare"` (**default `existing`**)
  - `CLOUDFLARE_API_BASE_URL` (local default placeholder)
  - `CLOUDFLARE_MIGRATION_TOKEN` (testing only; empty by default)
- Added Axios-based Cloudflare client: `services/cloudflareBackend.ts` (`cloudflareGraphQL`, temp upload, process).
- ATS screen integration (`app/builder/ats.tsx`): when `API_PROVIDER=cloudflare`, it attempts the Cloudflare temp-upload lifecycle **after analysis**:
  1. `createResumeUpload` (GraphQL)
  2. `POST /uploads/:id/file` (temporary R2; original file still stays on device)
  3. `POST /uploads/:id/process` (persist result; backend deletes temp R2 in `finally`)
  - On Cloudflare path failure it logs a warning and **continues with existing local/Firebase history behavior** (rollback-safe during migration testing).

## Cloudflare backend (Phase 4 testing support)
- `src/middleware/auth.ts`: supports **explicit migration testing token** only when both `MIGRATION_BEARER_TOKEN` and `MIGRATION_USER_ID` are set. Default remains fail-closed.
- `.dev.vars.example` includes migration token vars (disabled by default).
- **Production must replace this with Better Auth session validation** and keep migration token disabled.

## Required for end-to-end Phase 4 testing
1. `cd cloudflare-backend && npm install && npm run db:migrate:local && npm run dev`
2. Set `.dev.vars` migration token/user id (testing only) and create/migrate D1.
3. Set `API_PROVIDER='cloudflare'` and matching `CLOUDFLARE_MIGRATION_TOKEN`/base URL in `constants/config.ts` (or move to approved config mechanism).
4. Run existing Expo debug build; verify ATS scan, history, and that Cloudflare backend stores ATS metadata in D1 and removes temp R2 objects.

## Not approved/done
- No production switch. Default remains `existing`.
- No removal of Firebase/existing backend.
- Better Auth production wiring, server-side ATS extraction, and full automated test execution remain follow-ups.
