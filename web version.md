# Resume Elite — Web Version (Lovable AI Build Prompt)

> Copy-paste the PROMPT block below into Lovable AI to generate a complete preview website.
> Existing mobile backend is 100% reusable — no new backend needed.

---

## EXISTING BACKEND TO REUSE (DO NOT RECREATE — CONNECT DIRECTLY)

### Firebase Config (use as-is in web `.env` / firebase.ts)

```ts
// firebase.ts for web
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhtT26rqkVAOCvvyPAhUjWdQYPe-7iobY",
  authDomain: "resume-app-a3c51.firebaseapp.com",
  projectId: "resume-app-a3c51",
  storageBucket: "resume-app-a3c51.firebasestorage.app",
  messagingSenderId: "721103059213",
  appId: "1:721103059213:android:ce8216ce07e899f1c09844"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Firestore Collections (already live — reuse same names + schema)

| Collection | Purpose | Key fields |
|---|---|---|
| `users/{uid}` | Profile | `name, email, phone, location, jobRoles[1-3], education, profilePic, resumeLimit(3 default), referralCode, referralCount, referredBy, groqKey, geminiKey, pollinationsKey, llamaKey, preferredProvider, onboardingCompleted, isPro, subscriptionTier, dailyFetchCount, lastJobFetchDate` |
| `users/{uid}/autoApplySettings/config` | Auto-apply prefs | `enabled(false default, explicit opt-in), paused, roles[1-3], minMatch(70), locations[], workModes[Remote/Hybrid/On-site], salaryMin, experienceLevel(Any/Internship/Entry/Mid/Senior)` |
| `users/{uid}/applications/{jobId}` | Auto-apply results | `jobId, title, company, location, logo, applyUrl, source, jobDescription(500ch), matchScore, atsScore, resumeId, resumeCustomized, status, statusColor, reason, autoApplied, createdAt, updatedAt` |
| `users/{uid}/chat_history` | AI builder chats | `messages[], collectedAnswers, resumeData, createdAt` (keep last 10) |
| `job_applications` | Applied tracker (top-level) | `userId, jobId, title, company, location, logo, applyLink, status=Applied, statusColor, autoApplied, appliedAt` |
| `ats_history` | ATS scan history | `userId, score, jobTitle, analysis, resumeName, cloudinaryUrl, cloudinaryPublicId, createdAt` (keep last 3) |
| `resumes` | Resume mirror | `userId, name, data{...resume JSON}, templateId, updatedAt` |
| `global_jobs/{cacheId}` | Shared job cache (7-day TTL) | `jobs[], query, location, jobCount, updatedAt, cachedAt` |
| `notifications` | Push/in-app notices | `userId, title, body, read, createdAt` |
| `templates` | Resume templates | `id, name, category, html/css config` |
| **NEW `employer_jobs/{jobId}`** | Employer postings | `employerId, employerName, company, logo, title, description, skills[], location, workMode, salaryMin, salaryMax, experienceLevel, type(Full-time/Part-time/Contract/Internship), applicantsCount, status(open/closed), createdAt, updatedAt` |
| **NEW `employer_applications/{appId}`** | Applications to employer jobs | `jobId, employerId, applicantId, applicantName, applicantEmail, resumeId, resumeSnapshot{}, coverNote, matchScore, atsScore, status(applied/shortlisted/rejected/hired), createdAt` |
| **NEW `employers/{uid}`** | Employer profile | `company, website, logo, location, industry, verified, createdAt` |

### Firestore Rules (add employer blocks to existing rules)

```
users/{userId} + subcollections: owner-only read/write
ats_history, job_applications, resumes, notifications: where resource.data.userId == auth.uid
global_jobs/{cacheId}: any authenticated read/write (shared cache)
employer_jobs/{jobId}: read any auth user; write only if request.resource.data.employerId == auth.uid
employer_applications/{appId}: applicant read own + employer read own jobs; write applicant create own, employer update status only
```

### Free Job APIs (already integrated in mobile — reuse same code)

- **Adzuna India** — `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=ecc7f430&app_key=914b56f67a533a7e4fa9cec3ccc4e953&what={keywords}&where={city}&results_per_page=20` — cities: Tamil Nadu, Chennai, Bangalore, Hyderabad, Coimbatore, Madurai, Trichy/Tiruchirappalli
- **Jobicy (free, no key)** — `https://jobicy.com/api/v2/remote-jobs?count=20&geo=india&industry=engineering&tag={first-word-of-role}` — tags: developer, mobile, react, backend, devops, data
- **Remotive fallback (free, no key)** — `https://remotive.com/api/remote-jobs?category={cat}&limit=20` — cats: software-dev, mobile, frontend, backend, devops-sysadmin, data

### AI Providers (reuse fallback chain: Groq → Gemini → Pollinations → Meta Llama)

- Groq: `https://api.groq.com/openai/v1/chat/completions`, models `openai/gpt-oss-120b` then `openai/gpt-oss-20b, qwen/qwen3.6-27b`, temp 0.2, json_object mode
- Gemini: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=KEY`
- Pollinations: `https://text.pollinations.ai/openai`, model `openai`
- Llama: `https://api.llama.com/compat/v1/chat/completions`, model `Llama-3.3-70B-Instruct`
- User keys stored in `users/{uid}` (`groqKey, geminiKey, pollinationsKey, llamaKey, preferredProvider`); try user keys first, then shared keys.

### Auto-Apply Matching Logic (port `services/autoApply.ts` 1:1 to web)

- `calculateMatchScore(job, profile)`: title/role overlap 50pts + skills overlap 30pts + location 10pts + work-mode 10pts = 0-100. Match if ≥50% of role tokens in title.
- `checkAutoApplyEligibility`: OFF/paused → stop; no roles → ask; title mismatch → Skipped; score < minMatch → Skipped; location/seniority/salary fail → Skipped; external source (adzuna/jobicy/remotive/verified) → ALWAYS `Manual Apply Required` (never auto-submit external sites, no captcha bypass, no credential use); only `source=internal` (employer_jobs in-app) may auto-submit → `Applied`.
- `customizeResumeForJob`: extractive only — keyword overlap from user's OWN resume, matchedKeywords[20], missingKeywords[20], atsEstimate = 55 + coverage*40 (max 98). Never invent experience.
- Batch cap `MAX_AUTO_APPLY_PER_DAY = 20`. Statuses + colors: Matched #8b5cf6, Resume Customized #0ea5e9, Auto Apply Queued/Applying #f59e0b, Applied #10b981, Skipped #9a8aaa, Failed #ef4444, Manual Apply Required #ea580c.

### Autofill Engine (port `services/autofill/*` to Chrome extension content script)

- ATS detector: greenhouse, lever, workday, generic/unknown via URL + DOM signals.
- Fill-only safe fields (firstName, lastName, email, phone, location, city, linkedin, portfolio, github, website) — never overwrite user input, never touch password/hidden, skip disabled/readonly.
- Detect + report (never bypass): captcha (recaptcha/hcaptcha/turnstile), login-required (password field), file-upload (resume upload), risky questions (visa/sponsorship, salary expectation, notice period, work auth, gender/race/disability selects/radios) — surface to user to answer manually.
- Post confirmation signal on `application submitted / received / successfully applied`.

---

## ★★★ LOVABLE PROMPT — COPY EVERYTHING BELOW THIS LINE ★★★

```
Build a complete responsive web app called "Resume Elite Web" — React + Vite + Tailwind CSS + shadcn/ui + Firebase (Auth + Firestore, config below). Dark/light mode. This is a web port of an existing Expo mobile app + 2 NEW features (Chrome extension auto-apply + Employer hiring portal). Reuse the existing Firebase backend directly (collections + APIs listed in context).

=== TECH SETUP ===
- React + Vite + TypeScript, Tailwind, shadcn/ui components, lucide-react icons, framer-motion animations, react-router-dom.
- Firebase web SDK: firebase/auth (Google + email/password), firebase/firestore. Config: apiKey "AIzaSyBhtT26rqkVAOCvvyPAhUjWdQYPe-7iobY", authDomain "resume-app-a3c51.firebaseapp.com", projectId "resume-app-a3c51", storageBucket "resume-app-a3c51.firebasestorage.app", messagingSenderId "721103059213", appId "1:721103059213:android:ce8216ce07e899f1c09844".
- AI: fetch Groq (https://api.groq.com/openai/v1/chat/completions, model openai/gpt-oss-120b fallback openai/gpt-oss-20b) → Gemini (gemini-1.5-flash) → Pollinations (https://text.pollinations.ai/openai). Keys from users/{uid} doc + settings screen inputs.
- Jobs: Adzuna (app_id ecc7f430, app_key 914b56f67a533a7e4fa9cec3ccc4e953, India search), Jobicy https://jobicy.com/api/v2/remote-jobs, Remotive https://remotive.com/api/remote-jobs. Cache hits in global_jobs collection, 7-day TTL, per-user 5 fetches/day counter on users/{uid}.

=== PAGES / ROUTES ===
1. "/" Landing — hero (headline "Build a job-winning resume in minutes", CTA Start Free + View Jobs), logos strip, features grid (AI builder, ATS score, auto-apply, verified portals), template gallery preview, jobs preview, pricing (Free 3 resumes / Pro monthly-weekly), employer CTA banner ("Hiring? Post a job free"), footer.
2. "/login" — Google button + email/password + guest preview link. On login create/merge users/{uid} (resumeLimit 3, referralCode RESUME-XXXXX).
3. "/onboarding" — 3 steps: roles (1-3 job titles) → location + education → experience level. Save to users/{uid}.jobRoles/location/education.
4. "/dashboard" — greeting, stats cards (resumes count, applications, avg ATS, auto-apply status), quick actions (New Resume, ATS Scan, Browse Jobs, Auto-Apply toggle), recent resumes + recent jobs lists.
5. "/builder" — 5 entry cards: Manual Form / AI Chat / Voice Input (Web Speech API) / LinkedIn Import (paste profile text → AI parse) / ATS Optimizer. Manual = sections personal, summary, experience[], education[], skills[], projects[], certifications. Live preview pane (click section → scroll to editor), theme bar (6 colors + 6 fonts), zoom + A4 scale.
6. "/builder/edit" — the actual editor: left form, right sticky live HTML preview, top bar template picker + ATS quick-score + Download PDF (window.print with print CSS OR html2pdf) + Save (localStorage + resumes collection).
7. "/templates" — grid of 10+ templates (Modern, Classic, Minimal, Executive, Creative, Tech, Fresher, ATS-Safe, Two-column, Photo). Filter by category. Click → preview modal → Use → /builder/edit?template=ID.
8. "/ats" — paste job description or URL + select resume → AI analysis → score dial (0-100) + matched/missing keywords + rewrite suggestions + history list (last 3 from ats_history).
9. "/jobs" — 4 tabs: India (Adzuna, city pills: Tamil Nadu/Chennai/Bangalore/Hyderabad/Coimbatore/Madurai/Trichy + search box) | Remote (Jobicy→Remotive fallback, category pills: All Tech/Mobile/Frontend/Backend/DevOps/Data) | Verified (hardcoded official career portals: Zoho, Freshworks, TCS, Wipro, Infosys, Zoho, Flipkart, Google India, Microsoft India, Razorpay, Swiggy, Amazon, Bosch, HCL, BHEL, Cognizant, Ford, Oracle, PayPal — card shows OFFICIAL CAREER PORTAL badge + Direct Link ✓) | In-App (employer_jobs where status=open — these are the ONLY auto-appliable jobs). Each job card: logo, title, company, location/schedule/salary tags, heart save, ATS Match button, Apply button. Auto-apply badge per job when processed. Save → job_applications or local saved list.
10. "/job/:id" — job details: full description, match score vs my profile, ATS estimate, resume picker, Apply Now (external → open official URL in new tab + record Manual Apply Required; internal → one-click submit → Applied + mirror to job_applications).
11. "/applications" — tracker table with status filter chips (Matched, Resume Customized, Auto Apply Queued, Applying, Applied, Skipped, Failed, Manual Apply Required) + colors: Matched #8b5cf6, Applied #10b981, Failed #ef4444, Manual #ea580c etc. Row → detail drawer with reason + JD snippet + resume used.
12. "/auto-apply" (AI Apply Command Center) — big ON/OFF + Pause switch with disclosure text "Auto Apply will automatically apply only to eligible jobs matching your preferences where automatic application is supported." Controls: roles[3], min match slider (default 70), locations[], work modes, salary floor, experience level. Live stats (scanned/matched/queued/applied/skipped today). Run log feed. DAILY CAP 20. Background runner: on every jobs fetch, silently score jobs with calculateMatchScore + checkAutoApplyEligibility, persist to users/{uid}/applications, show toast "Auto Apply scanned N jobs: X matched". External jobs can ONLY become Manual Apply Required — never mark Applied unless internal submit happened.
13. "/extension" — Chrome Extension onboarding page: What it does (silently fills supported application forms in background with your profile, only after explicit opt-in; pauses on captcha/login/upload/risky questions and asks you), Install steps (Download ZIP → chrome://extensions → Developer mode → Load unpacked → Pin → Connect with code), Permissions explainer (activeTab + storage only, no password reading, no history selling), Connection status card (pairing code generated per user: users/{uid}/extension {pairCode, connected, lastSeen}), Activity log (fills/submits/skips synced from extension), Safety checklist card.
14. "/employer" — Employer Hiring Portal (role switch: Jobseeker / Employer toggle in navbar). Employer dashboard: stats (active jobs, total applicants, shortlisted), job list with open/close toggle + applicant counts, "+ Post a Job" form (title, company, logo URL, location, workMode, salary range, type, experienceLevel, description, skills[]). Job → "/employer/job/:id" applicant pipeline: kanban/table with filters (New / Shortlisted / Rejected / Hired), per-applicant row (name, match score, ATS score, resume snapshot preview, cover note), actions Shortlist / Reject / Hire (update employer_applications status), bulk shortlist top-N by score, search + skill filter, export CSV.
15. "/profile" — avatar, name, email, phone, location, roles, portfolio links, resume slots + referral card (code + count + redeem input +2 slots each side), API Configuration (groq/gemini/pollinations/llama key inputs + preferred provider select + live status dots), subscription card (Free/Pro + upgrade mock), extension pairing code, sign out + delete account.
16. "/notifications" — list from notifications collection + auto-apply events, mark-read.
17. "/privacy" "/terms" "/delete-account" — static legal pages.

=== COMPONENTS ===
Navbar (logo, Jobs, Templates, ATS Scan, My Applications, Auto-Apply pill ON/OFF, role switch Jobseeker/Employer, avatar menu), Footer, GlassCard, TemplateCard, JobCard, VerifiedCard, AutoApplyBadge (colored pill), ScoreDial, ThemeBar, ResumePreview (A4 HTML renderer shared with PDF), KanbanColumn (employer), StatCard, EmptyState, Toasts.

=== DESIGN ===
Premium glassmorphism, indigo #6366f1 primary + violet secondary, Inter/Poppins fonts, rounded-2xl cards, subtle gradients, framer-motion fade/slide on cards, skeleton shimmer while jobs load, fully responsive (mobile drawer nav, desktop sidebar on dashboard/employer), dark mode toggle persisted.

=== DATA MODELS (TypeScript types, Firestore paths as in context) ===
UserProfile, AutoApplySettings (enabled default false), ApplicationRecord, EmployerJob, EmployerApplication, ResumeData, ATSResult. Implement calculateMatchScore, checkAutoApplyEligibility, customizeResumeForJob, processAutoApplyBatch exactly per the matching rules in context (title overlap 50 / skills 30 / location 10 / mode 10; external sources → Manual Apply Required).

=== CHROME EXTENSION (generate as separate downloadable files under /extension-download + full source shown on /extension page) ===
manifest.json (MV3: activeTab, scripting, storage, host_permissions for greenhouse.io, lever.co, workday, generic), content.js = port of the autofill engine (detect ATS → match safe fields → fill → report captcha/login/upload/risky/confirmation via chrome.runtime messages), background.js (queue from Firestore users/{uid}/applications where status Auto Apply Queued, silent run only when settings.enabled && !paused, cap 20/day, pause-and-notify on captcha/login/upload/risky, never submit external without user confirm; internal employer_jobs auto-submit allowed), popup.html (connect code input, ON/OFF toggle synced to Firestore, today's stats). Include install instructions on the page.

=== ACCEPTANCE ===
- Login works with the given Firebase project; all reads/writes hit the collections named in context.
- Jobs tabs load live data (Adzuna/Jobicy/Remotive) with cache-first + silent refresh.
- Resume builder saves + PDF downloads.
- Auto-apply toggle processes loaded jobs silently, writes users/{uid}/applications, respects 20/day cap, never marks external Applied.
- Employer can post job → appears in /jobs In-App tab → seeker one-click applies → appears in employer pipeline → shortlist works.
- /extension page shows install steps + pairing + activity + full extension source for download.
- Build with no mock data for core flows; seed Verified portals list as given.
```

★★★ END LOVABLE PROMPT ★★★

---

## How to use

1. Open Lovable AI → New Project → paste the prompt block above.
2. When it asks for env keys, give the Firebase config from above.
3. After first generation, prompt: `Add Firestore security rules from the backend section and wire the Employer portal + Extension page fully.`
4. Download `web version.md` (this file) alongside for reference.
5. Extension: publish `manifest.json + content.js + background.js + popup.html` from the `/extension` page to Chrome Web Store, or sideload via `chrome://extensions`.

## Feature checklist (mobile parity + new)

- [x] Auth, onboarding, profile, referral (+2 slots), subscription mock
- [x] Resume builder: manual, AI chat, voice, LinkedIn, ATS optimizer
- [x] 10 templates, live preview, theme bar, PDF export
- [x] ATS scan + history (3)
- [x] Jobs: India (Adzuna) + Remote (Jobicy→Remotive) + Verified portals + In-App (employer)
- [x] Saved jobs, applications tracker, notifications
- [x] Auto-apply silent background matching (20/day cap, Manual Apply Required for externals)
- [x] **NEW:** Chrome extension (silent autofill + queue runner + safety pauses)
- [x] **NEW:** Employer portal (post job → receive → filter → shortlist/reject/hire → CSV)
