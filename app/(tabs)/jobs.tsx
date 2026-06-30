import { GlassCard } from "@/components/glass-card";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useJobStore } from "@/hooks/use-job-store";
import { getGlobalJobs, saveGlobalJobs, canUserFetchJobs } from "@/services/firestore";
import { useRouter } from "expo-router";
import {
  Briefcase,
  ChevronRight,
  Globe,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  InteractionManager,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ─── Tab types ───────────────────────────────────────────────────────────────
type ActiveTab = "india" | "remote" | "verified";

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
  }));
}

// ─── Jobicy remote jobs fetcher (no API key needed) ───────────────────────────
async function fetchJobicyJobs(tag: string): Promise<any[]> {
  const tagParam = encodeURIComponent(tag || "developer");
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
  }));
}

// ─── Remotive fallback fetcher (no API key needed) ────────────────────────────
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
  const { saveJob, unsaveJob, isJobSaved } = useJobStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("india");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // India tab state
  const [indiaQuery, setIndiaQuery] = useState("software developer");
  const [selectedCity, setSelectedCity] = useState("Chennai");
  const hasAdzuna =
    API_CONFIG.ADZUNA_APP_ID !== "YOUR_ADZUNA_APP_ID" &&
    API_CONFIG.ADZUNA_APP_KEY !== "YOUR_ADZUNA_APP_KEY";

  // Remote tab state
  const [selectedRemoteCat, setSelectedRemoteCat] = useState(0);

  // ── Fetch India jobs (Adzuna) ───────────────────────────────────────────────
  const fetchIndiaJobs = useCallback(async (keywords: string, city: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!hasAdzuna) {
        // No Adzuna key — show placeholder message
        setJobs([]);
        setError("adzuna_setup");
        return;
      }

      // Check global cache first
      const cacheKey = `adzuna_${keywords}_${city}`;
      const cached = await getGlobalJobs(cacheKey, city).catch(() => null);
      if (cached && cached.length > 0) {
        setJobs(cached);
        return;
      }

      // Check daily limit
      const canFetch = await canUserFetchJobs().catch(() => true);
      if (!canFetch) {
        Alert.alert("Daily Limit Reached", "Try again tomorrow or switch to Remote Jobs tab!");
        return;
      }

      const results = await fetchAdzunaJobs(keywords, INDIA_CITIES_ADZUNA[city] || city);
      setJobs(results);

      if (results.length > 0) {
        await saveGlobalJobs(cacheKey, city, results).catch(() => {});
      }
    } catch (e: any) {
      setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [hasAdzuna]);

  // ── Fetch Remote jobs (Jobicy → fallback Remotive) ─────────────────────────
  const fetchRemoteJobs = useCallback(async (catIndex: number) => {
    setLoading(true);
    setError(null);
    const cat = REMOTE_CATEGORIES[catIndex];
    try {
      let results: any[] = [];
      try {
        results = await fetchJobicyJobs(cat.jobicyTag);
      } catch {
        // Fallback to Remotive
        results = await fetchRemotiveJobs(cat.remotiveCat);
      }
      setJobs(results);
    } catch (e: any) {
      setError(e.message || "Failed to load remote jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load and tab switch ────────────────────────────────────────────
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (activeTab === "india") {
        fetchIndiaJobs(indiaQuery, selectedCity);
      } else if (activeTab === "remote") {
        fetchRemoteJobs(selectedRemoteCat);
      }
    });
  }, [activeTab]);

  // ── Job Card ───────────────────────────────────────────────────────────────
  const renderJobCard = (job: any, idx: number) => {
    const jobId = job.job_id || `${job.title}-${job.company_name}`;
    const saved = isJobSaved(jobId);
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
                {/* Company Logo */}
                <View style={[styles.logoBox, { backgroundColor: "#fff", borderColor: colors.glassBorder }]}>
                  {job.thumbnail ? (
                    <Image source={{ uri: job.thumbnail }} style={styles.logo} resizeMode="contain" />
                  ) : (
                    <Briefcase size={20} color={Theme.colors.primary} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={[styles.companyName, { color: colors.textMuted }]}>
                    {job.company_name}
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
                <View style={[styles.tag, { backgroundColor: Theme.colors.secondary + "12" }]}>
                  {isRemote ? <Wifi size={10} color={Theme.colors.secondary} /> : <Zap size={10} color={Theme.colors.secondary} />}
                  <Text style={[styles.tagText, { color: Theme.colors.secondary }]}>
                    {job.schedule_type || "Full-time"}
                  </Text>
                </View>
                {job.salary && job.salary !== "Competitive" && (
                  <View style={[styles.tag, { backgroundColor: "#10b98112" }]}>
                    <Text style={[styles.tagText, { color: "#10b981" }]}>💰 {job.salary}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
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
                <Zap size={13} color="#000" fill="#000" />
                <Text style={styles.atsBtnText}>ATS Match</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { borderColor: colors.glassBorder }]}
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
                    },
                  })
                }
              >
                <Globe size={13} color={colors.text} />
                <Text style={[styles.applyBtnText, { color: colors.text }]}>Apply</Text>
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
            <ShieldCheck size={11} color="#000" fill="#000" />
            <Text style={styles.officialText}>OFFICIAL CAREER PORTAL</Text>
          </View>

          <View style={styles.verifiedTop}>
            <View style={[styles.verifiedLogo, { backgroundColor: Theme.colors.primary + "15" }]}>
              <Briefcase size={20} color={Theme.colors.primary} />
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
            <View style={[styles.typeBadge, { backgroundColor: Theme.colors.secondary + "15" }]}>
              <Text style={[styles.typeText, { color: Theme.colors.secondary }]}>{job.type}</Text>
            </View>
          </View>

          <View style={[styles.secureRow, { borderTopColor: colors.glassBorder }]}>
            <Text style={[styles.secureText, { color: colors.textMuted }]}>
              Safety:{" "}
              <Text style={{ color: "#10b981", fontWeight: "800" }}>100% Direct Link ✓</Text>
            </Text>
            <ChevronRight size={15} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </React.Fragment>
  );

  // ── Adzuna Setup Card ──────────────────────────────────────────────────────
  const renderAdzunaSetup = () => (
    <GlassCard style={[styles.setupCard, { backgroundColor: colors.surface, borderColor: Theme.colors.primary + "40" }]}>
      <View style={[styles.setupIconCircle, { backgroundColor: Theme.colors.primary + "15" }]}>
        <Briefcase size={32} color={Theme.colors.primary} />
      </View>
      <Text style={[styles.setupTitle, { color: colors.text }]}>Activate India Job Feed</Text>
      <Text style={[styles.setupSub, { color: colors.textMuted }]}>
        Get live Indian job listings from Adzuna — completely FREE (250 calls/month).
      </Text>
      <View style={styles.setupSteps}>
        {[
          "Go to developer.adzuna.com",
          "Sign up free (no credit card)",
          "Copy your App ID + App Key",
          "Paste into constants/config.ts",
        ].map((step, i) => (
          <View key={i} style={styles.setupStep}>
            <View style={[styles.stepNum, { backgroundColor: Theme.colors.primary }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.setupBtn, { backgroundColor: Theme.colors.primary }]}
        onPress={() => Linking.openURL("https://developer.adzuna.com")}
      >
        <Globe size={16} color="#000" />
        <Text style={styles.setupBtnText}>Get Free Adzuna Key</Text>
      </TouchableOpacity>

      <View style={[styles.orDivider, { borderTopColor: colors.glassBorder }]}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700" }}>
          Meanwhile, use our Remote Jobs tab — zero setup required ↓
        </Text>
      </View>
    </GlassCard>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.headerWrap, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Explore Jobs</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {activeTab === "india"
                ? `Live Indian Job Market • ${selectedCity}`
                : activeTab === "remote"
                ? "Remote Tech Jobs Worldwide"
                : "Official Verified Company Portals"}
            </Text>
          </View>
          {activeTab !== "verified" && (
            <TouchableOpacity
              style={[styles.searchToggleBtn, { backgroundColor: showSearch ? Theme.colors.primary : colors.surface, borderColor: showSearch ? Theme.colors.primary : colors.glassBorder }]}
              onPress={() => setShowSearch(p => !p)}
            >
              <Search size={19} color={showSearch ? "#000" : colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3-Tab Switcher ────────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          {(
            [
              { id: "india", label: "🇮🇳 India Jobs", icon: MapPin },
              { id: "remote", label: "🌐 Remote", icon: Wifi },
              { id: "verified", label: "✅ Verified", icon: ShieldCheck },
            ] as { id: ActiveTab; label: string; icon: any }[]
          ).map(({ id, label }) => (
            <TouchableOpacity
              key={id}
              style={[styles.tabBtn, activeTab === id && { backgroundColor: Theme.colors.primary }]}
              onPress={() => {
                setActiveTab(id);
                setShowSearch(false);
              }}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === id ? "#000" : colors.textMuted }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Scroll Content ─────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── INDIA JOBS TAB ────────────────────────────────────────── */}
        {activeTab === "india" && (
          <View style={{ gap: 12 }}>
            {/* Search Card */}
            {showSearch && (
              <GlassCard style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <View style={styles.searchField}>
                  <Search size={17} color={Theme.colors.primary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    value={indiaQuery}
                    onChangeText={setIndiaQuery}
                    placeholder="e.g. React Native, DevOps..."
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="search"
                    onSubmitEditing={() => { fetchIndiaJobs(indiaQuery, selectedCity).catch(() => {}); }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.searchGoBtn, { backgroundColor: Theme.colors.primary }]}
                  onPress={() => { fetchIndiaJobs(indiaQuery, selectedCity).catch(() => {}); }}
                >
                  <Text style={styles.searchGoBtnText}>Search</Text>
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* City Pill Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {INDIA_LOCATIONS.map(city => (
                <TouchableOpacity
                  key={city}
                  style={[styles.pill, { backgroundColor: selectedCity === city ? Theme.colors.primary : colors.surface, borderColor: selectedCity === city ? Theme.colors.primary : colors.glassBorder }]}
                  onPress={() => {
                    setSelectedCity(city);
                    fetchIndiaJobs(indiaQuery, city).catch(() => {});
                  }}
                >
                  <Text style={[styles.pillText, { color: selectedCity === city ? "#000" : colors.text }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Content */}
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Finding jobs in {selectedCity}...</Text>
              </View>
            ) : error === "adzuna_setup" ? (
              renderAdzunaSetup()
            ) : error ? (
              <View style={styles.centered}>
                <WifiOff size={40} color={colors.textMuted} />
                <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Theme.colors.primary }]} onPress={() => { fetchIndiaJobs(indiaQuery, selectedCity).catch(() => {}); }}>
                  <RefreshCw size={14} color="#000" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : jobs.length === 0 ? (
              renderAdzunaSetup()
            ) : (
              jobs.map((job, idx) => renderJobCard(job, idx))
            )}
          </View>
        )}

        {/* ── REMOTE JOBS TAB ───────────────────────────────────────── */}
        {activeTab === "remote" && (
          <View style={{ gap: 12 }}>
            {/* Category Pill Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {REMOTE_CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.pill, { backgroundColor: selectedRemoteCat === i ? Theme.colors.primary : colors.surface, borderColor: selectedRemoteCat === i ? Theme.colors.primary : colors.glassBorder }]}
                  onPress={() => {
                    setSelectedRemoteCat(i);
                    fetchRemoteJobs(i);
                  }}
                >
                  <Text style={[styles.pillText, { color: selectedRemoteCat === i ? "#000" : colors.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Free Badge */}
            <View style={[styles.freeBadgeRow, { backgroundColor: "#10b98112", borderColor: "#10b98130" }]}>
              <Wifi size={14} color="#10b981" />
              <Text style={styles.freeBadgeText}>
                Live remote jobs • No API key • Powered by Jobicy + Remotive
              </Text>
            </View>

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading remote jobs...</Text>
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <WifiOff size={40} color={colors.textMuted} />
                <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: Theme.colors.primary }]} onPress={() => fetchRemoteJobs(selectedRemoteCat)}>
                  <RefreshCw size={14} color="#000" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : jobs.length === 0 ? (
              <View style={styles.centered}>
                <WifiOff size={40} color={colors.textMuted} />
                <Text style={[styles.errorText, { color: colors.textMuted }]}>No jobs found. Try another category.</Text>
              </View>
            ) : (
              jobs.map((job, idx) => renderJobCard(job, idx))
            )}
          </View>
        )}

        {/* ── VERIFIED PORTALS TAB ─────────────────────────────────── */}
        {activeTab === "verified" && (
          <View style={{ gap: 12 }}>
            {/* City Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {Object.keys(VERIFIED_COMPANIES).map(city => (
                <TouchableOpacity
                  key={city}
                  style={[styles.pill, { backgroundColor: selectedCity === city ? Theme.colors.primary : colors.surface, borderColor: selectedCity === city ? Theme.colors.primary : colors.glassBorder }]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={[styles.pillText, { color: selectedCity === city ? "#000" : colors.text }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(VERIFIED_COMPANIES[selectedCity] || VERIFIED_COMPANIES["Chennai"]).map((job, idx) =>
              renderVerifiedCard(job, idx)
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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

  tabBar: { flexDirection: "row", padding: 5, borderRadius: 18, borderWidth: 1.2, marginBottom: 14, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tabBtnText: { fontSize: 11, fontWeight: "800" },

  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

  searchCard: { borderRadius: 20, padding: 16, borderWidth: 1.2, gap: 12 },
  searchField: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "600" },
  searchGoBtn: { paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  searchGoBtnText: { color: "#000", fontWeight: "800", fontSize: 14, paddingHorizontal: 20 },

  pillRow: { gap: 10, paddingVertical: 4 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: 1.2 },
  pillText: { fontSize: 12, fontWeight: "700" },

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

  actionRow: { flexDirection: "row", gap: 10 },
  atsBtn: { flex: 1.6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 13 },
  atsBtnText: { fontSize: 12, fontWeight: "900", color: "#000" },
  applyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 13, borderWidth: 1.2 },
  applyBtnText: { fontSize: 12, fontWeight: "800" },

  // Verified Card
  verifiedCard: { borderRadius: 20, borderWidth: 1.2, overflow: "hidden", marginBottom: 10 },
  officialBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 6 },
  officialText: { fontSize: 10, fontWeight: "900", color: "#000", letterSpacing: 0.5 },
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

  // Adzuna Setup Card
  setupCard: { borderRadius: 24, padding: 24, borderWidth: 1.5, alignItems: "center", gap: 14, marginTop: 8 },
  setupIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  setupTitle: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  setupSub: { fontSize: 13, textAlign: "center", lineHeight: 20, fontWeight: "500" },
  setupSteps: { width: "100%", gap: 10 },
  setupStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  stepNumText: { color: "#000", fontSize: 12, fontWeight: "900" },
  stepText: { fontSize: 13, fontWeight: "600", flex: 1 },
  setupBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 4 },
  setupBtnText: { color: "#000", fontSize: 14, fontWeight: "900" },
  orDivider: { width: "100%", borderTopWidth: 1, paddingTop: 12, alignItems: "center" },

  // States
  centered: { paddingVertical: 80, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: "#000", fontSize: 13, fontWeight: "800" },
});
