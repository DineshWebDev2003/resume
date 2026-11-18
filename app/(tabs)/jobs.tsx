import { GlassCard } from "@/components/glass-card";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useJobStore } from "@/hooks/use-job-store";
import { useAutoApplySettings } from "@/hooks/use-auto-apply";
import { AutoApplyBadge } from "@/components/AutoApplyBadge";
import { processAutoApplyBatch, getAutoApplyContext } from "@/services/autoApply";
import type { AutoApplyJob } from "@/services/autoApply";
import type { AutoApplyStatus } from "@/constants/autoApply";
import { auth } from "@/services/firebase";
import { getAutoApplyRecords, saveAutoApplyRecord } from "@/services/firestore";
import { notifyHighMatchJobs } from "@/services/autoApplyNotifier";
import { useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import {
  getUnifiedGlobalJobs,
  filterStoredJobs,
  UnifiedJob,
} from "@/services/globalJobsFeed";
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  Globe,
  Heart,
  Link as LinkIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scrapeJobFromUrl, saveScrapedJob } from "@/services/jobScraper";

const { width } = Dimensions.get("window");

// ─── Tab types ───────────────────────────────────────────────────────────────
type ActiveTab = "india" | "remote" | "verified";

// ─── Helper: Format Posted Date ───────────────────────────────────────────────
function formatPostedDate(dateStr?: string | number): string {
  if (!dateStr) return "Recently";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  } catch {
    return "Recently";
  }
}

// ─── Helper: Extract Company Monogram / Initials ──────────────────────────────
function getCompanyMonogram(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

// ─── Curated High-Growth India Tech Roles (Active Fallback) ──────────────────
const CURATED_INDIA_JOBS: any[] = [
  {
    job_id: "curated-in-1",
    title: "Software Development Engineer (Frontend/Mobile)",
    company_name: "Swiggy",
    location: "Bangalore",
    description: "Looking for an SDE to build delightful customer and partner experiences using React Native, TypeScript, and modern state architectures.",
    salary: "₹18L – ₹28L/yr",
    schedule_type: "Full-time",
    apply_link: "https://careers.swiggy.com",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-2",
    title: "Product Engineer (Full Stack)",
    company_name: "Zoho Corporation",
    location: "Chennai",
    description: "Build robust SaaS products serving 100M+ users globally. Work with Java, JavaScript/TypeScript, scalable cloud systems, and privacy-first engineering.",
    salary: "₹10L – ₹18L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.zoho.com/careers/",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-3",
    title: "Senior React Native / Mobile Developer",
    company_name: "Zomato",
    location: "Gurgaon",
    description: "Architect and lead our core mobile ordering and delivery consumer application with ultra-fast startup times and smooth 60fps animations.",
    salary: "₹24L – ₹36L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.zomato.com/careers",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-4",
    title: "UI/UX & Frontend Engineer",
    company_name: "Freshworks",
    location: "Chennai",
    description: "Design and implement intuitive customer engagement experiences on Freshdesk & Freshservice using Ember, React, and design systems.",
    salary: "₹14L – ₹24L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.freshworks.com/company/careers/",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-5",
    title: "Cloud Infrastructure & DevOps Engineer",
    company_name: "Flipkart",
    location: "Bangalore",
    description: "Manage large-scale Kubernetes clusters, distributed Kafka pipelines, automated CI/CD deployments, and high-availability cloud infrastructure.",
    salary: "₹22L – ₹34L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.flipkartcareers.com",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-6",
    title: "Backend Platform Engineer (Go / Java)",
    company_name: "PhonePe",
    location: "Bangalore",
    description: "Design low-latency microservices handling millions of UPI transactions per minute with 99.999% uptime and bulletproof transaction safety.",
    salary: "₹25L – ₹40L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.phonepe.com/careers/",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-7",
    title: "Enterprise Solutions Developer",
    company_name: "TCS",
    location: "Chennai",
    description: "Lead enterprise modernization for Fortune 500 financial clients with Java Spring Boot, microservices, and cloud-native solutions.",
    salary: "₹8L – ₹16L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.tcs.com/careers",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-8",
    title: "Senior Systems Engineer",
    company_name: "Infosys",
    location: "Pune",
    description: "Develop cutting-edge digital transformation platforms, microservices architectures, and automated testing pipelines for global clients.",
    salary: "₹9L – ₹18L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.infosys.com/careers.html",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-9",
    title: "Cloud Support & Systems Engineer",
    company_name: "Amazon Development Centre",
    location: "Hyderabad",
    description: "Work directly with AWS cloud architectures, troubleshooting distributed enterprise systems and ensuring optimal cloud performance.",
    salary: "₹16L – ₹28L/yr",
    schedule_type: "Full-time",
    apply_link: "https://www.amazon.jobs/en/locations/hyderabad-india",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
  },
  {
    job_id: "curated-in-10",
    title: "Software Engineer II (Full Stack)",
    company_name: "Microsoft IDC",
    location: "Hyderabad",
    description: "Join the Azure & Developer Productivity division building high-scale developer tooling, TypeScript SDKs, and intelligent cloud features.",
    salary: "₹28L – ₹42L/yr",
    schedule_type: "Full-time",
    apply_link: "https://careers.microsoft.com",
    thumbnail: null,
    source: "verified",
    posted_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
];

function getCuratedIndiaJobs(keywords?: string, city?: string): any[] {
  let list = CURATED_INDIA_JOBS;
  if (city && city !== "All India" && city !== "India") {
    const cityLower = city.toLowerCase();
    const cityFiltered = list.filter((j) =>
      j.location.toLowerCase().includes(cityLower),
    );
    if (cityFiltered.length > 0) list = cityFiltered;
  }
  if (keywords && keywords.trim()) {
    const q = keywords.toLowerCase().trim();
    const qFiltered = list.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company_name.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q),
    );
    if (qFiltered.length > 0) list = qFiltered;
  }
  return list;
}

// ─── Adzuna India job fetcher ─────────────────────────────────────────────────
async function fetchAdzunaJobs(keywords: string, location: string): Promise<any[]> {
  const hasCredentials =
    API_CONFIG.ADZUNA_APP_ID !== "YOUR_ADZUNA_APP_ID" &&
    API_CONFIG.ADZUNA_APP_KEY !== "YOUR_ADZUNA_APP_KEY";

  if (!hasCredentials) return [];

  const where = encodeURIComponent(location || "India");
  const what = encodeURIComponent(keywords || "software developer");
  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${API_CONFIG.ADZUNA_APP_ID}&app_key=${API_CONFIG.ADZUNA_APP_KEY}&what=${what}&where=${where}&results_per_page=20&content-type=application/json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Adzuna error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((j: any) => ({
    job_id: j.id,
    title: j.title,
    company_name: j.company?.display_name || "Company",
    location: j.location?.display_name || location,
    description: j.description,
    salary: j.salary_min
      ? `₹${Math.round(j.salary_min / 1000)}k – ₹${Math.round(j.salary_max / 1000)}k/yr`
      : "Competitive",
    apply_link: j.redirect_url,
    thumbnail: null,
    schedule_type: j.contract_time === "full_time" ? "Full-time" : j.contract_time || "Full-time",
    source: "adzuna",
    posted_at: j.created || new Date().toISOString(),
  }));
}

// ─── Jobicy remote jobs fetcher ───────────────────────────────────────────────
async function fetchJobicyJobs(tag: string): Promise<any[]> {
  // Jobicy expects a single slug tag — multi-word roles 400, so use first token.
  const slug = (tag || "developer").toLowerCase().trim().split(/[^a-z]+/).filter(Boolean)[0] || "developer";
  const tagParam = encodeURIComponent(slug);
  const url = `${API_CONFIG.JOBICY_ENDPOINT}?count=20&geo=india&industry=engineering&tag=${tagParam}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Jobicy error: ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    job_id: `jobicy-${j.id}`,
    title: j.jobTitle,
    company_name: j.companyName,
    location: j.jobGeo || "Remote",
    description: j.jobExcerpt,
    salary: j.annualSalaryMin
      ? `$${j.annualSalaryMin}–${j.annualSalaryMax}k/yr`
      : "Competitive",
    apply_link: j.url,
    thumbnail: j.companyLogo,
    schedule_type: "Remote",
    source: "jobicy",
    posted_at: j.pubDate || new Date().toISOString(),
  }));
}

// ─── Remotive fallback fetcher ────────────────────────────────────────────────
async function fetchRemotiveJobs(category: string): Promise<any[]> {
  const cat = encodeURIComponent(category || "software-dev");
  const url = `${API_CONFIG.REMOTIVE_ENDPOINT}?category=${cat}&limit=20`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Remotive error: ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    job_id: `remotive-${j.id}`,
    title: j.title,
    company_name: j.company_name,
    location: "Remote Worldwide",
    description: j.description?.replace(/<[^>]*>/g, "").slice(0, 200) || "",
    salary: j.salary || "Competitive",
    apply_link: j.url,
    thumbnail: j.company_logo,
    schedule_type: "Remote",
    source: "remotive",
    posted_at: j.publication_date || new Date().toISOString(),
  }));
}

// ─── Hardcoded Verified Indian Company Portals ────────────────────────────────
const VERIFIED_COMPANIES: Record<string, any[]> = {
  "Tamil Nadu": [
    { id: "tn1", title: "Technology Services", company: "Wipro", loc: "Chennai/Coimbatore", type: "Service", url: "https://careers.wipro.com/global-india" },
    { id: "tn2", title: "Automotive Tech", company: "Ford India", loc: "Chennai (Global Business)", type: "Core", url: "https://india.ford.com/about-ford/careers/" },
    { id: "tn3", title: "Software Development", company: "Oracle", loc: "Chennai", type: "Product", url: "https://www.oracle.com/corporate/careers/" },
  ],
  "Chennai": [
    { id: "c1", title: "Product & Engineering", company: "Zoho Corporation", loc: "Chennai (Estancia)", type: "Product", url: "https://www.zoho.com/careers/" },
    { id: "c2", title: "SaaS & UX Design", company: "Freshworks", loc: "Chennai (Perungudi)", type: "Product", url: "https://www.freshworks.com/company/careers/" },
    { id: "c3", title: "Consulting & Tech", company: "Accenture", loc: "Chennai (Sholinganallur)", type: "Service", url: "https://www.accenture.com/in-en/careers" },
    { id: "c4", title: "Enterprise Solutions", company: "TCS", loc: "Chennai (Siruseri)", type: "Service", url: "https://www.tcs.com/careers" },
    { id: "c5", title: "Cloud & E-Commerce", company: "Amazon India", loc: "Chennai (OMR)", type: "Product", url: "https://www.amazon.jobs/en/locations/chennai-india" },
    { id: "c6", title: "Fintech & Payments", company: "PayPal", loc: "Chennai (Sholinganallur)", type: "Product", url: "https://www.paypal.com/us/webapps/mpp/jobs" },
    { id: "c7", title: "Banking Technology", company: "Standard Chartered", loc: "Chennai (DLF)", type: "Captive", url: "https://www.sc.com/en/careers/" },
  ],
  "Coimbatore": [
    { id: "co1", title: "Automotive & R&D", company: "Bosch Global", loc: "Coimbatore (CHIL)", type: "Core", url: "https://www.bosch.in/careers/" },
    { id: "co2", title: "Digital Transformation", company: "Cognizant", loc: "Coimbatore (Saravanampatti)", type: "Service", url: "https://www.cognizant.com/in/en/careers" },
    { id: "co3", title: "Global IT Services", company: "Infosys", loc: "Coimbatore (TIDEL Park)", type: "Service", url: "https://www.infosys.com/careers.html" },
    { id: "co4", title: "Tech & BPO Services", company: "KGISL", loc: "Coimbatore (KGiSL Campus)", type: "Service", url: "https://www.kgisl.com/careers/" },
  ],
  "Madurai": [
    { id: "m1", title: "Cloud & Infrastructure", company: "HCL Tech", loc: "Madurai (ELCOT)", type: "Service", url: "https://www.hcltech.com/careers" },
    { id: "m2", title: "Engineering Solutions", company: "Honeywell", loc: "Madurai (Kappalur)", type: "Core", url: "https://www.honeywell.com/us/en/careers" },
    { id: "m3", title: "Insurtech & Services", company: "Solartis", loc: "Madurai", type: "Product", url: "https://www.solartis.com/careers/" },
  ],
  "Trichy": [
    { id: "t1", title: "Core Engineering", company: "BHEL", loc: "Trichy (Kailasapuram)", type: "Govt/Core", url: "https://careers.bhel.in/" },
    { id: "t2", title: "Consulting & IT", company: "Capgemini", loc: "Trichy", type: "Service", url: "https://www.capgemini.com/careers/" },
    { id: "t3", title: "Staffing & Digital", company: "VDart", loc: "Trichy", type: "Service", url: "https://vdart.com/careers/" },
  ],
  "Bangalore": [
    { id: "b1", title: "Engineering & Product", company: "Flipkart", loc: "Bangalore", type: "Product", url: "https://www.flipkartcareers.com/" },
    { id: "b2", title: "AI & Cloud", company: "Google India", loc: "Bangalore", type: "Product", url: "https://careers.google.com/locations/india/" },
    { id: "b3", title: "Software Engineering", company: "Microsoft India", loc: "Bangalore/Hyderabad", type: "Product", url: "https://careers.microsoft.com/v2/global/en/in.html" },
    { id: "b4", title: "Fintech & Data", company: "Razorpay", loc: "Bangalore", type: "Fintech", url: "https://razorpay.com/jobs/" },
    { id: "b5", title: "SaaS & Growth", company: "Swiggy", loc: "Bangalore", type: "Product", url: "https://careers.swiggy.com/" },
  ],
  "Hyderabad": [
    { id: "h1", title: "Cloud Engineering", company: "Amazon AWS India", loc: "Hyderabad", type: "Product", url: "https://www.amazon.jobs/en/locations/hyderabad-india" },
    { id: "h2", title: "AI & Research", company: "Microsoft R&D", loc: "Hyderabad", type: "Product", url: "https://careers.microsoft.com/v2/global/en/in.html" },
    { id: "h3", title: "Analytics & BI", company: "Deloitte India", loc: "Hyderabad", type: "Service", url: "https://www2.deloitte.com/in/en/careers.html" },
  ],
};

const INDIA_LOCATIONS = ["Tamil Nadu", "Chennai", "Bangalore", "Hyderabad", "Coimbatore", "Madurai", "Trichy"];
const INDIA_CITIES_ADZUNA: Record<string, string> = {
  "Tamil Nadu": "Tamil Nadu",
  "Chennai": "Chennai",
  "Bangalore": "Bangalore",
  "Hyderabad": "Hyderabad",
  "Coimbatore": "Coimbatore",
  "Madurai": "Madurai",
  "Trichy": "Tiruchirappalli",
};

const REMOTE_CATEGORIES = [
  { label: "All Tech", jobicyTag: "developer", remotiveCat: "software-dev" },
  { label: "Mobile", jobicyTag: "mobile", remotiveCat: "mobile" },
  { label: "Frontend", jobicyTag: "react", remotiveCat: "frontend" },
  { label: "Backend", jobicyTag: "backend", remotiveCat: "backend" },
  { label: "DevOps", jobicyTag: "devops", remotiveCat: "devops-sysadmin" },
  { label: "Data", jobicyTag: "data", remotiveCat: "data" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const { saveJob, unsaveJob, isJobSaved, getJobStatus, updateJobStatus } = useJobStore();
  const hasNotifiedRef = useRef(false);

  const [activeTab, setActiveTab] = useState<"all" | "india" | "remote" | "global">("all");
  const [masterJobs, setMasterJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [roleQuery, setRoleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  // Recommended Smart Filter States
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fullTimeOnly, setFullTimeOnly] = useState(false);
  const [freshersOnly, setFreshersOnly] = useState(false);
  const [thisWeekOnly, setThisWeekOnly] = useState(false);
  const [matchMyResume, setMatchMyResume] = useState(false);
  const [userResumeSkills, setUserResumeSkills] = useState<string[]>([]);

  // Custom User Scraper & Importer States ($0 API Cost)
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeUrlInput, setScrapeUrlInput] = useState("");
  const [scrapingLoading, setScrapingLoading] = useState(false);

  const hasActiveFilter =
    roleQuery.trim().length > 0 ||
    locationQuery.trim().length > 0 ||
    remoteOnly ||
    fullTimeOnly ||
    freshersOnly ||
    thisWeekOnly ||
    matchMyResume;

  const clearAllFilters = useCallback(() => {
    setRoleQuery("");
    setLocationQuery("");
    setRemoteOnly(false);
    setFullTimeOnly(false);
    setFreshersOnly(false);
    setThisWeekOnly(false);
    setMatchMyResume(false);
  }, []);

  const handleScrapeJob = async () => {
    const url = scrapeUrlInput.trim();
    if (!url) {
      Alert.alert("Enter Job URL", "Please paste a job link from LinkedIn, Naukri, Indeed, or any career portal.");
      return;
    }
    setScrapingLoading(true);
    try {
      const newJob = await scrapeJobFromUrl(url);
      await saveScrapedJob(newJob);
      setMasterJobs((prev) => [newJob, ...prev]);
      setShowScrapeModal(false);
      setScrapeUrlInput("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Job Scraped & Saved! 🎉",
        `"${newJob.title}" at ${newJob.company_name} is now added to your feed. You can now ATS match or Auto-Apply!`
      );
    } catch (err: any) {
      Alert.alert("Scraping Failed", err.message || "Could not scrape job from this link.");
    } finally {
      setScrapingLoading(false);
    }
  };

  // Single Global Ingest & Cache Loader
  const loadGlobalJobs = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const feed = await getUnifiedGlobalJobs(forceRefresh);
      setMasterJobs(feed);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load global jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGlobalJobs(false);
  }, [loadGlobalJobs]);

  // ── Auto Apply: background per-job processing (existing flow hook) ──────
  const { settings: aaSettings } = useAutoApplySettings();
  const [aaStatus, setAaStatus] = useState<Record<string, AutoApplyStatus>>({});
  const aaRunning = useRef(false);
  const aaSettingsRef = useRef(aaSettings);
  aaSettingsRef.current = aaSettings;

  // Auto-extract user skills from saved profile/resume for "Match My Resume"
  useEffect(() => {
    (async () => {
      try {
        const { profile } = await getAutoApplyContext(aaSettings);
        const skills: string[] = [];
        if (profile.skillsText) {
          const tokens = profile.skillsText
            .split(/[\n,;•|/]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1);
          skills.push(...tokens);
        }
        if (profile.roles && profile.roles.length) {
          skills.push(...profile.roles);
        }
        setUserResumeSkills(Array.from(new Set(skills)));
      } catch {}
    })();
  }, [aaSettings]);

  // High Match Jobs Notification (alerts once per session)
  useEffect(() => {
    if (hasNotifiedRef.current || loading || masterJobs.length === 0 || userResumeSkills.length === 0) return;
    const highMatches = masterJobs.filter((j) => (j.jobMatchScore || 0) >= 30);
    if (highMatches.length > 0) {
      hasNotifiedRef.current = true;
      notifyHighMatchJobs(highMatches.length, userResumeSkills[0]);
    }
  }, [loading, masterJobs, userResumeSkills]);

  // Instant in-memory filtering from the single stored master dataset
  const filteredJobs = useMemo(() => {
    return filterStoredJobs(masterJobs, {
      tab: activeTab,
      roleQuery,
      locationQuery,
      remoteOnly,
      fullTimeOnly,
      freshersOnly,
      thisWeekOnly,
      matchMyResume,
      userSkills: userResumeSkills,
    });
  }, [
    masterJobs,
    activeTab,
    roleQuery,
    locationQuery,
    remoteOnly,
    fullTimeOnly,
    freshersOnly,
    thisWeekOnly,
    matchMyResume,
    userResumeSkills,
  ]);

  const runAutoApply = useCallback(async (list: any[], fallbackSource: string) => {
      const settings = aaSettingsRef.current;
      if (!settings.enabled || settings.paused || aaRunning.current) return;
      if (!auth.currentUser) return;
      aaRunning.current = true;
      console.log(`[AutoApply] Jobs feed pass: ${list.length} jobs (${fallbackSource}).`);
      try {
        // Roles/location/resume from the existing profile + storage.
        const { profile, resume } = await getAutoApplyContext(settings);

        const existing = new Set<string>();
        try {
          (await getAutoApplyRecords()).forEach((a: any) => existing.add(a.jobId));
        } catch {}

        const normalized: AutoApplyJob[] = list.map((j: any, i: number) => ({
          id: j.job_id || `${j.title}-${j.company_name}-${i}`,
          title: j.title,
          company: j.company_name,
          location: j.location,
          description: j.description || '',
          salary: j.salary,
          scheduleType: j.schedule_type,
          source: j.source || fallbackSource,
          applyUrl: j.apply_link,
          logo: j.thumbnail || undefined,
        }));

        const records = await processAutoApplyBatch(normalized, {
          settings,
          profile,
          resume,
          existingIds: existing,
        });

        for (const rec of records) {
          try {
            await saveAutoApplyRecord(rec);
            console.log(`[AutoApply] Tracked ${rec.jobId} as ${rec.status}.`);
          } catch (e: any) {
            console.log(`[AutoApply] Track failed for ${rec.jobId}:`, e?.message);
            if (/not authenticated/i.test(e?.message || '')) break;
          }
          setAaStatus((prev) => ({ ...prev, [rec.jobId]: rec.status }));
        }
        console.log(`[AutoApply] Feed pass saved ${records.length} records.`);
        try {
          const { refreshAutoApplyNotification } = await import('@/services/autoApplyNotifier');
          await refreshAutoApplyNotification('done');
        } catch {}
      } finally {
        aaRunning.current = false;
      }
    },
    [],
  );

  // ── Auto Apply pass over freshly loaded master jobs (not on every keystroke) ────
  useEffect(() => {
    if (masterJobs.length > 0 && aaSettings.enabled && !aaSettings.paused) {
      runAutoApply(masterJobs.slice(0, 30), "global");
    }
  }, [masterJobs, aaSettings.enabled, aaSettings.paused, runAutoApply]);

  // ── Job Card ───────────────────────────────────────────────────────────────
  const renderJobCard = (job: any, idx: number) => {
    const jobId = job.job_id || `${job.title}-${job.company_name}`;
    const saved = isJobSaved(jobId);
    const trackedStatus = getJobStatus ? getJobStatus(jobId) : undefined;
    const isRemote = job.source === "jobicy" || job.source === "remotive";

    return (
      <React.Fragment key={jobId}>

        <Animated.View entering={FadeInUp.delay(idx * 60).duration(350)}>
          <GlassCard style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/job-details",
                  params: {
                    title: job.title,
                    company: job.company_name,
                    location: job.location,
                    logo: job.thumbnail || "",
                    applyLink: job.apply_link,
                    salary: job.salary || "Competitive",
                  },
                })
              }
            >
              <View style={styles.jobHeader}>
                {/* Company Logo / Company Monogram / Fallback Icon */}
                <View style={[styles.logoBox, { backgroundColor: "#fff", borderColor: colors.glassBorder }]}>
                  {job.thumbnail ? (
                    <Image source={{ uri: job.thumbnail }} style={styles.logo} resizeMode="contain" />
                  ) : job.company_name?.trim() ? (
                    <View style={styles.companyMonogramBox}>
                      <Text style={styles.companyMonogramText}>
                        {getCompanyMonogram(job.company_name)}
                      </Text>
                    </View>
                  ) : (
                    <ExpoImage
                      source={require("@/assets/images/resume-portfolio-transparent.png")}
                      style={styles.resumeIcon}
                      contentFit="contain"
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={[styles.companyName, { color: "#573353", fontWeight: "700" }]}>
                    {job.company_name || "Direct Hire"}
                  </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={() => {
                    if (saved) {
                      unsaveJob(jobId);
                    } else {
                      saveJob({
                        id: jobId,
                        title: job.title,
                        company: job.company_name,
                        location: job.location,
                        logo: job.thumbnail,
                        url: job.apply_link,
                        source: job.source || "india",
                        salary: job.salary,
                        savedAt: Date.now(),
                      });
                    }
                  }}
                  style={[styles.heartBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                >
                  <Heart size={17} color={saved ? Theme.colors.primary : colors.textMuted} fill={saved ? Theme.colors.primary : "transparent"} />
                </TouchableOpacity>
              </View>

              {/* Tags Row */}
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: Theme.colors.primary + "12" }]}>
                  <MapPin size={10} color={Theme.colors.primary} />
                  <Text style={[styles.tagText, { color: Theme.colors.primary }]} numberOfLines={1}>
                    {job.location}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: "rgba(87, 51, 83, 0.08)" }]}>
                  {isRemote ? <Wifi size={10} color="#573353" /> : <Zap size={10} color="#573353" />}
                  <Text style={[styles.tagText, { color: "#573353" }]}>
                    {job.schedule_type || "Full-time"}
                  </Text>
                </View>
                {/* Posted Date Tag */}
                <View style={[styles.tag, { backgroundColor: "rgba(87, 51, 83, 0.06)" }]}>
                  <Calendar size={10} color="#573353" />
                  <Text style={[styles.tagText, { color: "#573353" }]}>
                    {formatPostedDate(job.posted_at)}
                  </Text>
                </View>
                {/* User Scraped Badge */}
                {job.source === "user_scraped" && (
                  <View style={[styles.tag, { backgroundColor: "rgba(253, 167, 88, 0.2)", borderColor: "rgba(253, 167, 88, 0.5)", borderWidth: 1 }]}>
                    <Sparkles size={10} color="#573353" />
                    <Text style={[styles.tagText, { color: "#573353", fontWeight: "800" }]}>Custom Scraped</Text>
                  </View>
                )}
                {job.salary && job.salary !== "Competitive" && (
                  <View style={[styles.tag, { backgroundColor: "#10b98112" }]}>
                    <Text style={[styles.tagText, { color: "#10b981" }]}>💰 {job.salary}</Text>
                  </View>
                )}
              </View>

              {/* Auto Apply status (only when this job was processed) */}
              {aaStatus[job.job_id || `${job.title}-${job.company_name}-${idx}`] && (
                <View style={{ marginBottom: 12 }}>
                  <AutoApplyBadge
                    status={aaStatus[job.job_id || `${job.title}-${job.company_name}-${idx}`]}
                  />
                </View>
              )}

              {/* Application Status Tracker Pill */}
              {trackedStatus && (
                <View style={{ marginBottom: 10 }}>
                  <View
                    style={[
                      styles.trackerBadge,
                      trackedStatus === 'offer'
                        ? { backgroundColor: '#F59E0B18', borderColor: '#F59E0B' }
                        : trackedStatus === 'interview'
                        ? { backgroundColor: '#8B5CF618', borderColor: '#8B5CF6' }
                        : trackedStatus === 'rejected'
                        ? { backgroundColor: '#EF444418', borderColor: '#EF4444' }
                        : { backgroundColor: '#10B98118', borderColor: '#10B981' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trackerBadgeText,
                        trackedStatus === 'offer'
                          ? { color: '#D97706' }
                          : trackedStatus === 'interview'
                          ? { color: '#7C3AED' }
                          : trackedStatus === 'rejected'
                          ? { color: '#DC2626' }
                          : { color: '#059669' },
                      ]}
                    >
                      {trackedStatus === 'offer'
                        ? '🎉 Offer Received'
                        : trackedStatus === 'interview'
                        ? '📅 Interview Scheduled'
                        : trackedStatus === 'rejected'
                        ? '✕ Archived'
                        : '✓ Applied'}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Action Buttons (High Contrast & Visible) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.atsBtn, { backgroundColor: Theme.colors.primary }]}
                onPress={() =>
                  router.push({
                    pathname: "/builder/ats",
                    params: {
                      jobUrl: job.apply_link,
                      autoScan: "true",
                      jobTitle: job.title,
                      company: job.company_name,
                    },
                  })
                }
              >
                <Zap size={12} color="#fff" fill="#fff" />
                <Text style={styles.atsBtnText}>ATS Match</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tailorBtn, { backgroundColor: "#059669" }]}
                onPress={() =>
                  router.push({
                    pathname: "/builder/ats",
                    params: {
                      jobUrl: job.apply_link,
                      autoScan: "true",
                      autoOptimize: "true",
                      jobTitle: job.title,
                      company: job.company_name,
                    },
                  })
                }
              >
                <Sparkles size={12} color="#fff" />
                <Text style={styles.tailorBtnText}>🎯 Tailor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: "#573353", borderColor: "#573353" }]}
                onPress={() =>
                  router.push({
                    pathname: "/job-details",
                    params: {
                      title: job.title,
                      company: job.company_name,
                      location: job.location,
                      logo: job.thumbnail || "",
                      applyLink: job.apply_link,
                      salary: job.salary || "Competitive",
                      autoApply: "true",
                      postedAt: formatPostedDate(job.posted_at),
                    },
                  })
                }
              >
                <Zap size={12} color="#FDA758" fill="#FDA758" />
                <Text style={[styles.applyBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>Auto Apply</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      </React.Fragment>
    );
  };

  // ── Verified Portal Card ───────────────────────────────────────────────────
  const renderVerifiedCard = (job: any, idx: number) => (
    <React.Fragment key={job.id}>
      <Animated.View entering={FadeInRight.delay(idx * 60).duration(350)}>
        <TouchableOpacity
          style={[styles.verifiedCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          onPress={() =>
            router.push({
              pathname: "/job-details",
              params: {
                title: job.title,
                company: job.company,
                location: job.loc,
                logo: "",
                applyLink: job.url,
                salary: "Competitive",
              },
            })
          }
          activeOpacity={0.8}
        >
          <View style={[styles.officialBadge, { backgroundColor: Theme.colors.primary }]}>
            <ShieldCheck size={11} color="#fff" fill="#fff" />
            <Text style={styles.officialText}>OFFICIAL CAREER PORTAL</Text>
          </View>

          <View style={styles.verifiedTop}>
            <View style={[styles.verifiedLogo, { backgroundColor: Theme.colors.primary + "15" }]}>
              <ExpoImage
                source={require("@/assets/images/resume-portfolio-transparent.png")}
                style={styles.resumeIcon}
                contentFit="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifiedTitle, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
              <Text style={[styles.verifiedCompany, { color: colors.textMuted }]}>{job.company}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (isJobSaved(job.id)) {
                  unsaveJob(job.id);
                } else {
                  saveJob({ id: job.id, title: job.title, company: job.company, location: job.loc, url: job.url, source: "verified", savedAt: Date.now() });
                }
              }}
              style={[styles.heartBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
            >
              <Heart size={17} color={isJobSaved(job.id) ? Theme.colors.primary : colors.textMuted} fill={isJobSaved(job.id) ? Theme.colors.primary : "transparent"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

          <View style={styles.verifiedMeta}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.text }]}>{job.loc}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[styles.tag, { backgroundColor: "rgba(87, 51, 83, 0.06)" }]}>
                <Calendar size={10} color="#573353" />
                <Text style={[styles.tagText, { color: "#573353" }]}>Updated Today</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: Theme.colors.primary + "15" }]}>
                <Text style={[styles.typeText, { color: Theme.colors.primary }]}>{job.type}</Text>
              </View>
            </View>
          </View>

          {/* Action Row for Verified Card */}
          <View style={[styles.actionRow, { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 }]}>
            <TouchableOpacity
              style={[styles.atsBtn, { backgroundColor: Theme.colors.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/builder/ats",
                  params: {
                    jobUrl: job.url,
                    autoScan: "true",
                    jobTitle: job.title,
                    company: job.company,
                  },
                })
              }
            >
              <Zap size={12} color="#fff" fill="#fff" />
              <Text style={styles.atsBtnText}>ATS Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tailorBtn, { backgroundColor: "#059669" }]}
              onPress={() =>
                router.push({
                  pathname: "/builder/ats",
                  params: {
                    jobUrl: job.url,
                    autoScan: "true",
                    autoOptimize: "true",
                    jobTitle: job.title,
                    company: job.company,
                  },
                })
              }
            >
              <Sparkles size={12} color="#fff" />
              <Text style={styles.tailorBtnText}>🎯 Tailor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: "#573353", borderColor: "#573353" }]}
              onPress={() =>
                router.push({
                  pathname: "/job-details",
                  params: {
                    title: job.title,
                    company: job.company,
                    location: job.loc,
                    logo: "",
                    applyLink: job.url,
                    salary: "Competitive",
                    postedAt: "Updated Today",
                  },
                })
              }
            >
              <ExternalLink size={13} color="#FDA758" />
              <Text style={[styles.applyBtnText, { color: "#FFFFFF", fontWeight: "800" }]}>Portal Link</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </React.Fragment>
  );

  // ── Virtualized list: header (filters) + empty states ─────────────────────
  const renderListHeader = () => {
    const activeFilterLabels: string[] = [];
    if (roleQuery) activeFilterLabels.push(`"${roleQuery}"`);
    if (locationQuery) activeFilterLabels.push(`"${locationQuery}"`);
    if (matchMyResume) activeFilterLabels.push("🎯 Resume Match");
    if (remoteOnly) activeFilterLabels.push("🏠 Remote");
    if (freshersOnly) activeFilterLabels.push("🎓 Freshers");
    if (fullTimeOnly) activeFilterLabels.push("💼 Full-Time");
    if (thisWeekOnly) activeFilterLabels.push("🕒 This Week");

    return (
      <View style={{ gap: 10, marginBottom: 8, marginTop: 4 }}>
        {/* Quick Smart Filter Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {/* Match My Resume Chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              matchMyResume
                ? { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMatchMyResume((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Sparkles size={13} color={matchMyResume ? "#FFFFFF" : Theme.colors.primary} />
            <Text
              style={[
                styles.filterChipText,
                { color: matchMyResume ? "#FFFFFF" : colors.text },
              ]}
            >
              Match My Resume
            </Text>
          </TouchableOpacity>

          {/* Remote Only */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              remoteOnly
                ? { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRemoteOnly((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipIcon}>🏠</Text>
            <Text
              style={[
                styles.filterChipText,
                { color: remoteOnly ? "#FFFFFF" : colors.text },
              ]}
            >
              Remote Only
            </Text>
          </TouchableOpacity>

          {/* Freshers / Entry */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              freshersOnly
                ? { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFreshersOnly((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipIcon}>🎓</Text>
            <Text
              style={[
                styles.filterChipText,
                { color: freshersOnly ? "#FFFFFF" : colors.text },
              ]}
            >
              Freshers / Entry
            </Text>
          </TouchableOpacity>

          {/* Full-Time */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              fullTimeOnly
                ? { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFullTimeOnly((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipIcon}>💼</Text>
            <Text
              style={[
                styles.filterChipText,
                { color: fullTimeOnly ? "#FFFFFF" : colors.text },
              ]}
            >
              Full-Time
            </Text>
          </TouchableOpacity>

          {/* This Week */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              thisWeekOnly
                ? { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setThisWeekOnly((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipIcon}>🕒</Text>
            <Text
              style={[
                styles.filterChipText,
                { color: thisWeekOnly ? "#FFFFFF" : colors.text },
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filter summary chip when filters are active */}
        {hasActiveFilter && (
          <TouchableOpacity
            style={[
              styles.activeFilterChip,
              { backgroundColor: Theme.colors.primary + "12", borderColor: Theme.colors.primary + "30" },
            ]}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.8}
          >
            <Search size={13} color={Theme.colors.primary} />
            <Text style={[styles.activeFilterChipText, { color: Theme.colors.primary }]} numberOfLines={1}>
              Active Filters: {activeFilterLabels.join(" • ")}
            </Text>
            <TouchableOpacity
              onPress={clearAllFilters}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={Theme.colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Freshness & Count Status Banner */}
        <View style={[styles.freeBadgeRow, { backgroundColor: "rgba(87, 51, 83, 0.05)", borderColor: "rgba(87, 51, 83, 0.1)" }]}>
          <Globe size={14} color="#573353" />
          <Text style={[styles.freeBadgeText, { color: "#573353" }]}>
            {filteredJobs.length} Verified Tech Roles • Updated Live
          </Text>
          <TouchableOpacity onPress={() => loadGlobalJobs(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RefreshCw size={13} color="#573353" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRetry = (msg: string, onRetry: () => void) => (
    <View style={styles.centered}>
      <WifiOff size={40} color={colors.textMuted} />
      <Text style={[styles.errorText, { color: colors.textMuted }]}>{msg}</Text>
      <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Theme.colors.primary }]} onPress={onRetry}>
        <RefreshCw size={14} color="#fff" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading global live openings...
          </Text>
        </View>
      );
    }
    if (error) {
      return renderRetry(error, () => loadGlobalJobs(true));
    }
    return (
      <View style={styles.centered}>
        <View style={[styles.emptyLogoBox, { backgroundColor: Theme.colors.primary + "15" }]}>
          <ExpoImage
            source={require("@/assets/images/resume-portfolio-transparent.png")}
            style={{ width: 44, height: 44 }}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Active Jobs Found
        </Text>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          {hasActiveFilter
            ? `No jobs match current filter criteria. Try clearing filters or searching different keywords.`
            : "No live openings in this category right now. Expired jobs were automatically pruned."}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: Theme.colors.primary, marginTop: 8 }]}
          onPress={() => {
            clearAllFilters();
            loadGlobalJobs(true);
          }}
        >
          <RefreshCw size={14} color="#fff" />
          <Text style={styles.retryText}>Reset Search & Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.headerWrap, { paddingTop: insets.top + 16, paddingBottom: 6 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Explore Jobs</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {hasActiveFilter
                ? `${filteredJobs.length} jobs match your filter`
                : activeTab === "india"
                ? `India Tech Openings • ${filteredJobs.length} Live`
                : activeTab === "remote"
                ? `Worldwide Remote Roles • ${filteredJobs.length} Live`
                : activeTab === "global"
                ? `USA & Global Roles • ${filteredJobs.length} Live`
                : `${filteredJobs.length} Live Roles Worldwide`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              style={[
                styles.autoPill,
                {
                  backgroundColor: aaSettings.enabled && !aaSettings.paused
                    ? Theme.colors.primary
                    : colors.surface,
                  borderColor: aaSettings.enabled && !aaSettings.paused
                    ? Theme.colors.primary
                    : colors.glassBorder,
                },
              ]}
              onPress={() => router.push("/auto-apply-settings" as any)}
            >
              <Zap
                size={14}
                color={aaSettings.enabled && !aaSettings.paused ? "#fff" : colors.textMuted}
                fill={aaSettings.enabled && !aaSettings.paused ? "#fff" : "transparent"}
              />
              <Text
                style={[
                  styles.autoPillText,
                  { color: aaSettings.enabled && !aaSettings.paused ? "#fff" : colors.textMuted },
                ]}
              >
                Auto {aaSettings.enabled ? (aaSettings.paused ? "Paused" : "ON") : "OFF"}
              </Text>
            </TouchableOpacity>

            {/* Search Icon button: toggles Role & Location search box */}
            <TouchableOpacity
              style={[
                styles.searchToggleBtn,
                {
                  backgroundColor: showSearch || hasActiveFilter ? Theme.colors.primary : colors.surface,
                  borderColor: showSearch || hasActiveFilter ? Theme.colors.primary : colors.glassBorder,
                  position: "relative",
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSearch((p) => !p);
              }}
              activeOpacity={0.8}
            >
              <Search size={19} color={showSearch || hasActiveFilter ? "#fff" : colors.text} />
              {hasActiveFilter && !showSearch && (
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: "#FFFFFF",
                  }}
                />
              )}
            </TouchableOpacity>

            {/* User Custom Scraper / Import Job URL Button ($0 API Cost) */}
            <TouchableOpacity
              style={[
                styles.searchToggleBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                  marginLeft: 6,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowScrapeModal(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={19} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Segmented Category Tabs ────────────────────────── */}
        <View style={styles.tabContainer}>
          {(
            [
              { id: "all", label: "All Jobs", icon: Sparkles },
              { id: "india", label: "India", icon: MapPin },
              { id: "remote", label: "Remote", icon: Wifi },
              { id: "global", label: "Global", icon: Globe },
            ] as const
          ).map(({ id, label, icon: IconComponent }) => {
            const isActive = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? Theme.colors.primary : "transparent",
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(id);
                }}
                activeOpacity={0.8}
              >
                <IconComponent
                  size={12}
                  color={isActive ? "#FFFFFF" : "#573353"}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ opacity: isActive ? 1 : 0.65 }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#FFFFFF" : "#573353",
                    opacity: isActive ? 1 : 0.75,
                    letterSpacing: -0.2,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Search Panel (Positioned in static header outside FlatList: Continuous typing without remounting) ── */}
        {showSearch && (
          <View style={{ marginTop: 8 }}>
            <GlassCard style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              {/* Field 1: Role / Job Title / Skills */}
              <View style={styles.searchField}>
                <Search size={16} color={Theme.colors.primary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={roleQuery}
                  onChangeText={setRoleQuery}
                  placeholder="Role or skill (e.g. Frontend, React Native, SDE)"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="search"
                />
                {roleQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setRoleQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: colors.glassBorder }]} />

              {/* Field 2: Manual Location Entry */}
              <View style={styles.searchField}>
                <MapPin size={16} color="#573353" />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={locationQuery}
                  onChangeText={setLocationQuery}
                  placeholder="Location"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="search"
                />
                {locationQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Bar */}
              <View style={styles.searchActionRow}>
                {hasActiveFilter && (
                  <TouchableOpacity
                    style={[styles.clearBtn, { borderColor: colors.glassBorder }]}
                    onPress={clearAllFilters}
                  >
                    <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Reset All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.doneSearchBtn, { backgroundColor: Theme.colors.primary }]}
                  onPress={() => setShowSearch(false)}
                >
                  <Text style={styles.doneSearchBtnText}>
                    {hasActiveFilter ? `Apply (${filteredJobs.length} Jobs)` : "Close"}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}
      </View>

      {/* ── Virtualized list (mounts only visible cards) ───────────────────── */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item: any, i: number) => item.job_id || item.id || `job-${i}`}
        renderItem={({ item, index }: any) => renderJobCard(item, index)}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={<View style={{ height: 100 }} />}
        contentContainerStyle={[styles.scroll, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        refreshing={refreshing}
        onRefresh={() => loadGlobalJobs(true)}
      />

      {/* ── User Custom Job Scraper Modal ($0 API Cost) ────────────────── */}
      <Modal
        visible={showScrapeModal}
        transparent
        animationType="fade"
        onRequestClose={() => !scrapingLoading && setShowScrapeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard
            style={[
              styles.scrapeModalCard,
              { backgroundColor: colors.surface, borderColor: colors.glassBorder },
            ]}
          >
            <View style={styles.scrapeModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scrapeModalTitle, { color: colors.text }]}>
                  Scrape & Import Job
                </Text>
                <Text style={[styles.scrapeModalSubtitle, { color: colors.textMuted }]}>
                  Paste any job link from LinkedIn, Naukri, Indeed, or career portal ($0 API cost)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowScrapeModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={scrapingLoading}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.scrapeInputWrap,
                { backgroundColor: colors.background, borderColor: colors.glassBorder },
              ]}
            >
              <LinkIcon size={16} color={Theme.colors.primary} />
              <TextInput
                style={[styles.scrapeInput, { color: colors.text }]}
                placeholder="https://... (Job URL)"
                placeholderTextColor={colors.textMuted}
                value={scrapeUrlInput}
                onChangeText={setScrapeUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {scrapeUrlInput.length > 0 && (
                <TouchableOpacity onPress={() => setScrapeUrlInput("")}>
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.scrapeModalActions}>
              <TouchableOpacity
                style={[styles.scrapeCancelBtn, { borderColor: colors.glassBorder }]}
                onPress={() => setShowScrapeModal(false)}
                disabled={scrapingLoading}
              >
                <Text style={[styles.scrapeCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scrapeSubmitBtn,
                  { backgroundColor: Theme.colors.primary, opacity: scrapingLoading ? 0.7 : 1 },
                ]}
                onPress={handleScrapeJob}
                disabled={scrapingLoading}
              >
                {scrapingLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Sparkles size={15} color="#fff" />
                    <Text style={styles.scrapeSubmitText}>Scrape & Add</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, zIndex: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  searchToggleBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 1.2 },
  autoPill: { flexDirection: "row", alignItems: "center", gap: 5, height: 42, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.2 },
  autoPillText: { fontSize: 11, fontWeight: "800" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
    gap: 3,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 9,
    borderRadius: 12,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },

  searchCard: { borderRadius: 20, padding: 14, borderWidth: 1.2, gap: 8, marginBottom: 4 },
  searchField: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", paddingVertical: 4 },
  fieldDivider: { height: 1, marginVertical: 2 },
  searchActionRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 4 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  clearBtnText: { fontSize: 12, fontWeight: "700" },
  doneSearchBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  doneSearchBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  activeFilterChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1 },
  activeFilterChipText: { fontSize: 12, fontWeight: "700", flex: 1 },

  filterChipsScroll: { paddingVertical: 4, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  filterChipIcon: { fontSize: 12 },
  filterChipText: { fontSize: 11, fontWeight: "700" },

  freeBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  freeBadgeText: { fontSize: 12, fontWeight: "700", color: "#10b981", flex: 1 },

  jobCard: { borderRadius: 20, padding: 16, borderWidth: 1.2, marginBottom: 10 },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  logoBox: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  logo: { width: 38, height: 38 },
  jobTitle: { fontSize: 14, fontWeight: "800", lineHeight: 20 },
  companyName: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  heartBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: "700" },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  atsBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 11, borderRadius: 13 },
  atsBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  tailorBtn: { flex: 1.05, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 11, borderRadius: 13 },
  tailorBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  applyBtn: { flex: 1.15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 11, borderRadius: 13, borderWidth: 1.2 },
  applyBtnText: { fontSize: 12, fontWeight: "800" },
  trackerBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4.5, borderRadius: 8, borderWidth: 1.2 },
  trackerBadgeText: { fontSize: 11, fontWeight: '800' },

  // Verified Card
  verifiedCard: { borderRadius: 20, borderWidth: 1.2, overflow: "hidden", marginBottom: 10 },
  officialBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 6 },
  officialText: { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  verifiedTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  verifiedLogo: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  verifiedTitle: { fontSize: 14, fontWeight: "800" },
  verifiedCompany: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  verifiedMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  metaText: { fontSize: 12, fontWeight: "600" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: "800" },
  secureRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  secureText: { fontSize: 11, fontWeight: "600" },

  // Resume icon pattern (matching generated/uploaded resume cards on Home Screen)
  resumeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FDA75815",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDA75825",
    overflow: "hidden",
  },
  resumeIcon: {
    width: 28,
    height: 28,
  },
  companyMonogramBox: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(253, 167, 88, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
  },
  companyMonogramText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#573353",
    letterSpacing: 0.5,
  },
  emptyLogoBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // States
  centered: { paddingVertical: 80, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // User Custom Scraper Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrapeModalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  scrapeModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  scrapeModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  scrapeModalSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
    lineHeight: 16,
  },
  scrapeInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  scrapeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  scrapeModalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  scrapeCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  scrapeCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrapeSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  scrapeSubmitText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
