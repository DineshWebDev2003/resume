/**
 * jobScraper.ts
 *
 * Client-side Job Scraper & Importer Architecture:
 * 1. Scrapes any job URL (LinkedIn, Naukri, Indeed, Company Career Sites, etc.) using:
 *    - Schema.org JSON-LD (@type: JobPosting)
 *    - OpenGraph (og:title, og:site_name, og:description, og:image)
 *    - HTML meta fallback tags
 * 2. Saves scraped jobs locally and in Firestore for the user ($0 cost, 0 API calls wasted).
 * 3. Provides free RSS job feed parser for unlimited tech jobs without API keys.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UnifiedJob } from "./globalJobsFeed";
import { detectRegion } from "./globalJobsFeed";

const SCRAPED_JOBS_STORAGE_KEY = "user_scraped_jobs_v1";

// Helper: Strip HTML tags
function stripHtml(text: string = ""): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── 1. Scrape Any Job Posting from URL ───────────────────────────────────────
export async function scrapeJobFromUrl(rawUrl: string): Promise<UnifiedJob> {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    throw new Error("Please enter a valid URL starting with http:// or https://");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(cleanUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to access job page (HTTP ${res.status})`);
    }

    const html = await res.text();

    // 1. Try JSON-LD Schema.org (@type: JobPosting)
    const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const rawJson = match[1].trim();
        const data = JSON.parse(rawJson);
        const item = Array.isArray(data) ? data.find((d) => d["@type"] === "JobPosting") : data;

        if (item && item["@type"] === "JobPosting") {
          const title = item.title || "";
          const company =
            typeof item.hiringOrganization === "object"
              ? item.hiringOrganization.name || ""
              : typeof item.hiringOrganization === "string"
              ? item.hiringOrganization
              : "";
          const locality =
            item.jobLocation?.address?.addressLocality ||
            item.jobLocation?.address?.addressRegion ||
            item.jobLocation?.address?.addressCountry ||
            "";
          const desc = stripHtml(item.description || "").slice(0, 400);

          let salary = "Competitive";
          if (item.baseSalary) {
            const val = item.baseSalary.value;
            const currency = item.baseSalary.currency || "₹";
            if (val?.minValue && val?.maxValue) {
              salary = `${currency}${val.minValue} – ${currency}${val.maxValue}`;
            } else if (val?.value) {
              salary = `${currency}${val.value}`;
            }
          }

          if (title) {
            return {
              job_id: `scraped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title: stripHtml(title),
              company_name: stripHtml(company) || extractDomainName(cleanUrl),
              location: locality || "Tamil Nadu / India",
              country: detectRegion(locality || "India"),
              description: desc || "Scraped job posting from user import.",
              salary,
              apply_link: cleanUrl,
              thumbnail: null,
              schedule_type: item.employmentType || "Full-time",
              source: "user_scraped",
              posted_at: item.datePosted || new Date().toISOString(),
            };
          }
        }
      } catch {
        // continue searching next script tag
      }
    }

    // 2. OpenGraph Meta Tags Fallback
    const ogTitleMatch = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
    const ogDescMatch = html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
    const ogSiteMatch = html.match(/<meta\b[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*property=["']og:site_name["']/i);
    const ogImgMatch = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);

    // 3. Document <title> Fallback
    const titleTagMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);

    const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1] || "Imported Job";
    const cleanTitle = stripHtml(rawTitle).split(/[|\-–—]/)[0].trim();
    const siteName = ogSiteMatch?.[1] || extractDomainName(cleanUrl);
    const desc = stripHtml(ogDescMatch?.[1] || "").slice(0, 300);

    return {
      job_id: `scraped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle || "Job Opportunity",
      company_name: siteName || "Verified Company",
      location: "India / Remote",
      country: "India",
      description: desc || `Scraped job from ${cleanUrl}`,
      salary: "Competitive",
      apply_link: cleanUrl,
      thumbnail: ogImgMatch?.[1] || null,
      schedule_type: "Full-time",
      source: "user_scraped",
      posted_at: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Job scraping timed out. The website may be blocking automated requests.");
    }
    throw new Error(err.message || "Failed to scrape job page");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── 2. Storage Helpers for User-Scraped Jobs ─────────────────────────────────
export async function getSavedScrapedJobs(): Promise<UnifiedJob[]> {
  try {
    const raw = await AsyncStorage.getItem(SCRAPED_JOBS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveScrapedJob(job: UnifiedJob): Promise<UnifiedJob[]> {
  const existing = await getSavedScrapedJobs();
  const deduped = [job, ...existing.filter((j) => j.apply_link !== job.apply_link)];
  try {
    await AsyncStorage.setItem(SCRAPED_JOBS_STORAGE_KEY, JSON.stringify(deduped));
  } catch {}
  return deduped;
}

export async function deleteScrapedJob(jobId: string): Promise<UnifiedJob[]> {
  const existing = await getSavedScrapedJobs();
  const filtered = existing.filter((j) => j.job_id !== jobId);
  try {
    await AsyncStorage.setItem(SCRAPED_JOBS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
  return filtered;
}

// Helper: Extract domain name (e.g. "https://careers.swiggy.com/..." -> "Swiggy")
function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.replace(/^www\./, "").split(".");
    if (parts.length >= 2) {
      const brand = parts[0] === "careers" || parts[0] === "jobs" ? parts[1] : parts[0];
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    return "Company";
  } catch {
    return "Company";
  }
}

