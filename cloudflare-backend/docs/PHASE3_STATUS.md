# Phase 3 Status (Cloudflare backend only)

Implemented in `cloudflare-backend/` with **no changes to the existing Expo/Firebase app**.

## Temporary R2 upload + ATS result persistence + mandatory cleanup

### Endpoints (authenticated, owner-scoped)
- `POST /uploads/:uploadId/file` — accepts `multipart/form-data` (`file`) or raw bytes; validates upload session ownership/expiry/type/size; stores bytes in **private R2** key from the session; marks `uploaded`. No resume contents logged.
- `POST /uploads/:uploadId/process` — accepts ATS result payload `{ score, analysis?, jobTitle?, jobDescription? }` (for migration compatibility with current client/AI analysis); persists ATS result/job to **D1**, then **always attempts R2 deletion in `finally`**.
  - Success: result saved + temp object deleted → `200 { ok:true, tempFileDeleted:true }`
  - Result saved but delete failed: status recorded as `delete_failed` → `202 { ok:false, resultSaved:true, tempFileDeleted:false }` (scheduled retry)
  - Processing failed: cleanup still attempted; failure recorded → `500`
- `POST /uploads/:uploadId/cleanup` — manual/idempotent delete attempt for an owned upload session.

### GraphQL
- `createResumeUpload` now returns the implemented upload/process flow note.
- ATS/result persistence remains available via GraphQL mutations where appropriate; HTTP upload/process endpoints handle binary upload and the critical delete lifecycle.

### Deletion guarantees / hardening
- `src/lib/tempUpload.ts`: `deleteTempR2Object` is idempotent-ish, records attempts/errors, sets `deleted` only after successful R2 delete.
- `src/lib/cleanup.ts` + cron: retries `delete_failed`/expired/processed-not-deleted rows (bounded batch).
- **Never** permanently store original resume files in R2/D1. **Never** log resume contents.

## Deferred / follow-ups
- Replace/augment `process` payload with true server-side ATS extraction/scoring (Workers-compatible PDF/DOCX parsing or external trusted service) when approved; keep client result path only as transitional if needed.
- Add stronger upload authorization (short-lived signed token / presigned URL pattern) and rate limiting.
- Wire Better Auth session validation to populate `user.id` (currently scaffolded fail-closed for protected resolvers/handlers until session integration is completed).
- Run `npm install && npm run typecheck` in `cloudflare-backend/` and apply D1 migrations in target env.
