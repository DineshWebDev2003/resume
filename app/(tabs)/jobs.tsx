import { GlassCard } from "@/components/glass-card";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import {
    Briefcase,
    ChevronRight,
    Globe,
    Heart,
    MapPin,
    Plus,
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
    Modal,
    Platform,
} from "react-native";
import {
    BannerAd,
    BannerAdSize,
} from "react-native-google-mobile-ads";
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGlobalJobs, saveGlobalJobs, canUserFetchJobs } from "@/services/firestore";
import { useJobStore } from "@/hooks/use-job-store";

const { width } = Dimensions.get("window");
const bannerId = API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

const JobAdContainer = ({ colors }: any) => (
  <Animated.View entering={FadeInUp}>
    <GlassCard
      style={[
        styles.adCard,
        {
          backgroundColor: colors.surface + "C0",
          borderColor: colors.glassBorder,
        },
      ]}
    >
      <View style={styles.adHeader}>
        <View style={[styles.adBadge, { backgroundColor: Theme.colors.secondary }]}>
          <Text style={styles.adBadgeText}>PRO BENEFITS</Text>
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

  const { saveJob, unsaveJob, isJobSaved } = useJobStore();

  const [activeTab, setActiveTab] = useState<"Google" | "Throne">("Google");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Tamil Nadu");
  const [query, setQuery] = useState("software jobs");
  const [showSearch, setShowSearch] = useState(false);

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

  const [customLocations, setCustomLocations] = useState<string[]>([]);
  
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
        "You have reached your daily job search limit. Please use Verified Career Choice or try again tomorrow to save our community resources!",
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
      
      {/* Header Widget */}
      <View style={[styles.topFixed, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Explore Jobs
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {activeTab === "Google"
                ? "Aggregated Live Opportunities"
                : "Official Verified Portals"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: showSearch ? Theme.colors.primary : colors.surface,
                borderColor: showSearch ? Theme.colors.primary : colors.glassBorder,
              },
            ]}
            onPress={() => setShowSearch(prev => !prev)}
            activeOpacity={0.8}
          >
            <Search size={20} color={showSearch ? "#000" : colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
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
              activeTab === "Google" && [styles.tabActive, {
                backgroundColor: Theme.colors.primary,
              }],
            ]}
          >
            <Globe
              size={15}
              color={activeTab === "Google" ? "#000" : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Google" ? "#000" : colors.textMuted },
              ]}
            >
              Google Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("Throne")}
            style={[
              styles.tab,
              activeTab === "Throne" && [styles.tabActive, {
                backgroundColor: Theme.colors.primary,
              }],
            ]}
          >
            <ShieldCheck
              size={15}
              color={activeTab === "Throne" ? "#000" : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "Throne" ? "#000" : colors.textMuted },
              ]}
            >
              Verified Portals
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "Google" ? (
          <Animated.View entering={FadeInUp} style={styles.searchSectionWrapper}>
            
            {/* Elegant Unified Search Card */}
            {showSearch && (
              <GlassCard style={[styles.unifiedSearchCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <View style={styles.searchRowField}>
                  <Search size={18} color={Theme.colors.primary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Job title, keywords..."
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={() => fetchJobs(query, selectedLocation)}
                    returnKeyType="search"
                  />
                </View>

                <View style={[styles.searchDivider, { backgroundColor: colors.glassBorder }]} />

                <View style={styles.searchRowField}>
                  <MapPin size={18} color={Theme.colors.secondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    value={selectedLocation}
                    onChangeText={setSelectedLocation}
                    placeholder="City, State or Remote..."
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={() => fetchJobs(query, selectedLocation)}
                    returnKeyType="search"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.mainSearchBtn, { backgroundColor: Theme.colors.primary }]}
                  onPress={() => fetchJobs(query, selectedLocation)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mainSearchBtnText}>Find Opportunities</Text>
                  <Zap size={16} color="#000" fill="#000" />
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* Quick Filter Location Pills */}
            <View style={styles.pillsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
                {LOCATIONS.map((loc) => {
                  const isActive = selectedLocation.toLowerCase() === loc.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => {
                        setSelectedLocation(loc);
                        fetchJobs(query, loc);
                      }}
                      style={[
                        styles.locPill,
                        {
                          backgroundColor: isActive ? Theme.colors.primary : colors.surface,
                          borderColor: isActive ? Theme.colors.primary : colors.glassBorder,
                        }
                      ]}
                    >
                      <Text style={[styles.locPillText, { color: isActive ? "#000" : colors.text }]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Sourcing best matching jobs...</Text>
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
                  
                  {/* Premium Job Card */}
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
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: "/job-details",
                          params: {
                            title: job.title,
                            company: job.company_name,
                            location: job.location,
                            logo: job.thumbnail,
                            applyLink: job.apply_options?.[0]?.link || job.share_link,
                            salary: job.detected_extensions?.salary || job.salary || "Competitive",
                          },
                        })
                      }
                    >
                      <View style={styles.jobHeader}>
                        <View style={[styles.logoContainer, { backgroundColor: '#fff', borderColor: colors.glassBorder }]}>
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
                          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>
                            {job.title}
                          </Text>
                          <Text style={[styles.companyName, { color: colors.textMuted }]}>
                            {job.company_name}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => {
                            const jobId = job.job_id || `${job.title}-${job.company_name}`;
                            if (isJobSaved(jobId)) {
                              unsaveJob(jobId);
                            } else {
                              saveJob({
                                id: jobId,
                                title: job.title,
                                company: job.company_name,
                                location: job.location || "Anywhere",
                                logo: job.thumbnail,
                                url: job.apply_options?.[0]?.link || job.share_link,
                                source: 'google',
                                savedAt: Date.now()
                              });
                            }
                          }}
                          style={[styles.saveBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                          activeOpacity={0.8}
                        >
                          <Heart 
                            size={18} 
                            color={isJobSaved(job.job_id || `${job.title}-${job.company_name}`) ? Theme.colors.primary : colors.textMuted} 
                            fill={isJobSaved(job.job_id || `${job.title}-${job.company_name}`) ? Theme.colors.primary : "transparent"} 
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Metadata tags */}
                      <View style={styles.tagRow}>
                        <View style={[styles.tag, { backgroundColor: Theme.colors.primary + "12" }]}>
                          <MapPin size={11} color={Theme.colors.primary} />
                          <Text style={[styles.tagText, { color: Theme.colors.primary }]}>
                            {job.location || "Anywhere"}
                          </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: Theme.colors.secondary + "12" }]}>
                          <Zap size={11} color={Theme.colors.secondary} />
                          <Text style={[styles.tagText, { color: Theme.colors.secondary }]}>
                            {job.detected_extensions?.schedule_type || "Full-time"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Interactive CTAs */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: Theme.colors.primary }]}
                        onPress={() =>
                          router.push({
                            pathname: "/builder/ats",
                            params: {
                              jobUrl: job.apply_options?.[0]?.link || job.share_link,
                              autoScan: "true",
                              jobTitle: job.title,
                              company: job.company_name,
                            },
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Zap size={13} color="#000" fill="#000" />
                        <Text style={styles.applyBtnText}>ATS Optimize & Apply</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.outlineBtn, { borderColor: colors.glassBorder }]}
                        onPress={() => Linking.openURL(job.apply_options?.[0]?.link || job.share_link)}
                        activeOpacity={0.8}
                      >
                        <Globe size={13} color={colors.text} />
                        <Text style={[styles.outlineBtnText, { color: colors.text }]}>Apply Link</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </React.Fragment>
              ))
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight} style={styles.verifiedSectionWrapper}>
            
            {/* Location Pill Selector for Verified choice */}
            <View style={[styles.pillsWrapper, { marginTop: 5, marginBottom: 15 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
                {LOCATIONS.map((loc) => {
                  const isActive = selectedLocation.toLowerCase() === loc.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => setSelectedLocation(loc)}
                      style={[
                        styles.locPill,
                        {
                          backgroundColor: isActive ? Theme.colors.primary : colors.surface,
                          borderColor: isActive ? Theme.colors.primary : colors.glassBorder,
                        }
                      ]}
                    >
                      <Text style={[styles.locPillText, { color: isActive ? "#000" : colors.text }]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

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

                {/* Premium Verified Company Card */}
                <TouchableOpacity
                  style={[
                    styles.throneCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/job-details",
                      params: {
                        title: job.title,
                        company: job.company,
                        location: job.loc,
                        logo: "",
                        applyLink: job.url,
                        salary: job.salary || "Competitive",
                      },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.hotBadge, { backgroundColor: Theme.colors.primary }]}>
                    <ShieldCheck size={11} color="#000" fill="#000" />
                    <Text style={styles.hotText}>OFFICIAL CAREER PORTAL</Text>
                  </View>

                  <View style={styles.throneTop}>
                    <View
                      style={[
                        styles.throneLogo,
                        { backgroundColor: Theme.colors.primary + "15", borderColor: Theme.colors.primary + "30" },
                      ]}
                    >
                      <Briefcase size={22} color={Theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.throneTitle, { color: colors.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={[styles.throneCompany, { color: colors.textMuted }]}>
                        {job.company}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => {
                        if (isJobSaved(job.id)) {
                          unsaveJob(job.id);
                        } else {
                          saveJob({
                            id: job.id,
                            title: job.title,
                            company: job.company,
                            location: job.loc,
                            url: job.url,
                            source: 'verified',
                            salary: job.salary,
                            savedAt: Date.now()
                          });
                        }
                      }}
                      style={[styles.saveBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                      activeOpacity={0.8}
                    >
                      <Heart 
                        size={18} 
                        color={isJobSaved(job.id) ? Theme.colors.primary : colors.textMuted} 
                        fill={isJobSaved(job.id) ? Theme.colors.primary : "transparent"} 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.horizontalDivider, { backgroundColor: colors.glassBorder }]} />

                  <View style={styles.throneMeta}>
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.text }]}>
                        {job.loc}
                      </Text>
                    </View>
                    <View style={[styles.salaryBadge, { backgroundColor: Theme.colors.secondary + "12" }]}>
                      <Text style={[styles.salaryText, { color: Theme.colors.secondary }]}>
                        {job.type} • Portal
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.postedBy, { borderTopColor: colors.glassBorder }]}>
                    <Text style={[styles.postedText, { color: colors.textMuted }]}>
                      Safety Status:{" "}
                      <Text style={{ color: '#10b981', fontWeight: "800" }}>
                        100% Secure Direct Link
                      </Text>
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} />
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
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 20,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 15,
  },
  tabActive: {
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // Search section overrides
  searchSectionWrapper: {
    gap: 15,
  },
  unifiedSearchCard: {
    borderRadius: 26,
    padding: 20,
    borderWidth: 1.2,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  searchRowField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  searchDivider: {
    height: 1.2,
    width: '100%',
  },
  mainSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
  },
  mainSearchBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },

  // Pills Selection styling
  pillsWrapper: {
    marginVertical: 4,
  },
  pillsContainer: {
    gap: 10,
    paddingRight: 20,
  },
  locPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  locPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Loading overrides
  loadingContainer: {
    paddingVertical: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Cards design overhaul
  jobCard: {
    padding: 20,
    borderRadius: 26,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
  },
  jobHeader: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  jobInfo: {
    flex: 1,
    gap: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  applyBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  applyBtnText: {
    fontWeight: "800",
    fontSize: 13,
    color: "#000",
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  outlineBtnText: {
    fontWeight: "700",
    fontSize: 12,
  },

  // Verified section (Throne) overrides
  verifiedSectionWrapper: {
    gap: 15,
  },
  throneCard: {
    padding: 20,
    borderRadius: 26,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: "hidden",
  },
  hotBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hotText: {
    fontSize: 8,
    fontWeight: "900",
    color: '#000',
    letterSpacing: 0.5,
  },
  throneTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    marginBottom: 14,
  },
  throneLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  throneTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  throneCompany: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },
  horizontalDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  throneMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
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
  salaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  salaryText: {
    fontSize: 11,
    fontWeight: "800",
  },
  postedBy: {
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Sponsoring benefit overrides
  adCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.5,
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
  inlineBanner: {
    alignItems: "center",
    marginVertical: 16,
    width: "100%",
  },
});
