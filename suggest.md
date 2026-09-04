# Resume Elite — Full-App Suggestions: Remove / Add / Fix

Audit date: 2026-09-04. Ordered by impact. Nothing here is implemented —
pick items and I'll do them.

---

## 🔴 REMOVE — security first (do these before next build)

1. **Secrets committed to git** — `resume-release.keystore` (2.7KB),
   `keystore_base64.txt`, `b64.txt` (2.7MB!), `google-services.json`.
   Anyone with repo access can sign as you / use your Firebase project.
   → Move to EAS Secrets + local-only files, add to `.gitignore`,
   rotate the keystore + Firebase keys after removal.
2. **Hardcoded SerpApi key in `app/(tabs)/index.tsx:131`** (full key in
   source). Anyone decompiling the APK gets it.
   → Move to Firestore `settings/api_keys` (same pattern as Groq/Gemini)
   or a Cloud Function proxy.
3. **Hardcoded Adzuna `APP_ID`/`APP_KEY` in `constants/config.ts:17-18`.**
   Same fix as #2.

## 🟠 REMOVE — dead weight (safe, ~8MB repo + smaller review surface)

4. **Unreferenced images (~5MB)** — never `require()`d, never bundled, pure
   repo noise: `ghibli-panda.png`, `action-ats/jobs/docs/build.png`,
   `ats-promo.png`, `resume-smiley.png`, `bell.png`, `ats.gif`,
   `new-account.png`, `react-logo*.png`, `nav-icons/house (1).png`,
   `android-icon-*.png` (verify native config doesn't need them first).
5. **Dead code `constants/templates.ts`** — `generateResumeHtml` has zero
   imports; the real generator is `components/resume-html-generator.ts`.
6. **`app/(tabs)/_layout.tsx.bak`** — backup served its purpose; history
   lives in git.
7. **`b64_small.txt`, `resume-elite.png` (root)** — build leftovers; store
   screenshots outside the repo or in `scratch/`.
8. **Unused `Image` import in `app/builder/ats.tsx:12`** + audit other
   unused imports (cheap lint pass: `npx expo lint`).

## 🟡 REMOVE / SIMPLIFY — UX clutter

9. **Onboarding videos?** `assets/Untitled video (1-6).mp4` + interview
   videos are the heaviest bundled assets. If completion analytics show
   skips, replace with the existing Lottie animations.
10. **Dashboard "Search Jobs" vs Jobs tab vs AI Apply scan** — three entries
    to the same funnel. Keep Jobs tab as the single front door.
11. **`my-resumes.tsx` + dashboard "My Resumes" card duplication** — one
    list component reused in both places (they already render the same card).

## 🟢 ADD — highest value first

12. **Cover-letter generator** — you have JD + resume + AI chain already;
    one new screen reusing the ATS result view. Most-requested companion
    to resume builders.
13. **Application reminders** — local notifications for saved jobs
    (`expo-notifications` is already installed): "You saved X 3 days ago".
14. **Stale-job badges** — cache already tracks age; show "Posted 6d ago"
    and auto-hide 14d+ listings in Jobs feed.
15. **Salary normalizer** — Adzuna/Jobicy/Remotive salaries are raw strings
    (`₹..k–..k/yr` vs `$..k/yr`); one formatter + filters users understand.
16. **Bulk ATS check** — run match % for all saved jobs in one pass (reuse
    `processAutoApplyBatch` in preview mode) instead of one-by-one.
17. **Resume version-per-application** — store the customized resume snapshot
    id on the application record so "what did I send to X?" is answerable.
18. **DOCX export** — `resume-exporter.ts` only does PDF; recruiters in India
    still ask for Word. Generate from the same HTML via print-to-docx.
19. **Interview prep from matched JD** — feed the job description into the
    existing AI-interview flow as context ("interview me for THIS role").
20. **Referral nudge in AI Apply empty state** — your referral system
    (`+2 slots`) is buried in Profile; surface it where users hit limits.
21. **Biometric app lock** — resumes hold PII (phone, email, address);
    `expo-local-authentication` is a one-screen addition to `_layout`.
22. **Offline banner** — Firestore reads already degrade gracefully; add one
    global "You're offline" indicator so empty states aren't mysterious.
23. **Crash/error logging** — no Sentry/Crashlytics; you're flying blind on
    production errors (like the `undefined` Firestore bug — found by luck).
24. **E2E smoke test** — one Maestro/Detox flow: login → builder → ATS →
    jobs → apply. Catches wiring regressions between the tabs.

## 🔵 PERFORMANCE — remaining (big wins already shipped)

Already done: FlatList virtualization (Jobs, Templates), cache-first loads,
WebP + expo-image migration, dashboard rail TTL.
Still open:

25. **`my-jobs.tsx` lists still `ScrollView`** — same FlatList treatment
    once lists grow (Applied tab already hit 34 rows once).
26. **Template WebView `pointerEvents="none"` still boots Chromium per card**
    — consider pre-rendered WebP thumbnails for the grid, WebView only on
    select (your own `EliteStudio_Research.md` recommends this too).
27. **`CustomSplashScreen` + AdMob init block first paint** — defer
    `mobileAds().initialize()` until after first frame.

## Suggested order

**This week:** 1, 2, 3 (security) → 4–8 (cleanup).
**Next:** 12, 13, 16 (reuse existing AI/jobs code, no new backend).
**Later:** 17, 19, 21, 23, 24.
