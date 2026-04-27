import { GlassCard } from "@/components/glass-card";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import {
    Briefcase,
    ChevronRight,
    Globe,
    MapPin,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Star,
    Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    InteractionManager,
} from "react-native";
import {
    BannerAd,
    BannerAdSize,
    TestIds,
} from "react-native-google-mobile-ads";
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGlobalJobs, saveGlobalJobs, canUserFetchJobs } from "@/services/firestore";

const { width } = Dimensions.get("window");
const bannerId = __DEV__
  ? TestIds.BANNER
  : API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

const JobAdContainer = ({ colors }: any) => (
  <Animated.View entering={FadeInUp}>
    <GlassCard
      style={[
        styles.adCard,
        {
          backgroundColor: colors.surface + "80",
          borderColor: colors.glassBorder,
        },
      ]}
    >
      <View style={styles.adHeader}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>SPONSORED</Text>
        </View>
        <Text style={[styles.adTitle, { color: colors.text }]}>
          Boost Your Career with AI
        </Text>
      </View>
      <Text style={[styles.adBody, { color: colors.textMuted }]}>
        Join 10,000+ professionals using our AI tools to land interviews at top
        tech companies.
      </Text>
      <TouchableOpacity
        style={[styles.adButton, { backgroundColor: Theme.colors.primary }]}
      >
        <Text style={styles.adButtonText}>Try Professional Plan</Text>
      </TouchableOpacity>
    </GlassCard>
  </Animated.View>
);

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<"Google" | "Throne">("Google");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Tamil Nadu");
  const [query, setQuery] = useState("software jobs");

  const LOCATIONS = [
    "Tamil Nadu",
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Trichy",
  ];

  const VERIFIED_COMPANIES: Record<string, any[]> = {
    "Chennai": [
      { id: "c1", title: "Product & Engineering", company: "Zoho Corporation", loc: "Chennai (Estancia)", type: "Product", salary: "Verified Career Portal", url: "https://www.zoho.com/careers/" },
      { id: "c2", title: "SaaS & UX Design", company: "Freshworks", loc: "Chennai (Perungudi)", type: "Product", salary: "Verified Career Portal", url: "https://www.freshworks.com/company/careers/" },
      { id: "c3", title: "Consulting & Tech", company: "Accenture", loc: "Chennai (Sholinganallur)", type: "Service", salary: "Verified Career Portal", url: "https://www.accenture.com/in-en/careers" },
      { id: "c4", title: "Enterprise Solutions", company: "TCS", loc: "Chennai (Siruseri)", type: "Service", salary: "Verified Career Portal", url: "https://www.tcs.com/careers" },
      { id: "c5", title: "Cloud & E-Commerce", company: "Amazon India", loc: "Chennai (Old Mahabalipuram Rd)", type: "Product", salary: "Verified Career Portal", url: "https://www.amazon.jobs/en/locations/chennai-india" },
      { id: "c6", title: "Fintech & Payments", company: "PayPal", loc: "Chennai (Sholinganallur)", type: "Product", salary: "Verified Career Portal", url: "https://www.paypal.com/us/webapps/mpp/jobs" },
      { id: "c7", title: "Banking Technology", company: "Standard Chartered", loc: "Chennai (DLF)", type: "Captive", salary: "Verified Career Portal", url: "https://www.sc.com/en/careers/" }
    ],
    "Coimbatore": [
      { id: "co1", title: "Automotive & R&D", company: "Bosch Global", loc: "Coimbatore (CHIL)", type: "Core", salary: "Verified Career Portal", url: "https://www.bosch.in/careers/" },
      { id: "co2", title: "Digital Transformation", company: "Cognizant", loc: "Coimbatore (Saravanampatti)", type: "Service", salary: "Verified Career Portal", url: "https://www.cognizant.com/in/en/careers" },
      { id: "co3", title: "Global IT Services", company: "Infosys", loc: "Coimbatore (TIDEL Park)", type: "Service", salary: "Verified Career Portal", url: "https://www.infosys.com/careers.html" },
      { id: "co4", title: "Tech & BPO Services", company: "KGISL", loc: "Coimbatore (KGiSL Campus)", type: "Service", salary: "Verified Career Portal", url: "https://www.kgisl.com/careers/" },
      { id: "co5", title: "Engineering & IT", company: "NTT DATA", loc: "Coimbatore", type: "Service", salary: "Verified Career Portal", url: "https://www.nttdata.com/global/en/careers" }
    ],
    "Madurai": [
      { id: "m1", title: "Cloud & Infrastructure", company: "HCL Tech", loc: "Madurai (ELCOT)", type: "Service", salary: "Verified Career Portal", url: "https://www.hcltech.com/careers" },
      { id: "m2", title: "Engineering Solutions", company: "Honeywell", loc: "Madurai (Kappalur)", type: "Core", salary: "Verified Career Portal", url: "https://www.honeywell.com/us/en/careers" },
      { id: "m3", title: "Insurtech & Services", company: "Solartis", loc: "Madurai", type: "Product", salary: "Verified Career Portal", url: "https://www.solartis.com/careers/" },
      { id: "m4", title: "HR Tech Solutions", company: "Neeyamo", loc: "Madurai (ELCOT)", type: "Product", salary: "Verified Career Portal", url: "https://www.neeyamo.com/careers" }
    ],
    "Trichy": [
      { id: "t1", title: "Core Engineering", company: "BHEL", loc: "Trichy (Kailasapuram)", type: "Govt/Core", salary: "Verified Career Portal", url: "https://careers.bhel.in/" },
      { id: "t2", title: "Consulting & IT", company: "Capgemini", loc: "Trichy", type: "Service", salary: "Verified Career Portal", url: "https://www.capgemini.com/careers/" },
      { id: "t3", title: "Staffing & Digital", company: "VDart", loc: "Trichy", type: "Service", salary: "Verified Career Portal", url: "https://vdart.com/careers/" },
      { id: "t4", title: "Scientific Publishing", company: "SPS", loc: "Trichy", type: "Publishing", salary: "Verified Career Portal", url: "https://www.sps.co.in/careers/" }
    ],
    "Tamil Nadu": [
      { id: "tn1", title: "Technology Services", company: "Wipro", loc: "Chennai/Coimbatore", type: "Service", salary: "Verified Career Portal", url: "https://careers.wipro.com/global-india" },
      { id: "tn2", title: "Automotive Tech", company: "Ford India", loc: "Chennai (Global Business)", type: "Core", salary: "Verified Career Portal", url: "https://india.ford.com/about-ford/careers/" },
      { id: "tn3", title: "Software Development", company: "Oracle", loc: "Chennai", type: "Product", salary: "Verified Career Portal", url: "https://www.oracle.com/corporate/careers/" }
    ]
  };

  const translateTerm = (text: string) => {
    if (!text) return text;
    const lower = text.toLowerCase();
    if (lower.includes("toàn thời gian")) return "Full Time";
    return text.replace(/[^\x00-\x7F]/g, "").trim() || text;
  };

  const fetchJobs = async (searchStr: string, loc: string = selectedLocation) => {
    if (activeTab === "Throne") return;
    setLoading(true);

    // 1. Check Global Cache First
    const cachedJobs = await getGlobalJobs(searchStr, loc);
    if (cachedJobs) {
      setJobs(cachedJobs);
      setLoading(false);
      return;
    }

    // 2. Check Daily Limit
    const canFetch = await canUserFetchJobs();
    if (!canFetch) {
      setLoading(false);
      Alert.alert(
        "Daily Limit Reached",
        "You have reached your daily job search limit. Please use Throne Choice or try again tomorrow to save our community resources!",
        [{ text: "OK" }]
      );
      return;
    }

    const API_KEY =
      "c4ac0c4c3bf946f49c3a6b1251ebcdbe790be3978ae298102dfb6598ce9e7f2d";
    const SEARCH_QUERY = `${searchStr.trim()} in ${loc}`;

    try {
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(SEARCH_QUERY)}&api_key=${API_KEY}`,
      );
      const data = await response.json();
      const jobResults = data.jobs_results || [];
      
      setJobs(jobResults);
      
      // 3. Save to Global Cache for others
      if (jobResults.length > 0) {
        await saveGlobalJobs(searchStr, loc, jobResults);
      }
    } catch (error) {
      console.error("Job fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      if (activeTab === "Google") {
        await fetchJobs(query, selectedLocation);
      }
    });
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topFixed, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Job Search
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {activeTab === "Google"
                ? "Sourced via Google Jobs"
                : "Verified Company Career Pages"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <SlidersHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("Google")}
            style={[
              styles.tab,
              activeTab === "Google" && {
                backgroundColor: Theme.colors.primary,
              },
            ]}
          >
            <Globe
              size={16}
              color={activeTab === "Google" ? "#000" : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Google" ? "#000" : colors.textMuted },
              ]}
            >
              Google Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("Throne")}
            style={[
              styles.tab,
              activeTab === "Throne" && {
                backgroundColor: Theme.colors.primary,
              },
            ]}
          >
            <Star
              size={16}
              color={activeTab === "Throne" ? "#000" : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Throne" ? "#000" : colors.textMuted },
              ]}
            >
              Verified Career
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "Google" ? (
          <Animated.View entering={FadeInUp}>
            <GlassCard
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search software, design..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => fetchJobs(query)}
                returnKeyType="search"
              />
            </GlassCard>

            <View style={{ marginBottom: 24 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      setSelectedLocation(loc);
                      fetchJobs(query, loc);
                    }}
                    style={[
                      styles.locChip,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder,
                      },
                      selectedLocation === loc && {
                        backgroundColor: Theme.colors.secondary,
                        borderColor: Theme.colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.locChipText,
                        { color: colors.text },
                        selectedLocation === loc && { color: "#fff" },
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
              </View>
            ) : (
              jobs.map((job, idx) => (
                <React.Fragment key={job.job_id || idx}>
                  {idx > 0 && idx % 4 === 0 && (
                    <View style={styles.inlineBanner}>
                      <BannerAd
                        unitId={bannerId}
                        size={BannerAdSize.MEDIUM_RECTANGLE}
                        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                      />
                    </View>
                  )}
                  <GlassCard
                    style={[
                      styles.jobCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/job-details",
                          params: {
                            title: job.title,
                            company: job.company_name,
                            location: job.location,
                            logo: job.thumbnail,
                            applyLink:
                              job.apply_options?.[0]?.link || job.share_link,
                            salary:
                              job.detected_extensions?.salary ||
                              job.salary ||
                              "Competitive",
                          },
                        })
                      }
                    >
                      <View style={styles.jobHeader}>
                        <View
                          style={[
                            styles.logoContainer,
                            { backgroundColor: "#fff" },
                          ]}
                        >
                          {job.thumbnail ? (
                            <Image
                              source={{ uri: job.thumbnail }}
                              style={styles.logo}
                              resizeMode="contain"
                            />
                          ) : (
                            <Briefcase size={22} color="#000" />
                          )}
                        </View>
                        <View style={styles.jobInfo}>
                          <Text
                            style={[styles.jobTitle, { color: colors.text }]}
                          >
                            {job.title}
                          </Text>
                          <Text
                            style={[
                              styles.companyName,
                              { color: colors.textMuted },
                            ]}
                          >
                            {job.company_name}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.tagRow}>
                        <View
                          style={[
                            styles.tag,
                            { backgroundColor: Theme.colors.secondary + "10" },
                          ]}
                        >
                          <MapPin size={10} color={Theme.colors.secondary} />
                          <Text
                            style={[
                              styles.tagText,
                              { color: Theme.colors.secondary },
                            ]}
                          >
                            {job.location || "Anywhere"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[
                          styles.applyBtn,
                          { flex: 2, flexDirection: "row", gap: 6 },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/builder/ats",
                            params: {
                              jobUrl:
                                job.apply_options?.[0]?.link || job.share_link,
                              autoScan: "true",
                            },
                          })
                        }
                      >
                        <Zap size={14} color="#FFF" fill="#FFF" />
                        <Text style={styles.applyBtnText}>
                          Optimize & Apply
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.outlineBtn, { flex: 1 }]}
                        onPress={() =>
                          Linking.openURL(
                            job.apply_options?.[0]?.link || job.share_link,
                          )
                        }
                      >
                        <Globe size={14} color={colors.text} />
                        <Text
                          style={[
                            styles.outlineBtnText,
                            { color: colors.text },
                          ]}
                        >
                          Apply
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </React.Fragment>
              ))
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight}>
            {(VERIFIED_COMPANIES[selectedLocation] || VERIFIED_COMPANIES["Tamil Nadu"]).map((job, idx) => (
              <React.Fragment key={job.id}>
                {idx > 0 && idx % 3 === 0 && (
                  <View style={styles.inlineBanner}>
                    <BannerAd
                      unitId={bannerId}
                      size={BannerAdSize.MEDIUM_RECTANGLE}
                      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.throneCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  onPress={() => Linking.openURL(job.url)}
                >
                  <View style={styles.hotBadge}>
                    <ShieldCheck size={10} color="#000" fill="#000" />
                    <Text style={styles.hotText}>VERIFIED SOURCE</Text>
                  </View>
                  <View style={styles.throneTop}>
                    <View
                      style={[
                        styles.throneLogo,
                        { backgroundColor: Theme.colors.primary + "20" },
                      ]}
                    >
                      <Briefcase size={24} color={Theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.throneTitle, { color: colors.text }]}
                      >
                        {job.title}
                      </Text>
                      <Text
                        style={[
                          styles.throneCompany,
                          { color: colors.textMuted },
                        ]}
                      >
                        {job.company}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.throneMeta}>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text
                        style={[styles.metaText, { color: colors.textMuted }]}
                      >
                        {job.loc}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text
                        style={[
                          styles.salaryText,
                          { color: Theme.colors.secondary },
                        ]}
                      >
                        {job.salary}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.postedBy,
                      { borderTopColor: colors.glassBorder },
                    ]}
                  >
                    <Text
                      style={[styles.postedText, { color: colors.textMuted }]}
                    >
                      Source:{" "}
                      <Text style={{ color: colors.text, fontWeight: "700" }}>
                        Official Career Portal
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topFixed: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  locChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  locChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  jobCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  logoContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  companyName: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
  },
  applyBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontWeight: "900",
    fontSize: 13,
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    flexDirection: "row",
    gap: 6,
  },
  outlineBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },
  throneCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  hotBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hotText: {
    fontSize: 9,
    fontWeight: "900",
  },
  throneTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  throneLogo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  throneTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  throneCompany: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  throneMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  salaryText: {
    fontSize: 14,
    fontWeight: "900",
  },
  postedBy: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  postedText: {
    fontSize: 12,
  },
  adCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: "dashed",
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  adBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
  },
  adTitle: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  adBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: "500",
  },
  adButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  adButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
  },
  bannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "transparent",
    paddingBottom: 4,
  },
  inlineBanner: {
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
  },
});
