/**
 * globalJobsFeed.ts
 *
 * Unified Global Job Feed Architecture:
 * 1. Single global fetch that aggregates international, remote, and India tech jobs once.
 * 2. Caches master dataset in memory & AsyncStorage with automatic expiration elimination.
 * 3. Provides instant zero-latency filtering by Tab, Country, and Real-time Search.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "@/constants/config";
import { getCached, setCached, getMem, setMem } from "./jobCache";
import { db } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getSavedScrapedJobs } from "./jobScraper";

export interface UnifiedJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  country: "Worldwide Remote" | "USA" | "India" | "Europe & UK" | "Canada" | "APAC";
  description: string;
  salary: string;
  apply_link: string;
  thumbnail: string | null;
  schedule_type: string;
  source: string;
  posted_at: string;
  expires_at?: string;
}

const CACHE_KEY = "unified_global_jobs_v3";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours cache for fast subsequent visits
const MAX_JOB_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days max age before elimination

let inFlightPromise: Promise<UnifiedJob[]> | null = null;

// ─── Normalizer: Detect Country / Region ───────────────────────────────────────
export function detectRegion(rawLocation: string = ""): UnifiedJob["country"] {
  const loc = rawLocation.toLowerCase();
  if (
    loc.includes("india") ||
    loc.includes("bangalore") ||
    loc.includes("bengaluru") ||
    loc.includes("chennai") ||
    loc.includes("hyderabad") ||
    loc.includes("pune") ||
    loc.includes("mumbai") ||
    loc.includes("delhi") ||
    loc.includes("gurgaon") ||
    loc.includes("noida") ||
    loc.includes("coimbatore")
  ) {
    return "India";
  }

  if (
    loc.includes("usa") ||
    loc.includes("united states") ||
    loc.includes("us only") ||
    loc.includes("america") ||
    loc.includes("san francisco") ||
    loc.includes("new york") ||
    loc.includes("austin") ||
    loc.includes("seattle") ||
    loc.includes("california") ||
    loc.includes("boston")
  ) {
    return "USA";
  }

  if (
    loc.includes("uk") ||
    loc.includes("united kingdom") ||
    loc.includes("london") ||
    loc.includes("germany") ||
    loc.includes("berlin") ||
    loc.includes("france") ||
    loc.includes("paris") ||
    loc.includes("europe") ||
    loc.includes("netherlands") ||
    loc.includes("amsterdam") ||
    loc.includes("ireland") ||
    loc.includes("dublin")
  ) {
    return "Europe & UK";
  }

  if (loc.includes("canada") || loc.includes("toronto") || loc.includes("vancouver") || loc.includes("montreal")) {
    return "Canada";
  }

  if (loc.includes("australia") || loc.includes("sydney") || loc.includes("melbourne") || loc.includes("singapore") || loc.includes("japan") || loc.includes("tokyo")) {
    return "APAC";
  }

  return "Worldwide Remote";
}

// ─── Curated High-Quality Baseline Global & India Tech Jobs ───────────────────
export const BASELINE_GLOBAL_JOBS: UnifiedJob[] = [
  // ── India Tech Roles (Chennai, Bangalore, Hyderabad, Gurgaon, Pune, Coimbatore) ──
  {
    job_id: "base-in-1",
    title: "Software Development Engineer (Frontend/Mobile)",
    company_name: "Swiggy",
    location: "Bangalore, India",
    country: "India",
    description: "Build high-throughput consumer & partner mobile apps using React Native, TypeScript, and real-time order tracking systems.",
    salary: "₹18L – ₹28L/yr",
    schedule_type: "Full-time",
    apply_link: "https://careers.swiggy.com",
    thumbnail: null,
    source: "swiggy",
    posted_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-2",
    title: "Product Engineer (Full Stack SaaS)",
    company_name: "Zoho Corporation",
    location: "Chennai, India",
    country: "India",
    description: "Build robust SaaS products serving 100M+ users globally with Java, TypeScript, and scalable cloud systems. Campus-first culture.",
    salary: "₹10L – ₹18L/yr",
    schedule_type: "On-site",
    apply_link: "https://www.zoho.com/careers/",
    thumbnail: null,
    source: "zoho",
    posted_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-3",
    title: "Senior Mobile Application Developer",
    company_name: "Zomato",
    location: "Gurgaon, India",
    country: "India",
    description: "Architect core food delivery & Blinkit quick commerce apps with sub-second startup times and 60fps animations.",
    salary: "₹24L – ₹36L/yr",
    schedule_type: "Hybrid",
    apply_link: "https://www.zomato.com/careers",
    thumbnail: null,
    source: "zomato",
    posted_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-4",
    title: "Frontend Architect & Design Systems",
    company_name: "Freshworks",
    location: "Chennai, India",
    country: "India",
    description: "Design customer engagement interfaces across Freshdesk and Freshservice product suites using modern React & design tokens.",
    salary: "₹16L – ₹26L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.freshworks.com/company/careers/",
    thumbnail: null,
    source: "freshworks",
    posted_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-5",
    title: "Cloud Infrastructure & SRE Engineer",
    company_name: "Flipkart",
    location: "Bangalore, India",
    country: "India",
    description: "Scale Kubernetes clusters, distributed Kafka pipelines, and automated high-concurrency e-commerce cloud infrastructure.",
    salary: "₹22L – ₹34L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.flipkartcareers.com",
    thumbnail: null,
    source: "flipkart",
    posted_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-6",
    title: "Backend Platform Engineer (Go / Java)",
    company_name: "PhonePe",
    location: "Bangalore, India",
    country: "India",
    description: "High-scale financial transaction systems processing millions of UPI payments every hour with zero downtime and strict security.",
    salary: "₹25L – ₹40L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.phonepe.com/careers/",
    thumbnail: null,
    source: "phonepe",
    posted_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-7",
    title: "Payments Infrastructure Lead",
    company_name: "Razorpay",
    location: "Bangalore, India",
    country: "India",
    description: "Architect core payment gateway APIs and merchant dashboard tools handling billions in monthly transactions.",
    salary: "₹26L – ₹42L/yr",
    schedule_type: "Hybrid",
    apply_link: "https://razorpay.com/jobs/",
    thumbnail: null,
    source: "razorpay",
    posted_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-8",
    title: "Cloud & AI Software Engineer",
    company_name: "Microsoft India R&D",
    location: "Hyderabad, India",
    country: "India",
    description: "Work on Microsoft Azure, Copilot, and foundational developer tools alongside global engineering teams.",
    salary: "₹28L – ₹45L/yr",
    schedule_type: "Hybrid",
    apply_link: "https://careers.microsoft.com",
    thumbnail: null,
    source: "microsoft",
    posted_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-in-9",
    title: "Senior Full Stack Cloud Developer",
    company_name: "Infosys Cobalt",
    location: "Hyderabad / Coimbatore, India",
    country: "India",
    description: "Modernize enterprise systems into cloud-native microservices with React, Node.js, and AWS/Azure architectures.",
    salary: "₹12L – ₹20L/yr",
    schedule_type: "Hybrid",
    apply_link: "https://www.infosys.com/careers/",
    thumbnail: null,
    source: "infosys",
    posted_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },

  // ── Worldwide Remote Roles (Work From Anywhere) ───────────────────────────
  {
    job_id: "base-ww-1",
    title: "Staff Frontend Architect (React / TypeScript)",
    company_name: "Automattic",
    location: "Worldwide Remote",
    country: "Worldwide Remote",
    description: "Work on open-source web platforms used by over 40% of the web. Fully asynchronous worldwide remote company.",
    salary: "$140k – $190k/yr",
    schedule_type: "Remote",
    apply_link: "https://automattic.com/work-with-us/",
    thumbnail: null,
    source: "automattic",
    posted_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-ww-2",
    title: "AI Systems & LLM Integrations Specialist",
    company_name: "GitLab",
    location: "Worldwide Remote (All Timezones)",
    country: "Worldwide Remote",
    description: "Integrate generative AI capabilities into DevSecOps workflows. Remote work pioneer with team across 65+ countries.",
    salary: "$135k – $180k/yr",
    schedule_type: "Remote",
    apply_link: "https://about.gitlab.com/jobs/",
    thumbnail: null,
    source: "gitlab",
    posted_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-ww-3",
    title: "Senior Product Engineer (React & GraphQL)",
    company_name: "Buffer",
    location: "Worldwide Remote",
    country: "Worldwide Remote",
    description: "Empower millions of creators and small businesses with seamless social media publishing and analytics tools.",
    salary: "$125k – $165k/yr",
    schedule_type: "Remote",
    apply_link: "https://buffer.com/journey",
    thumbnail: null,
    source: "buffer",
    posted_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-ww-4",
    title: "Cloud Infrastructure & Site Reliability Lead",
    company_name: "Wikimedia Foundation",
    location: "Worldwide Remote",
    country: "Worldwide Remote",
    description: "Maintain Wikipedia infrastructure serving 15+ billion monthly page views with open-source systems.",
    salary: "$120k – $160k/yr",
    schedule_type: "Remote",
    apply_link: "https://wikimediafoundation.org/participate/careers/",
    thumbnail: null,
    source: "wikimedia",
    posted_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },

  // ── USA & Global Roles (San Francisco, New York, London, Toronto, Sydney) ─
  {
    job_id: "base-us-1",
    title: "Senior Full Stack Engineer (React Native & Node)",
    company_name: "Stripe",
    location: "San Francisco, CA",
    country: "USA",
    description: "Build robust, global financial infrastructure for modern mobile payment flows and developer dashboards.",
    salary: "$165k – $210k/yr",
    schedule_type: "Hybrid",
    apply_link: "https://stripe.com/jobs",
    thumbnail: null,
    source: "stripe",
    posted_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-us-2",
    title: "Mobile Engineer (React Native / iOS / Android)",
    company_name: "Discord",
    location: "San Francisco, CA",
    country: "USA",
    description: "Deliver real-time chat, voice, and video communication to over 200 million monthly active users on mobile.",
    salary: "$150k – $195k/yr",
    schedule_type: "Full-time",
    apply_link: "https://discord.com/careers",
    thumbnail: null,
    source: "discord",
    posted_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-eu-1",
    title: "Cloud Platform & DevOps Engineer",
    company_name: "Spotify",
    location: "Stockholm / London, UK",
    country: "Europe & UK",
    description: "Scale distributed microservices, Kubernetes clusters, and real-time audio delivery pipelines for 500M+ music lovers.",
    salary: "€95k – €135k/yr",
    schedule_type: "Hybrid",
    apply_link: "https://www.lifeatspotify.com/jobs",
    thumbnail: null,
    source: "spotify",
    posted_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-ca-1",
    title: "Backend Engineer (Go / Distributed Systems)",
    company_name: "Shopify",
    location: "Toronto, Canada",
    country: "Canada",
    description: "Build high-throughput commerce primitives processing over $200B in annual merchandise volume without latency spikes.",
    salary: "$130k – $175k/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.shopify.com/careers",
    thumbnail: null,
    source: "shopify",
    posted_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-us-3",
    title: "iOS / Swift UI Systems Engineer",
    company_name: "Apple",
    location: "Cupertino, CA",
    country: "USA",
    description: "Architect next-generation operating system components and native UI experiences with Swift and Metal.",
    salary: "$170k – $225k/yr",
    schedule_type: "On-site",
    apply_link: "https://jobs.apple.com",
    thumbnail: null,
    source: "apple",
    posted_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "base-eu-2",
    title: "Fintech Platform Architect",
    company_name: "Revolut",
    location: "London, UK",
    country: "Europe & UK",
    description: "High-concurrency global financial network and banking infrastructure connecting 40+ million global retail customers.",
    salary: "£85k – £120k/yr",
    schedule_type: "Hybrid",
    apply_link: "https://www.revolut.com/careers/",
    thumbnail: null,
    source: "revolut",
    posted_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

// ─── Filter Out Expired / Stale Jobs ──────────────────────────────────────────
export function eliminateExpiredJobs(jobs: UnifiedJob[]): UnifiedJob[] {
  const now = Date.now();
  return jobs.filter((job) => {
    // 1. If explicit expiration date exists and is in the past, eliminate it
    if (job.expires_at) {
      const expTime = new Date(job.expires_at).getTime();
      if (!isNaN(expTime) && expTime < now) {
        return false;
      }
    }

    // 2. If posted date is older than 30 days, eliminate it as stale
    if (job.posted_at) {
      const postTime = new Date(job.posted_at).getTime();
      if (!isNaN(postTime) && now - postTime > MAX_JOB_AGE_MS) {
        return false;
      }
    }

    return true;
  });
}

// ─── Fetch from Adzuna (Tamil Nadu & India Tech Jobs - Max 5 Days Old) ────────
async function fetchFromAdzunaTN(): Promise<UnifiedJob[]> {
  const appId = API_CONFIG.ADZUNA_APP_ID;
  const appKey = API_CONFIG.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&where=tamil%20nadu&content-type=application/json&max_days_old=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j: any) => ({
      job_id: `adzuna-${j.id}`,
      title: j.title ? j.title.replace(/<\/?[^>]+(>|$)/g, "").trim() : "Software Engineer",
      company_name: j.company?.display_name || "Tamil Nadu Tech",
      location: j.location?.display_name || "Chennai, Tamil Nadu",
      country: "India" as const,
      description: j.description ? j.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300).trim() : "",
      salary:
        j.salary_min && j.salary_max
          ? `₹${Math.round(j.salary_min / 100000)}L – ₹${Math.round(j.salary_max / 100000)}L/yr`
          : "Competitive (INR)",
      apply_link: j.redirect_url,
      thumbnail: null,
      schedule_type: j.contract_time === "full_time" ? "Full-time" : "Full-time / On-site",
      source: "adzuna_tn",
      posted_at: j.created || new Date().toISOString(),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Fetch from Jobicy (Worldwide Remote) ──────────────────────────────────────
async function fetchFromJobicy(): Promise<UnifiedJob[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `${API_CONFIG.JOBICY_ENDPOINT}?count=30&industry=engineering`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      job_id: `jobicy-${j.id}`,
      title: j.jobTitle,
      company_name: j.companyName,
      location: j.jobGeo || "Worldwide Remote",
      country: detectRegion(j.jobGeo || "Worldwide"),
      description: j.jobExcerpt || "",
      salary: j.annualSalaryMin ? `$${j.annualSalaryMin}–${j.annualSalaryMax}k/yr` : "Competitive",
      apply_link: j.url,
      thumbnail: j.companyLogo || null,
      schedule_type: "Remote",
      source: "jobicy",
      posted_at: j.pubDate || new Date().toISOString(),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Fetch from Remotive (Worldwide Remote) ───────────────────────────────────
async function fetchFromRemotive(): Promise<UnifiedJob[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `${API_CONFIG.REMOTIVE_ENDPOINT}?category=software-dev&limit=30`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      job_id: `remotive-${j.id}`,
      title: j.title,
      company_name: j.company_name,
      location: j.candidate_required_location || "Worldwide Remote",
      country: detectRegion(j.candidate_required_location || "Worldwide"),
      description: j.description ? j.description.replace(/<[^>]*>/g, "").slice(0, 250) : "",
      salary: j.salary || "Competitive",
      apply_link: j.url,
      thumbnail: j.company_logo || null,
      schedule_type: "Remote",
      source: "remotive",
      posted_at: j.publication_date || new Date().toISOString(),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Unified One-Time Global Feed Fetcher (Zero-Waste Central DB Sync) ─────────
export async function getUnifiedGlobalJobs(forceRefresh: boolean = false): Promise<UnifiedJob[]> {
  // 1. Local Device Cache Check (Memory or AsyncStorage)
  if (!forceRefresh) {
    const fastMem = getMem<UnifiedJob[]>(CACHE_KEY);
    if (fastMem && fastMem.length > 0) return fastMem;

    const fastStorage = await getCached<UnifiedJob[]>(CACHE_KEY, CACHE_TTL_MS);
    if (fastStorage && fastStorage.length > 0) {
      setMem(CACHE_KEY, fastStorage);
      return fastStorage;
    }

    // 2. Central Shared DB Cache Check (Firestore) -> Zero API calls wasted for subsequent users!
    try {
      const docRef = doc(db, "global_jobs", "master_feed_v1");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        const age = Date.now() - (cloudData.updated_at || 0);
        const DB_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours TTL for shared DB
        if (age < DB_CACHE_TTL && Array.isArray(cloudData.jobs) && cloudData.jobs.length > 0) {
          console.log(`[JobsFeed] Reusing Firestore Central Master Feed (${cloudData.jobs.length} jobs) - 0 API calls wasted.`);
          const scraped = await getSavedScrapedJobs();
          const merged = [...scraped, ...cloudData.jobs];
          setMem(CACHE_KEY, merged);
          await setCached(CACHE_KEY, merged).catch(() => {});
          return merged;
        }
      }
    } catch {
      // Continue to live fetch if offline or first time setup
    }
  }

  // 3. Reuse active in-flight request if another caller is already fetching (single-call guarantee)
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    // 4. Fetch live data simultaneously: Adzuna (Tamil Nadu) + Jobicy + Remotive
    try {
      const [adzunaRes, jobicyRes, remotiveRes] = await Promise.allSettled([
        fetchFromAdzunaTN(),
        fetchFromJobicy(),
        fetchFromRemotive(),
      ]);

      const liveJobs: UnifiedJob[] = [];

      if (adzunaRes.status === "fulfilled" && adzunaRes.value.length > 0) {
        liveJobs.push(...adzunaRes.value);
      }

      if (jobicyRes.status === "fulfilled" && jobicyRes.value.length > 0) {
        liveJobs.push(...jobicyRes.value);
      }

      if (remotiveRes.status === "fulfilled" && remotiveRes.value.length > 0) {
        liveJobs.push(...remotiveRes.value);
      }

      // Combine with user-scraped jobs & baseline curated jobs
      const scraped = await getSavedScrapedJobs();
      const combined = [...scraped, ...liveJobs, ...BASELINE_GLOBAL_JOBS];

      // Deduplicate by title + company
      const seen = new Set<string>();
      const deduplicated: UnifiedJob[] = [];

      for (const job of combined) {
        const key = `${job.title.toLowerCase().trim()}::${job.company_name.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(job);
        }
      }

      // Separate into balanced buckets so list has rich Tamil Nadu, India, Remote, and Global options
      const indiaList = deduplicated.filter(
        (j) =>
          j.country === "India" ||
          j.location.toLowerCase().includes("india") ||
          j.location.toLowerCase().includes("tamil") ||
          j.location.toLowerCase().includes("chennai") ||
          j.location.toLowerCase().includes("coimbatore") ||
          j.location.toLowerCase().includes("bangalore") ||
          j.salary.includes("₹"),
      );
      const remoteList = deduplicated.filter(
        (j) =>
          j.schedule_type.toLowerCase().includes("remote") ||
          j.country === "Worldwide Remote" ||
          j.location.toLowerCase().includes("worldwide"),
      );
      const globalList = deduplicated.filter(
        (j) =>
          j.country !== "India" &&
          !j.location.toLowerCase().includes("india") &&
          !j.location.toLowerCase().includes("tamil") &&
          !j.schedule_type.toLowerCase().includes("remote"),
      );

      // Interleave so user sees a rich mix right away!
      const balanced: UnifiedJob[] = [];
      const maxLen = Math.max(indiaList.length, remoteList.length, globalList.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < indiaList.length) balanced.push(indiaList[i]);
        if (i < remoteList.length) balanced.push(remoteList[i]);
        if (i < globalList.length) balanced.push(globalList[i]);
      }

      // Add any remaining unique jobs
      for (const j of deduplicated) {
        if (!balanced.some((b) => b.job_id === j.job_id)) {
          balanced.push(j);
        }
      }

      // Eliminate expired jobs
      const activeJobs = eliminateExpiredJobs(balanced);

      // Persist to Central Shared Firestore DB so NO other user needs to call the API
      try {
        const docRef = doc(db, "global_jobs", "master_feed_v1");
        await setDoc(docRef, {
          jobs: activeJobs.slice(0, 150),
          updated_at: Date.now(),
          total_count: activeJobs.length,
        });
        console.log("[JobsFeed] Saved fresh master feed to Central Firestore DB.");
      } catch (err) {
        console.log("[JobsFeed] Firestore write warning (proceeding with local cache):", err);
      }

      // Save to Cache (both memory & persistent storage)
      setMem(CACHE_KEY, activeJobs);
      await setCached(CACHE_KEY, activeJobs).catch(() => {});

      return activeJobs;
    } catch (error) {
      // Fail-soft: fallback to baseline curated jobs if network completely drops
      const baseline = eliminateExpiredJobs(BASELINE_GLOBAL_JOBS);
      setMem(CACHE_KEY, baseline);
      return baseline;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

// ─── Filter Stored Global Jobs (Fuzzy & Typo-Tolerant, Zero Network Calls) ────
export interface JobFilterOptions {
  roleQuery?: string;
  locationQuery?: string;
  searchQuery?: string;
  countryFilter?: string;
  tab?: "all" | "india" | "remote" | "global" | "verified";
  // ── Recommended Smart Filters ──
  remoteOnly?: boolean;
  fullTimeOnly?: boolean;
  freshersOnly?: boolean;
  thisWeekOnly?: boolean;
  matchMyResume?: boolean;
  userSkills?: string[];
}

// Common tech role aliases, framework-to-role mappings, and bidirectional synonyms
const ROLE_ALIASES: Record<string, string[]> = {
  // Common Abbreviations
  sde: ["software", "development", "engineer", "developer"],
  swe: ["software", "engineer", "developer"],
  dev: ["developer", "development", "engineer"],
  fe: ["frontend", "front-end", "web", "ui", "react", "vue", "angular", "javascript"],
  be: ["backend", "back-end", "server", "api", "node", "python", "java", "golang"],
  fs: ["fullstack", "full-stack", "software", "web", "developer", "engineer"],
  rn: ["react", "native", "mobile", "app", "ios", "android"],
  qa: ["quality", "assurance", "tester", "testing", "sdet", "automation"],
  ai: ["artificial", "intelligence", "machine", "learning", "ml", "data", "deep"],
  ml: ["machine", "learning", "ai", "data", "deep", "nlp"],
  pm: ["product", "project", "manager"],
  ui: ["user", "interface", "design", "designer", "frontend", "web"],
  ux: ["user", "experience", "design", "designer"],
  devops: ["devops", "cloud", "sre", "infrastructure", "platform", "aws", "docker", "kubernetes"],
  sre: ["site", "reliability", "engineer", "devops", "infrastructure"],
  ds: ["data", "science", "scientist", "analyst"],

  // Frontend Ecosystem <-> Role (Bidirectional: Searching "react js" matches "Frontend Developer" & vice versa)
  react: ["frontend", "front-end", "web", "ui", "fullstack", "full-stack", "developer", "engineer", "javascript", "typescript", "reactjs"],
  reactjs: ["frontend", "front-end", "web", "ui", "fullstack", "developer", "engineer", "react"],
  vue: ["frontend", "front-end", "web", "ui", "developer", "engineer", "javascript"],
  vuejs: ["frontend", "front-end", "web", "ui", "developer", "engineer", "vue"],
  angular: ["frontend", "front-end", "web", "ui", "developer", "engineer", "typescript"],
  angularjs: ["frontend", "front-end", "web", "ui", "developer", "engineer"],
  nextjs: ["frontend", "front-end", "web", "fullstack", "react", "developer"],
  next: ["frontend", "front-end", "web", "fullstack", "react"],
  svelte: ["frontend", "front-end", "web", "ui", "developer"],
  html: ["frontend", "web", "ui", "developer"],
  css: ["frontend", "web", "ui", "styling", "developer"],
  tailwind: ["frontend", "web", "ui", "developer"],
  javascript: ["frontend", "backend", "web", "fullstack", "developer", "engineer", "software"],
  typescript: ["frontend", "backend", "web", "fullstack", "developer", "engineer", "software"],
  frontend: ["frontend", "front-end", "react", "reactjs", "vue", "angular", "nextjs", "web", "ui", "html", "css", "javascript", "typescript", "developer"],
  "front-end": ["frontend", "front-end", "react", "reactjs", "vue", "angular", "web", "ui", "developer"],

  // Backend Ecosystem <-> Role (Bidirectional: Searching "node js" matches "Backend Engineer" & vice versa)
  node: ["backend", "back-end", "server", "api", "fullstack", "developer", "engineer", "nodejs", "javascript"],
  nodejs: ["backend", "back-end", "server", "api", "fullstack", "developer", "engineer", "node"],
  express: ["backend", "back-end", "node", "api", "developer"],
  python: ["backend", "back-end", "data", "ai", "machine", "learning", "django", "fastapi", "developer", "engineer", "software"],
  django: ["backend", "back-end", "python", "web", "api", "developer"],
  fastapi: ["backend", "back-end", "python", "api", "developer"],
  flask: ["backend", "back-end", "python", "api", "developer"],
  java: ["backend", "back-end", "spring", "enterprise", "software", "developer", "engineer", "springboot"],
  spring: ["backend", "back-end", "java", "enterprise", "springboot", "developer"],
  springboot: ["backend", "back-end", "java", "spring", "enterprise", "developer"],
  golang: ["backend", "back-end", "cloud", "distributed", "systems", "go", "developer", "engineer"],
  go: ["backend", "back-end", "cloud", "systems", "golang", "developer"],
  csharp: ["backend", "back-end", "dotnet", "software", "developer", "engineer"],
  dotnet: ["backend", "back-end", "csharp", "enterprise", "developer", "software"],
  php: ["backend", "back-end", "web", "laravel", "developer"],
  laravel: ["backend", "back-end", "php", "web", "developer"],
  ruby: ["backend", "back-end", "rails", "web", "developer"],
  rails: ["backend", "back-end", "ruby", "web", "developer"],
  backend: ["backend", "back-end", "node", "nodejs", "python", "java", "spring", "golang", "api", "server", "database", "developer", "engineer"],
  "back-end": ["backend", "back-end", "node", "python", "java", "api", "server", "developer"],

  // Mobile Ecosystem <-> Role
  mobile: ["mobile", "react", "native", "flutter", "android", "ios", "app", "swift", "kotlin", "developer", "engineer"],
  flutter: ["mobile", "app", "dart", "ios", "android", "developer", "engineer"],
  dart: ["mobile", "flutter", "app", "developer"],
  android: ["mobile", "app", "kotlin", "java", "developer", "engineer"],
  ios: ["mobile", "app", "swift", "developer", "engineer"],
  swift: ["mobile", "ios", "app", "developer"],
  kotlin: ["mobile", "android", "backend", "app", "developer"],

  // Full Stack
  fullstack: ["fullstack", "full-stack", "frontend", "backend", "mern", "mean", "software", "web", "developer", "engineer"],
  "full-stack": ["fullstack", "full-stack", "frontend", "backend", "software", "web", "developer"],
  mern: ["fullstack", "react", "node", "mongodb", "express", "developer"],

  // Cloud & DevOps
  cloud: ["cloud", "aws", "azure", "gcp", "devops", "infrastructure", "platform", "engineer"],
  aws: ["cloud", "devops", "infrastructure", "sre", "engineer"],
  azure: ["cloud", "devops", "infrastructure", "engineer"],
  gcp: ["cloud", "devops", "infrastructure", "engineer"],
  docker: ["devops", "cloud", "infrastructure", "backend", "engineer"],
  kubernetes: ["devops", "cloud", "infrastructure", "k8s", "sre", "engineer"],
  k8s: ["kubernetes", "devops", "cloud", "infrastructure", "engineer"],
  terraform: ["devops", "cloud", "infrastructure", "iac", "engineer"],

  // Testing & QA
  tester: ["qa", "quality", "assurance", "testing", "sdet", "automation", "engineer"],
  testing: ["qa", "tester", "quality", "sdet", "automation", "engineer"],
  selenium: ["qa", "testing", "tester", "automation", "sdet"],
  playwright: ["qa", "testing", "tester", "automation", "sdet"],
  sdet: ["qa", "software", "development", "engineer", "testing", "automation"],
};

// Common geographic aliases & typo mappings
const LOCATION_ALIASES: Record<string, string[]> = {
  tn: ["tamil", "nadu", "tamilnadu", "chennai", "coimbatore", "madurai", "trichy", "salem"],
  tamilnadu: ["tamil", "nadu", "tamilnadu", "chennai", "coimbatore", "madurai", "trichy", "salem"],
  "tamil nadu": ["tamil", "nadu", "tamilnadu", "chennai", "coimbatore", "madurai", "trichy", "salem"],
  chn: ["chennai", "tamil", "nadu"],
  chenai: ["chennai"],
  blr: ["bangalore", "bengaluru", "karnataka"],
  banglore: ["bangalore", "bengaluru"],
  bengaluru: ["bangalore"],
  hyd: ["hyderabad", "telangana"],
  hydrabad: ["hyderabad"],
  ncr: ["delhi", "gurgaon", "noida", "gurugram"],
  gurugram: ["gurgaon"],
  wfh: ["remote", "worldwide", "anywhere"],
  remote: ["remote", "worldwide", "anywhere", "wfh"],
  us: ["usa", "united states", "america"],
  usa: ["united states", "us", "america"],
  uk: ["united kingdom", "london", "england"],
  in: ["india", "bharat"],
  india: ["india", "bangalore", "chennai", "hyderabad", "pune", "mumbai", "gurgaon", "coimbatore"],
};

// Fast Levenshtein distance with early bail-out
function fastLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val = prev;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

// Matches single search token against target text words
function matchTokenAgainstWords(token: string, words: string[]): boolean {
  if (!token || !words.length) return false;
  const tLen = token.length;

  for (const w of words) {
    if (w === token) return true;
    if (w.startsWith(token) && tLen >= 2) return true;
    if (w.includes(token) && tLen >= 3) return true;
    if (token.includes(w) && w.length >= 3) return true;

    // Fuzzy typo check (1 typo for 4..6 chars, 2 typos for >=7 chars)
    if (tLen >= 4) {
      const maxDist = tLen <= 6 ? 1 : 2;
      if (fastLevenshtein(token, w) <= maxDist) return true;
    }
  }
  return false;
}

// Normalize compound tech queries like 'react js' -> 'react', 'node js' -> 'node'
function normalizeSearchQuery(query: string): { normalizedTokens: string[]; rawClean: string } {
  let q = query.toLowerCase().trim();
  // Normalize framework compounds: 'react js', 'react.js', 'reactjs' -> 'react'
  q = q.replace(/\b(react|node|vue|next|nest|express|angular)\s*\.?\s*js\b/gi, "$1");
  q = q.replace(/\b(react|node|vue|next|nest|express|angular)js\b/gi, "$1");
  q = q.replace(/\b(react)\s*-\s*(native)\b/gi, "rn $1 $2");
  q = q.replace(/\b(full)\s*-\s*(stack)\b/gi, "fullstack");
  q = q.replace(/\b(front)\s*-\s*(end)\b/gi, "frontend");
  q = q.replace(/\b(back)\s*-\s*(end)\b/gi, "backend");

  const tokens = q.split(/[\s,+/_-]+/).filter(Boolean);
  // Remove standalone 'js' or 'ts' if preceded by a framework keyword so it doesn't fail strict token matching
  const hasFramework = tokens.some((t) => ["react", "node", "vue", "next", "nest", "express", "angular"].includes(t));
  const filteredTokens = hasFramework ? tokens.filter((t) => t !== "js" && t !== "ts") : tokens;

  return { normalizedTokens: filteredTokens, rawClean: q };
}

// Fuzzy & typo-tolerant text matching
function fuzzyMatchText(query: string, targetText: string, aliases: Record<string, string[]> = {}): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText) return false;

  const cleanQuery = query.toLowerCase().trim();
  const cleanTarget = targetText.toLowerCase();

  // 1. Direct contains check (fastest)
  if (cleanTarget.includes(cleanQuery)) return true;

  // 2. Space/punctuation-compressed check (e.g. 'tamilnadu' matches 'Tamil Nadu', 'fullstack' matches 'Full Stack')
  const compressedQuery = cleanQuery.replace(/[^a-z0-9]/g, "");
  const compressedTarget = cleanTarget.replace(/[^a-z0-9]/g, "");
  if (compressedQuery && compressedTarget.includes(compressedQuery)) return true;

  // 3. Tokenize query with normalization and target words
  const { normalizedTokens } = normalizeSearchQuery(cleanQuery);
  const targetWords = cleanTarget.split(/[^a-z0-9]+/).filter((w) => w.length > 0);

  // Every token in query must match target or an alias expansion
  return normalizedTokens.every((token) => {
    if (matchTokenAgainstWords(token, targetWords)) return true;

    // Direct alias / semantic expansion check
    const expansion = aliases[token];
    if (expansion && expansion.some((aliasWord) => matchTokenAgainstWords(aliasWord, targetWords))) {
      return true;
    }

    // Fuzzy match on alias keys (e.g. 'chenai' matches alias key 'chennai')
    for (const [aliasKey, aliasWords] of Object.entries(aliases)) {
      if (token.length >= 4 && fastLevenshtein(token, aliasKey) <= 1) {
        if (aliasWords.some((aliasWord) => matchTokenAgainstWords(aliasWord, targetWords))) {
          return true;
        }
      }
    }

    return false;
  });
}

// Relevance score for ranking search results
function computeJobMatchScore(
  job: UnifiedJob,
  roleQuery: string,
  locationQuery: string,
  searchQuery: string,
  userSkills?: string[]
): number {
  let score = 0;

  if (roleQuery) {
    const q = roleQuery.toLowerCase().trim();
    const title = job.title.toLowerCase();
    const company = job.company_name.toLowerCase();

    if (title.includes(q)) score += 100;
    else if (fuzzyMatchText(q, job.title, ROLE_ALIASES)) score += 70;

    if (company.includes(q)) score += 60;
    else if (fuzzyMatchText(q, job.company_name, ROLE_ALIASES)) score += 40;

    if (job.description.toLowerCase().includes(q)) score += 20;
    else if (fuzzyMatchText(q, job.description, ROLE_ALIASES)) score += 10;
  }

  if (locationQuery) {
    const loc = locationQuery.toLowerCase().trim();
    const jobLoc = job.location.toLowerCase();
    const jobCountry = job.country.toLowerCase();

    if (jobLoc.includes(loc)) score += 80;
    else if (jobCountry.includes(loc)) score += 60;
    else if (fuzzyMatchText(loc, `${job.location} ${job.country} ${job.schedule_type}`, LOCATION_ALIASES)) {
      score += 40;
    }
  }

  if (searchQuery) {
    const sq = searchQuery.toLowerCase().trim();
    if (job.title.toLowerCase().includes(sq)) score += 50;
    else if (fuzzyMatchText(sq, `${job.title} ${job.company_name} ${job.location}`, ROLE_ALIASES)) score += 30;
  }

  // Bonus relevance boost for user resume skill overlap
  if (userSkills && userSkills.length > 0) {
    const fullText = `${job.title} ${job.description}`.toLowerCase();
    for (const s of userSkills) {
      const sk = s.toLowerCase().trim();
      if (sk.length >= 2 && fuzzyMatchText(sk, fullText, ROLE_ALIASES)) {
        score += 20;
      }
    }
  }

  return score;
}

export function filterStoredJobs(
  masterJobs: UnifiedJob[],
  options: JobFilterOptions = {}
): UnifiedJob[] {
  const {
    roleQuery = "",
    locationQuery = "",
    searchQuery = "",
    countryFilter = "All",
    tab = "all",
    remoteOnly = false,
    fullTimeOnly = false,
    freshersOnly = false,
    thisWeekOnly = false,
    matchMyResume = false,
    userSkills = [],
  } = options;

  const hasSearch = Boolean(
    roleQuery.trim() ||
    locationQuery.trim() ||
    searchQuery.trim() ||
    remoteOnly ||
    fullTimeOnly ||
    freshersOnly ||
    thisWeekOnly ||
    matchMyResume
  );

  const filtered = masterJobs.filter((job) => {
    // 1. Tab Filtering
    if (tab === "india") {
      const isIndia =
        job.country === "India" ||
        job.location.toLowerCase().includes("india") ||
        job.location.toLowerCase().includes("bangalore") ||
        job.location.toLowerCase().includes("chennai") ||
        job.location.toLowerCase().includes("hyderabad") ||
        job.location.toLowerCase().includes("pune") ||
        job.location.toLowerCase().includes("mumbai") ||
        job.location.toLowerCase().includes("gurgaon") ||
        job.location.toLowerCase().includes("coimbatore") ||
        job.salary.includes("₹");
      if (!isIndia) return false;
    }

    if (tab === "remote") {
      const isRemote =
        job.schedule_type.toLowerCase().includes("remote") ||
        job.country === "Worldwide Remote" ||
        job.location.toLowerCase().includes("remote") ||
        job.location.toLowerCase().includes("worldwide") ||
        job.location.toLowerCase().includes("anywhere");
      if (!isRemote) return false;
    }

    if (tab === "global") {
      // Global / US / Europe / Canada / APAC (excluding domestic non-remote India roles)
      const isDomesticIndia =
        (job.country === "India" || job.location.toLowerCase().includes("india")) &&
        !job.schedule_type.toLowerCase().includes("remote");
      if (isDomesticIndia) return false;
    }

    // 2. Role / Skill Entry (Typo-tolerant & fuzzy matching across Title, Company, Description)
    if (roleQuery.trim()) {
      const titleMatch = fuzzyMatchText(roleQuery, job.title, ROLE_ALIASES);
      const companyMatch = fuzzyMatchText(roleQuery, job.company_name, ROLE_ALIASES);
      const descMatch = fuzzyMatchText(roleQuery, job.description, ROLE_ALIASES);
      if (!titleMatch && !companyMatch && !descMatch) {
        return false;
      }
    }

    // 3. Location Entry (Typo-tolerant & fuzzy matching across Location, Country, Schedule, and TN/IN aliases)
    if (locationQuery.trim()) {
      const locText = `${job.location} ${job.country} ${job.schedule_type}`;
      const locMatch = fuzzyMatchText(locationQuery, locText, LOCATION_ALIASES);
      if (!locMatch) {
        return false;
      }
    }

    // 4. General Search Query (if any)
    if (searchQuery.trim()) {
      const targetAll = `${job.title} ${job.company_name} ${job.location} ${job.description}`;
      if (!fuzzyMatchText(searchQuery, targetAll, ROLE_ALIASES)) {
        return false;
      }
    }

    // 5. Country Filter (if specific country is selected)
    if (countryFilter && countryFilter !== "All" && countryFilter !== "All Regions") {
      if (
        job.country !== countryFilter &&
        !job.location.toLowerCase().includes(countryFilter.toLowerCase())
      ) {
        return false;
      }
    }

    // 6. Work Mode Filter: Remote Only
    if (remoteOnly) {
      const isRemote =
        job.schedule_type.toLowerCase().includes("remote") ||
        job.country === "Worldwide Remote" ||
        job.location.toLowerCase().includes("remote") ||
        job.location.toLowerCase().includes("worldwide") ||
        job.location.toLowerCase().includes("wfh") ||
        job.location.toLowerCase().includes("anywhere");
      if (!isRemote) return false;
    }

    // 7. Job Schedule: Full-Time Only
    if (fullTimeOnly) {
      const isFullTime =
        job.schedule_type.toLowerCase().includes("full-time") ||
        job.schedule_type.toLowerCase().includes("full time") ||
        job.schedule_type.toLowerCase().includes("permanent");
      if (!isFullTime) return false;
    }

    // 8. Experience Level: Freshers / Entry Level Only
    if (freshersOnly) {
      const titleLower = job.title.toLowerCase();
      const descLower = job.description.toLowerCase();
      // Exclude Senior / Lead / Staff / Architect / Director roles
      const isSenior = /\b(senior|sr|lead|staff|principal|architect|director|head|vp|manager)\b/i.test(titleLower);
      if (isSenior) return false;
      // Allow if mentions entry/junior/fresher/trainee/intern/graduate or no high experience requirements
      const requiresHighExp = /\b([3-9]|1\d)\+?\s*years?\b/i.test(descLower);
      const hasFresherIndicator = /\b(fresher|entry|junior|jr|graduate|trainee|intern|internship|associate|0-1|0-2|1-2)\b/i.test(
        `${titleLower} ${descLower}`
      );
      if (requiresHighExp && !hasFresherIndicator) return false;
    }

    // 9. Recency Filter: This Week Only (Past 7 Days)
    if (thisWeekOnly) {
      if (job.posted_at) {
        const postTime = new Date(job.posted_at).getTime();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(postTime) && Date.now() - postTime > SEVEN_DAYS_MS) {
          return false;
        }
      }
    }

    // 10. Match My Resume (Filter jobs by user's resume skills)
    if (matchMyResume && userSkills && userSkills.length > 0) {
      const fullText = `${job.title} ${job.description} ${job.company_name}`.toLowerCase();
      const hasSkillMatch = userSkills.some((s) => {
        const sk = s.toLowerCase().trim();
        if (sk.length < 2) return false;
        return fuzzyMatchText(sk, fullText, ROLE_ALIASES);
      });
      if (!hasSkillMatch) return false;
    }

    return true;
  });

  // If the user entered search terms or active filters, rank by relevance score so best matches appear first!
  if (hasSearch) {
    return [...filtered].sort((a, b) => {
      const scoreA = computeJobMatchScore(a, roleQuery, locationQuery, searchQuery, userSkills);
      const scoreB = computeJobMatchScore(b, roleQuery, locationQuery, searchQuery, userSkills);
      return scoreB - scoreA;
    });
  }

  return filtered;
}

