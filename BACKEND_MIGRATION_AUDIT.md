# BACKEND_MIGRATION_AUDIT.md — Resume Elite (No-R2 / No Server File Storage)

**Date:** 2026-11-09  
**Status:** **PHASE 1 AUDIT + IMPLEMENTATION PLAN (no source modifications made in this step except this audit document)**  
**New objective (supersedes prior R2/temp-upload plan):** Migrate backend to Cloudflare **without R2/Supabase Storage/any server-side resume file storage**. Original resume files never leave the device; only extracted text/metadata/ATS results go to server.

> **Repo note:** Prior approved scaffolding exists in `cloudflare-backend/` and additive app hooks (`constants/config.ts`, `services/cloudflareBackend.ts`, etc.) from an earlier R2-based phase. This document defines the **revised no-R2 target**. No existing application/backend source files will be modified until this audit/plan is reviewed and explicitly approved.

---

## 1. Executive summary

- **App:** Expo SDK 54 / React Native 0.81.5 / React 19, Expo Router, TypeScript. EAS/Codemagic builds, native plugins (Google Sign-In, IAP, AdMob, file-system, document picker, intent launcher, WebView).
- **Current backend/data path:** Firebase Auth (Google) + Cloud Firestore as primary cloud DB; direct client calls to AI providers (Groq/Gemini/Pollinations/Llama) and job APIs; Cloudinary for ATS snapshot images (client-signed). `functions/` exists but client AI path is largely direct (`services/ai.ts`). No custom app server in production path.
- **Current resume/ATS reality:** PDF selection via `expo-document-picker`; **local text extraction already implemented for PDF in WebView using pdf.js CDN** (`app/builder/ats.tsx`, `app/my-resumes.tsx`, `app/resume-pdf-viewer.tsx`, `app/builder/linkedin.tsx`). Original uploaded PDFs are stored locally by URI/path metadata (`utils/storage.ts` `fileUri`, `source:'upload'`) and can be viewed from device. ATS analysis is computed by calling AI from client, then history saved to Firestore/Cloudinary snapshot + local snapshot.
- **No-R2 migration implication:** Keep extraction and original file fully on-device; move **analysis orchestration and persistence** to Cloudflare Worker (Hono + GraphQL + D1) with AI API called **only from Worker**. Send **extracted text (and minimal metadata)** to Worker via Axios GraphQL; store only results/required metadata/text-in-D1-if-necessary in D1. Preserve existing UI/navigation/Axios/Expo SDK/native config.

---

## 2. Existing architecture audit

### 2.1 Frontend (must preserve)
| Area | Current implementation | Key files |
|---|---|---|
| Routing/navigation | Expo Router, auth/onboarding gate, 5-tab layout, stack screens for builder/tools/jobs/resumes/legal | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/**` |
| State | Zustand limited (theme, saved jobs); primary state via Auth context + Firestore realtime + AsyncStorage/hooks | `hooks/use-auth.tsx`, `hooks/use-color-scheme.ts`, `hooks/use-job-store.ts`, feature hooks |
| Networking | **Axios present** (`services/cloudinary.ts`, `app/(tabs)/index.tsx`) and widely `fetch`; migration must preserve Axios and use it for GraphQL | `services/cloudinary.ts`, `app/(tabs)/index.tsx`, `services/ai.ts` |
| UI/components | Resume builder/templates/preview/export, ATS UI, jobs/apply/autofill, profile/settings | `components/**`, `app/builder/**`, `app/(tabs)/**` |

### 2.2 Current backend & API endpoints/services
| Service | Usage | Notes |
|---|---|---|
| Firebase Auth | Google Sign-In → Firebase credential; session persistence in AsyncStorage | `services/auth.ts`, `services/firebase.ts`, `hooks/use-auth.tsx` |
| Firestore | users, ats_history, job_applications, resumes mirror, notifications, global_jobs, settings docs, user subcollections (auto-apply/chat) | `services/firestore.ts`, `firestore.rules`, `firestore.indexes.json` |
| Cloud Functions (`functions/index.js`) | generateResume/syncUserSubscription/getTemplates/processAutoApplyQueue | Client bypasses CF for AI (`services/ai.ts`) |
| AI (client-direct) | Groq, Gemini, Pollinations, Llama fetch calls; fallback/remote-shared keys | `services/ai.ts`, `services/remote-config.ts`, `constants/config.ts` |
| Cloudinary (client-direct) | ATS snapshot upload/delete with client-side signing (**secret exposed in app**) | `services/cloudinary.ts` |
| Job APIs | Adzuna, Jobicy, Remotive, SerpAPI (client-side) | `app/(tabs)/jobs.tsx`, `app/(tabs)/index.tsx`, `services/autoApplyBackground.ts` |
| CDN in WebView | pdf.js 2.16.105 for local PDF parse/render | ATS/manual/upload/viewer/linkedin screens |

### 2.3 Authentication & authorization (current)
- Google Sign-In native module + Firebase Auth (`services/auth.ts`), app config/plugins in `app.json`, `google-services.json`.
- Identity/ownership keyed by Firebase `uid`; Firestore rules enforce owner access for most collections (`firestore.rules`), except `global_jobs` shared-auth write.
- `app/login.tsx` includes a guest/dev fallback on sign-in failure (risk). Migration must preserve existing behavior until approved switch and implement proper authz for all user-specific GraphQL/D1 operations.

### 2.4 Resume upload, extraction, ATS, storage flows (current)
| Flow | Implementation | On-device? | Server/file upload? |
|---|---|---|---|
| Select resume (upload/ATS) | `expo-document-picker` (PDF in key flows; apply-browser allows PDF/DOC/DOCX attach UX) | Yes | No (selection local) |
| PDF text extraction | Read base64 (`expo-file-system/legacy`) → hidden WebView runs pdf.js from CDN → posts extracted text | Yes (compute in app/WebView) | No, but **pdf.js loaded from CDN** (network dependency) |
| DOCX extraction | **Not clearly implemented in audited ATS/upload path** (PDF-focused). Needs compatibility-verified local solution for existing Expo SDK | TBD | Must remain none |
| ATS analysis | `app/builder/ats.tsx` builds prompt from extracted text + JD, calls `callAI` (client → third-party AI), saves result to Firestore and local snapshot; Cloudinary snapshot path in code | Partial (extract local) | Analysis/results go to third-party AI + Firebase/Cloudinary today |
| Original resume persistence | `utils/storage.ts` stores resume records in AsyncStorage (`fileUri`, `source:'upload'`, etc.); `app/resume-pdf-viewer.tsx` reads local file and renders | Yes | No permanent server storage by design in viewer flow |
| Export/share | `expo-print`, `expo-sharing`, `expo-intent-launcher`, local document directory | Yes | No |

**Android/local URI risks:** `content://` URIs may lose permission/persistence across restarts, provider changes, moves/deletes, or app reinstall; current code does not show robust SAF persistent-permission handling/copy-to-app-private fallback.

### 2.5 Database/storage (current)
- **Cloud:** Firestore collections (`users`, `ats_history`, `job_applications`, `resumes` mirror, `notifications`, `global_jobs`, `settings/*`), `firestore.indexes.json` minimal.
- **Local:** AsyncStorage for auth persistence, resume records/versions/imports/drafts/settings/caches/queues; device document directory for ATS snapshots and generated PDFs.
- **No Firebase Storage usage found in app;** snapshots use Cloudinary/local.

### 2.6 Dependencies/config constraints (must preserve)
- Expo SDK unchanged; no Android/iOS native file or Gradle changes; no EAS/native builds without approval.
- Preserve existing Axios, UI, navigation, existing backend behavior until approved switch.
- Existing env/config patterns: `app.json`, `eas.json`, `codemagic.yaml` (injects `GROQ_API_KEY` via `sed`), hardcoded keys/endpoints in `constants/config.ts` and services — **secrets must not be exposed in mobile code for new AI path**.

---

## 3. Target architecture (revised: no R2, no server file storage)

```text
[Expo RN App - existing UI/navigation/Axios preserved]
  - select PDF/DOCX locally (expo-document-picker)
  - persist original in device storage + save local URI/ref in local app storage
  - extract text ON DEVICE (SDK-compatible lib; verified before install)
  - POST GraphQL (Axios) with extracted text + metadata + job context
        |
        v
[Cloudflare Worker + Hono + GraphQL]
  - authn/authz, validation, rate/size limits, depth/complexity limits
  - call AI provider securely (server-side secret only)
  - persist ATS report/metadata in D1
  - NO R2, NO Supabase, NO binary file upload/storage
        |
        v
[Cloudflare D1]  (users, resume_records, ats_reports, job_descriptions, job_matches, application_history, usage_limits)

Open previous report:
  App -> GraphQL fetch report from D1 -> resolve local resume reference/URI from local storage
  -> open original from device; if missing/inaccessible prompt user to reselect and update local ref
```

### 3.1 Hard rules compliance
- No R2/Supabase/external file storage; no PDF/DOCX upload; no binaries in D1.
- Original resumes remain on device only; local URI/ref stored client-side (and only non-sensitive identifiers/metadata server-side as needed).
- AI keys only in Worker secrets/env; never in mobile code.
- Axios used for GraphQL requests from RN; avoid Apollo unless absolutely necessary.

---

## 4. Proposed D1 database design (no binaries)

> Final field names/types to be confirmed after Phase 2 schema review; align with existing data semantics and auth model.

| Table | Purpose | Key fields (proposed) |
|---|---|---|
| `users` | App user identity (Better Auth-compatible or mapped to existing auth during migration) | `id`, `email`, `display_name`, `auth_provider`, `legacy_firebase_uid` (nullable), `created_at`, `updated_at` |
| `resume_records` | Resume metadata known to server (**no file content by default**) | `id`, `user_id`, `client_resume_id` (local), `resume_name`, `file_type`, `file_size` (optional), `text_extraction_status`, `extracted_text_hash` (optional), `extracted_text` (**only if required/approved; consider size/cost/privacy**), `created_at`, `updated_at` |
| `ats_reports` | ATS results | `id`, `user_id`, `resume_record_id`, `job_description_id` (nullable), `ats_score`, `analysis_json`, `missing_keywords_json`, `skills_analysis_json`, `improvement_suggestions_json`, `job_compatibility_score`, `created_at` |
| `job_descriptions` | JD inputs/references | `id`, `user_id`, `title`, `company`, `source_url` (nullable), `description_text`, `created_at` |
| `job_matches` | Match/linkage results | `id`, `user_id`, `resume_record_id`, `job_description_id`, `ats_report_id`, `match_score`, `status`, `created_at` |
| `application_history` | Apply/track events (migrated subset as needed) | `id`, `user_id`, `resume_record_id`, `job_description_id`, `job_external_id`, `status`, `applied_at`, `metadata_json`, `created_at` |
| `usage_limits` | Quotas/rate/cost controls | `id`, `user_id`, `period_key` (day/month), `ats_requests_count`, `ai_tokens_estimate` (optional), `limit_value`, `updated_at` |

**Storage constraints:** No `BLOB`/binary resume storage. No local device URI/path stored in D1 (client-side only). If `extracted_text` is stored, enforce strict size limits, encryption-at-rest considerations, access controls, and minimal retention; prefer storing analysis outputs + hash unless full text is required.

**Indexes (planned):** `user_id + created_at` on reports/records/history; lookup by `client_resume_id`; uniqueness/ownership constraints; pagination-friendly keys.

---

## 5. GraphQL API design (Hono.js, Axios client)

### 5.1 Principles
- Single GraphQL endpoint (e.g. `/graphql`) via Hono; Axios POST from app.
- Auth middleware required for all user data; ownership checks on every resolver.
- Input validation (file type/size metadata, text length), **request/body size limits**, query **depth & complexity** limits, rate limiting, pagination.
- Lightweight responses; avoid N+1 with batching/loaders and explicit SQL joins where appropriate.

### 5.2 Core operations (planned)
- **Queries:** `me`, `atsReport(id)`, `atsReports(limit,cursor/offset)`, `resumeRecord(id)`, `resumeRecords(...)`, `jobDescriptions(...)`, `applicationHistory(...)`, `usageStatus`
- **Mutations:** `submitAtsAnalysis(input)` (accepts extracted text + resume/job metadata; server calls AI; returns scores/analysis; persists to D1), `saveJobDescription(...)`, `recordJobMatch(...)`, `recordApplicationEvent(...)`, `deleteAtsReport(...)` (if permitted)
- **Do not accept/upload binaries.** Optional future: chunked text only if within strict limits.

---

## 6. Device/local file handling plan (critical)

1. **Selection:** keep `expo-document-picker` for PDF/DOCX (verify current SDK/type support behavior).
2. **Extraction (on-device only):**
   - **PDF:** already feasible via pdf.js in WebView/base64 read (audit evidence above). Investigate bundling pdf.js locally/offline for reliability (CDN today) — compatibility check before change.
   - **DOCX:** investigate SDK-compatible JS/native-free options (e.g. JS zip+xml parsing) or document-picker+user guidance; **do not install until compatibility verified** on existing Expo 54/RN 0.81 debug build.
   - **Scanned PDFs:** detect low/no extracted text and return clear UX (OCR may require native/module or external flow; only with approval if native impact).
3. **Persistence:** store local reference in app storage (AsyncStorage / secure/local DB abstraction already used). On Android, investigate persistent URI permissions; if not reliable, **copy selected file to app-private document storage** and store that path/ref (never upload).
4. **Open previous report:** fetch D1 report -> resolve local ref -> open from device; if missing/moved/unreadable, prompt reselect and update ref.
5. **Limitations (must communicate):** uninstall/clear-data/device change/file deletion breaks local original; server never can recover original file.

---

## 7. Security, privacy, performance, cost

- **Secrets:** AI provider keys in Worker secrets only; remove reliance on client-exposed keys for migrated path (note: existing app currently exposes some keys/config patterns — remediation plan required).
- **Validation/authz:** authenticate requests, enforce `user_id` ownership, reject oversized text payloads, sanitize/log safely (**no sensitive resume text in logs**).
- **Abuse/cost controls:** per-user rate limits, usage quotas in `usage_limits`, measurable AI call metrics/cost tags.
- **Performance:** pagination, indexed queries, no N+1, bounded query depth/complexity, compact JSON responses.

---

## 8. Implementation phases (revised) & risks

| Phase | Scope | Exit criteria |
|---|---|---|
| **PHASE 1 (this doc)** | Audit + no-R2 implementation plan | Audit reviewed/approved |
| **PHASE 2** | Cloudflare Worker/Hono/D1/GraphQL architecture, schema & API design; **no existing app code changes** | Design approved |
| **PHASE 3** | Implement backend separately (D1 migrations, GraphQL, AI proxy, authz/rate/limits), test APIs | Backend tests pass |
| **PHASE 4** | Integrate mobile app via existing Axios (`API_PROVIDER` switch, default existing), preserve UI/nav; send extracted text not files | Debug build works with fallback |
| **PHASE 5** | Test PDF/DOCX extraction, large/scanned PDFs, offline behavior, URI persistence, ATS/auth/D1 retrieval, missing original handling | Test report with evidence |
| **PHASE 6** | Migration report + rollback instructions; no old backend deletion/switch without full test + approval | Approved rollout plan |

**Key risks:** DOCX/scanned-PDF extraction without native deps; Android URI persistence; current Firebase-auth dependency vs target auth; large extracted-text payload limits/cost; existing exposed secrets; existing `cloudflare-backend` R2 scaffolding must be reconciled/disabled for no-R2 path.

---

## 9. Immediate next step (awaiting approval)

- **No existing source files modified in this step.** This audit/plan is ready for review.
- On approval, proceed to **PHASE 2** (no-R2 architecture + D1 schema/migrations + GraphQL schema/resolvers design) as a separate backend track, keeping existing app/backend operational.

**Requested approval:** confirm Phase 2 start under this no-R2 spec (and whether to retire/refactor prior R2 scaffold in `cloudflare-backend/` as part of Phase 2).
