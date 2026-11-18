# Master Prompt -- Resume ATS App Backend Migration

You are a senior full-stack architect and developer.

Your task is to audit and migrate my **existing Resume ATS application
backend** to a serverless architecture while preserving the current
React Native + Expo application.

**Do not rebuild the application from scratch. Do not break existing
functionality. Do not unnecessarily modify the frontend.**

------------------------------------------------------------------------

## 1. First: Audit the Existing Project

Before changing anything:

-   Inspect the complete project structure.
-   Identify the existing frontend architecture.
-   Identify the current backend and API endpoints.
-   Inspect authentication and user session handling.
-   Inspect resume upload and ATS processing workflow.
-   Identify database tables and relationships.
-   Identify all existing dependencies.
-   Inspect Expo SDK and React Native versions.
-   Identify how Axios is currently used.
-   Identify the existing debug build configuration.

Create `BACKEND_MIGRATION_AUDIT.md` containing:

-   Existing architecture.
-   Existing API endpoints.
-   Database structure.
-   Authentication workflow.
-   Resume upload workflow.
-   Dependencies that must be preserved.
-   Migration risks.
-   Proposed new architecture.

**During this audit, do not modify existing source code. Wait for
approval before implementation.**

------------------------------------------------------------------------

## 2. Target Architecture

### Frontend

-   Existing React Native + Expo application.
-   Preserve existing UI and navigation.
-   Preserve existing Axios dependency.
-   Do not unnecessarily update Expo SDK.
-   Do not introduce native dependencies.

### Backend

-   Cloudflare Workers.
-   Hono.js.
-   GraphQL API.

### Database

-   Cloudflare D1 (SQLite).

### File storage

-   Cloudflare R2.
-   Temporary ATS uploads only.

### Authentication

-   Better Auth.
-   Keep authentication endpoints separate from GraphQL.

### Push notifications

-   Firebase Cloud Messaging (FCM), if required by existing
    functionality.

Use Cloudflare bindings directly for D1 and R2. Do not introduce
unnecessary external services.

------------------------------------------------------------------------

## 3. GraphQL Migration

Migrate application data APIs to GraphQL.

Requirements:

-   Use GraphQL for application data queries and mutations.
-   Use existing Axios for GraphQL HTTP POST requests.
-   Do not install Apollo Client initially.
-   Do not introduce unnecessary GraphQL client dependencies.
-   Keep Better Auth endpoints separate.
-   Preserve existing authentication behavior.
-   Implement GraphQL authentication middleware.
-   Implement user ownership checks.
-   Implement pagination.
-   Implement input validation.
-   Implement query depth and complexity limits.
-   Prevent N+1 database queries.
-   Use batching/DataLoader where appropriate.
-   Add safe caching where applicable.

GraphQL must not create unnecessary database queries. Do not assume
GraphQL automatically reduces database usage. Use efficient SQL queries
and batching.

Binary file uploads should use secure temporary upload URLs or an
appropriate upload endpoint, not unnecessarily send large files through
GraphQL.

------------------------------------------------------------------------

## 4. Resume Upload -- Temporary Cloud Storage

This is a critical requirement.

When a user selects a resume for ATS analysis:

### Step 1: Select and reference the device file

-   Allow the user to select PDF/DOC/DOCX files from their device.
-   Capture the original device URI/path.
-   Capture the filename, file type and file size.
-   Save the resume's local URI/path on the device.
-   Use persistent document access permissions where supported.

### Step 2: Temporary upload

-   Create a unique temporary upload session.
-   Upload the selected resume to Cloudflare R2.
-   Use a unique temporary object key.
-   Do not make uploaded files publicly accessible.
-   Use short-lived upload authorization.

### Step 3: ATS processing

-   Process the uploaded resume through the ATS engine.
-   Generate ATS score and analysis.
-   Validate the processing result.

### Step 4: Save ATS results

Save the required ATS result in Cloudflare D1:

-   Resume ID.
-   User ID.
-   Original filename.
-   File type.
-   File size.
-   ATS score.
-   ATS analysis.
-   Job description/reference ID if required.
-   Processing status.
-   Created date.
-   Updated date.

Do not permanently store the original resume file.

### Step 5: Delete the temporary file

Immediately delete the temporary resume object from R2 after processing.

Use reliable cleanup logic:

-   Delete after successful processing.
-   Delete after failed processing.
-   Use `try/finally` where appropriate.
-   Add a scheduled cleanup process for abandoned uploads.
-   Add temporary upload expiration.
-   Make deletion idempotent.
-   Never leave abandoned resume files indefinitely.

If deletion fails:

-   Record the cleanup status.
-   Retry deletion safely.
-   Do not silently treat the file as deleted.

The ATS result must remain available even after the temporary R2 file is
deleted.

------------------------------------------------------------------------

## 5. Device-Only Resume Storage

The original resume must remain on the user's device. Our server must
**not permanently store the resume**.

When a user selects a resume:

-   Save the original device URI/path locally.
-   Associate the local URI with the Resume ID.
-   Save the local reference using persistent local storage.
-   Store the URI and resume metadata locally, not in Cloudflare R2.

### Android file handling

-   Handle `content://` URIs correctly.
-   Use persistent URI permissions where supported.
-   Do not assume every URI remains accessible permanently.
-   Avoid temporary cache locations that can be automatically cleared.
-   If persistent access is unavailable, copy the original file into the
    app's private document storage and save that local URI.
-   Do not upload this local backup to the server.

### When the user opens an old ATS result

1.  Retrieve the ATS result from D1.
2.  Retrieve the associated local device URI.
3.  Open the original resume directly from the device.
4.  Do not download the resume from Cloudflare.
5.  Do not upload the resume again just to view it.

If the original file is missing or inaccessible:

-   Show a clear message.
-   Ask the user to select the resume again.
-   Update the local URI reference.

### Important limitations

-   If the user uninstalls the application, local app storage may be
    deleted.
-   If the user deletes or moves the original resume, its URI may stop
    working.
-   If the user changes devices, the local resume may not be available.
-   Never promise that the original resume is recoverable from the
    server.

The ATS score and analysis should remain available independently.

------------------------------------------------------------------------

## 6. Database Design

Design a proper D1 schema.

Suggested tables:

### `users`

-   `id`
-   `email`
-   Authentication fields
-   `created_at`

### `resumes`

-   `id`
-   `user_id`
-   `original_filename`
-   `file_type`
-   `file_size`
-   `ats_score`
-   `ats_analysis`
-   `processing_status`
-   `created_at`
-   `updated_at`

### `ats_jobs`

-   `id`
-   `user_id`
-   `resume_id`
-   `job_description`
-   `status`
-   `created_at`

### `temporary_uploads`

-   `id`
-   `user_id`
-   `resume_id`
-   `r2_object_key`
-   `upload_status`
-   `expires_at`
-   `deleted_at`
-   `created_at`

Create appropriate foreign keys, indexes, constraints and ownership
relationships.

-   Do not store original resume binary data in D1.
-   Do not store permanent resume file URLs.
-   Do not store unnecessary extracted personal information.
-   Review the existing database before deciding the final schema.
-   Ensure Better Auth's required schema is compatible with the final D1
    design; do not duplicate or conflict with authentication tables.

------------------------------------------------------------------------

## 7. Security

Implement:

-   Secure authentication.
-   Authorization for every user-specific operation.
-   User ownership validation.
-   Input validation.
-   File type validation.
-   File size limits.
-   Rate limiting.
-   Temporary upload authorization.
-   Secure R2 access.
-   Environment secrets.
-   Error handling.
-   Protection against unauthorized ATS result access.

Never expose:

-   Cloudflare API tokens.
-   R2 credentials.
-   Database credentials.
-   Private temporary upload credentials.

Never log resume contents or sensitive personal information.

------------------------------------------------------------------------

## 8. Cloudflare Cost Optimization

Optimize for Cloudflare Free Plan initially.

Avoid unnecessary:

-   Worker requests.
-   D1 reads and writes.
-   R2 storage.
-   R2 operations.
-   Repeated ATS processing.
-   Duplicate uploads.

Use:

-   Efficient GraphQL queries.
-   Database batching.
-   Pagination.
-   Appropriate caching.
-   Temporary file deletion.
-   Scheduled cleanup for abandoned files.

Do not promise unlimited free usage. Document which usage limits may
require upgrading. Keep the architecture easy to scale to paid plans.

------------------------------------------------------------------------

## 9. Preserve Existing Expo Application

This is mandatory.

Do not:

-   Replace the existing frontend.
-   Rebuild the UI.
-   Change navigation unnecessarily.
-   Upgrade Expo SDK without approval.
-   Replace Axios.
-   Install Apollo Client initially.
-   Add unnecessary native dependencies.
-   Modify Android native files.
-   Modify iOS native files.
-   Modify `app.json` / `app.config` unless absolutely necessary.
-   Modify Gradle settings.
-   Trigger EAS builds.
-   Trigger Android/Gradle builds.

The new backend must work with the existing Expo debug build.

Use existing Axios to communicate with the new GraphQL endpoint.

If any native change is unavoidable, **stop and explain why before
implementing it**.

------------------------------------------------------------------------

## 10. Backward Compatibility

The existing backend must remain untouched initially.

-   Create a separate Cloudflare backend implementation.
-   Preserve existing API behavior wherever possible.
-   Use an environment/configuration switch:

``` env
API_PROVIDER=existing
# or
API_PROVIDER=cloudflare
```

Default: `API_PROVIDER=existing`

Allow switching to Cloudflare only after successful testing and my
approval.

Do not delete the existing backend. Maintain a rollback path.

------------------------------------------------------------------------

## 11. Testing

Test the following.

### Authentication

-   Register.
-   Login.
-   Logout.
-   Session validation.

### GraphQL

-   Queries.
-   Mutations.
-   Authorization.
-   Pagination.
-   Invalid requests.
-   N+1 prevention.

### Resume workflow

-   Select resume.
-   Save local URI.
-   Upload temporarily.
-   Process ATS.
-   Save ATS result.
-   Delete R2 file.
-   Open original resume from device.
-   Handle missing local file.
-   Handle failed uploads.
-   Handle failed ATS processing.
-   Handle R2 deletion failure.
-   Handle abandoned temporary uploads.

### Compatibility

-   Existing Expo debug build.
-   Existing Axios configuration.
-   Existing screens.
-   Existing navigation.
-   Existing authentication flow.

Do not mark a test successful unless it has actually been executed.

------------------------------------------------------------------------

## 12. Implementation Phases

### Phase 1: Audit

-   Audit existing project.
-   Create `BACKEND_MIGRATION_AUDIT.md`.
-   Make no source-code modifications.

### Phase 2: Cloudflare backend

After approval:

-   Create the Cloudflare backend separately.
-   Implement D1 schema and migrations.
-   Implement Better Auth.
-   Implement GraphQL.

### Phase 3: Resume processing

-   Implement temporary R2 resume uploads.
-   Implement ATS processing.
-   Implement automatic cleanup.
-   Implement device-only resume references.

### Phase 4: Frontend integration

-   Integrate using existing Axios.
-   Preserve existing frontend.
-   Do not introduce native build requirements.

### Phase 5: Testing

-   Test the entire workflow.
-   Generate a migration report.

### Phase 6: Production

-   Wait for my approval before switching production traffic.

------------------------------------------------------------------------

## 13. Final Deliverables

Provide:

1.  `BACKEND_MIGRATION_AUDIT.md`
2.  Updated architecture documentation.
3.  Cloudflare backend source code.
4.  D1 schema and migration files.
5.  GraphQL schema and resolvers.
6.  Better Auth configuration.
7.  Temporary R2 upload and deletion implementation.
8.  Device-only resume storage implementation.
9.  Environment variable example.
10. Deployment instructions.
11. Testing report.
12. Cost and free-plan usage estimate.
13. Rollback instructions.

------------------------------------------------------------------------

## Final Non-Negotiable Rules

-   Existing app must continue working.
-   Existing debug build must not be broken.
-   GraphQL must be used for application data APIs.
-   Axios must be preserved.
-   Resume files must only be temporarily stored in R2.
-   Delete temporary R2 files after ATS processing.
-   Original resumes must remain on the user's device.
-   Store device URI/path locally.
-   Never permanently store original resume files on the server.
-   ATS scores and analysis must remain in D1.
-   Never delete the old backend without approval.
-   Never switch production without my approval.

**Start with Phase 1 only. Do not start implementation until I review
and approve the audit.**
