import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signOut } from "@/services/auth";
import { db } from "@/services/firebase";
import { getAtsHistory } from "@/services/firestore";
import { exportToPDF } from "@/utils/resume-exporter";
import { getResumes } from "@/utils/storage";
import {
  applyOtaUpdate,
  checkForAppUpdate,
  openStore,
  type UpdateInfo,
} from "@/services/appUpdate";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import {
    ArrowRight,
    Bell,
    ChevronRight,
    Download,
    MapPin,
    Plus,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    InteractionManager,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Dashboard jobs rail cache — avoids the SerpApi round-trip on every focus.
let dashJobsCache: { key: string; at: number; data: any[] } | null = null;
const DASH_JOBS_TTL = 10 * 60 * 1000;

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [updateInfo, setUpdateInfo] = useState<(UpdateInfo & { storeUrl?: string }) | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        InteractionManager.runAfterInteractions(async () => {
          setIsLoading(true);
          try {
            const localResumes = await getResumes();
            let atsHistory = [];

            if (user) {
              try {
                atsHistory = await getAtsHistory();
              } catch (e) {
                console.warn(
                  "Dashboard: ATS History restricted or not found",
                  e,
                );
              }
            }

            setResumes([
              ...localResumes.map((r) => ({ ...r, type: "builder" })),
              ...atsHistory.map((a: any) => ({
                ...a,
                name: a.resumeName,
                date: "recent",
                type: "ats",
              })),
            ]);

            if (atsHistory.length > 0) {
              setAtsScore(atsHistory[0].score);
            }

            // Fetch Jobs based on Profile Roles
            if (user) {
              let userDocData: any = null;
              try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                  userDocData = userDoc.data();
                }
              } catch (e) {
                console.warn("Dashboard: User profile restricted", e);
              }

              if (userDocData) {
                const roles = userDocData.jobRoles || [];
                const location = userDocData.location || "India";
                if (roles.length > 0) {
                  const query = `${roles[0]} jobs in ${location}`;
                  const cacheKey = `${roles[0]}|${location}`;
                  const cachedJobs =
                    dashJobsCache &&
                    dashJobsCache.key === cacheKey &&
                    Date.now() - dashJobsCache.at < DASH_JOBS_TTL
                      ? dashJobsCache.data
                      : null;
                  if (cachedJobs) {
                    setRecommendedJobs(cachedJobs);
                  } else {
                    const API_KEY =
                      "c4ac0c4c3bf946f49c3a6b1251ebcdbe790be3978ae298102dfb6598ce9e7f2d";
                    try {
                      const res = await axios.get(
                        `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${API_KEY}`,
                      );
                      const list = res.data.jobs_results?.slice(0, 5) || [];
                      dashJobsCache = { key: cacheKey, at: Date.now(), data: list };
                      setRecommendedJobs(list);
                    } catch (e) {
                      console.error("Job fetch API error:", e);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error("Dashboard load error:", e);
          } finally {
            setIsLoading(false);
            setJobsLoading(false);
          }
        });
      };
      loadData();
    }, [user]),
  );

  // New-version check (once per mount — OTA first, Play Store second).
  React.useEffect(() => {
    let live = true;
    checkForAppUpdate()
      .then((info) => {
        if (live && info) setUpdateInfo(info);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const handleUpdatePress = async () => {
    if (!updateInfo) return;
    if (updateInfo.kind === "store" && updateInfo.storeUrl) {
      await openStore(updateInfo.storeUrl);
      return;
    }
    setUpdateBusy(true);
    try {
      await applyOtaUpdate();
    } catch (e: any) {
      console.log("Apply update failed:", e);
      setUpdateBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  const quickActions = [
    {
      id: "create",
      name: "Create",
      route: "/(tabs)/builder",
      image: require("@/assets/images/quick-action/create-resume.webp"),
    },
    {
      id: "my",
      name: "My Resumes",
      route: "/my-resumes",
      image: require("@/assets/images/quick-action/my resume.webp"),
    },
    {
      id: "jobs",
      name: "My Jobs",
      route: "/my-jobs",
      image: require("@/assets/images/quick-action/my-jobs.webp"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={[
                styles.profilePicContainer,
                { borderColor: colors.glassBorder },
              ]}
            >
              <Image
                source={{
                  uri:
                    user?.photoURL ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=60",
                }}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>
                Welcome back,
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.displayName || user?.email?.split("@")[0] || "User"} 👋
              </Text>
            </View>
          </View>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                padding: 4,
              }}
            >
              <Bell size={24} color={colors.text} />
              <View
                style={[styles.badge, { borderColor: colors.background, top: 4, right: 4 }]}
              />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ATS Hero — premium glass gradient */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <TouchableOpacity
            onPress={() => router.push("/builder/ats")}
            activeOpacity={0.92}
          >
            <LinearGradient
              colors={["#9d6bff", Theme.colors.primary, "#5b21b6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.atsCard}
            >
              {/* Decorative glow circles */}
              <View style={styles.atsGlowBig} />
              <View style={styles.atsGlowSmall} />
              <View style={styles.atsGlowRing} />

              <View style={styles.atsTopRow}>
                <View style={styles.atsCardLeft}>
                  <View style={styles.atsBadge}>
                    <View
                      style={[
                        styles.atsDot,
                        {
                          backgroundColor:
                            atsScore == null
                              ? "#fff"
                              : atsScore < 50
                                ? "#ef4444"
                                : atsScore < 80
                                  ? "#f59e0b"
                                  : "#10b981",
                        },
                      ]}
                    />
                    <Text style={styles.atsBadgeText}>
                      {!atsScore
                        ? "AI ATS SCANNER"
                        : atsScore < 50
                          ? "LOW MATCH"
                          : atsScore < 80
                            ? "FAIR MATCH"
                            : "STRONG MATCH"}
                    </Text>
                  </View>
                  <View style={styles.atsScoreRow}>
                    <Text style={styles.atsScoreBig}>
                      {atsScore === null ? "--" : `${atsScore}`}
                    </Text>
                    <Text style={styles.atsScoreUnit}>/100</Text>
                  </View>
                  <Text style={styles.atsCardTitle} numberOfLines={1}>
                    {!atsScore
                      ? "Ready to beat the ATS?"
                      : atsScore < 50
                        ? "Action Required"
                        : atsScore < 80
                          ? "Keep Improving"
                          : "Highly Compatible!"}
                  </Text>
                  <Text style={styles.atsCardDesc} numberOfLines={1}>
                    {!atsScore
                      ? "Analyze your resume against any job posting in seconds"
                      : "View the full audit to boost your score."}
                  </Text>
                </View>
                <View style={styles.atsSideBadge}>
                  <ExpoImage
                    source={require("@/assets/images/cv.webp")}
                    style={styles.atsSideImage}
                    contentFit="contain"
                  />
                  <Text style={styles.atsSideText}>
                    {atsScore === null ? "NOT\nSCANNED" : atsScore < 50 ? "NEEDS\nWORK" : atsScore < 80 ? "GOOD\nGOING" : "TOP\nRATED"}
                  </Text>
                </View>
              </View>

              <View style={styles.atsProgressTrack}>
                <View
                  style={[
                    styles.atsProgressFill,
                    {
                      flex: (atsScore ?? 0) / 100,
                      backgroundColor:
                        atsScore == null
                          ? "#fff"
                          : atsScore < 50
                            ? "#ef4444"
                            : atsScore < 80
                              ? "#f59e0b"
                              : "#10b981",
                    },
                  ]}
                />
                <View style={{ flex: 1 - (atsScore ?? 0) / 100 }} />
              </View>

              <View style={styles.atsActionBtn}>
                <Text style={styles.atsActionText}>
                  {!atsScore ? "Scan My Resume" : "View Full Audit"}
                </Text>
                <View style={styles.atsArrowCircle}>
                  <ArrowRight size={14} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* New version banner */}
        {updateInfo && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <View
              style={[
                styles.updateCard,
                { backgroundColor: colors.surface, borderColor: "#10b98155" },
              ]}
            >
              <View style={styles.updateIconBox}>
                <Download size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.updateTitle, { color: colors.text }]}>
                  {updateInfo.kind === "ota"
                    ? "Update ready to apply"
                    : `New version ${updateInfo.version} available`}
                </Text>
                <Text
                  style={[styles.updateDesc, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {updateInfo.kind === "ota"
                    ? "Tap apply — restarts in seconds"
                    : "Tap update to get it from Play Store"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.updateBtn, { opacity: updateBusy ? 0.6 : 1 }]}
                onPress={handleUpdatePress}
                disabled={updateBusy}
                activeOpacity={0.8}
              >
                {updateBusy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateBtnText}>
                    {updateInfo.kind === "ota" ? "Apply" : "Update"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions Row (3 Separate Glassmorphic Boxes) */}
        <View style={styles.gridContainer}>
          {quickActions.map((action, index) => {
            return (
              <Animated.View
                key={action.id}
                style={{ flex: 1 }}
                entering={FadeInDown.delay(300 + index * 100)}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push(action.route as any)}
                >
                  <ExpoImage
                    source={action.image}
                    style={styles.iconImage}
                    contentFit="contain"
                  />
                  <Text
                    style={[styles.iconLabel, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {action.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Recent Resumes (Chat Style) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Resumes
          </Text>
          <TouchableOpacity onPress={() => router.push("/my-resumes")}>
            <Text style={styles.seeAll}>Manage All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.horizontalJobsContainer}>
          {resumes.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollPadding}
              decelerationRate="fast"
            >
              {resumes.slice(0, 6).map((resume, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  style={[
                    styles.jobSmallCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() =>
                    router.push(
                      resume.type === "ats"
                        ? "/builder/ats"
                        : resume.source === "upload"
                          ? ({ pathname: "/resume-pdf-viewer", params: { resumeId: resume.id } } as any)
                          : ({
                              pathname: "/builder/manual",
                              params: { resumeId: resume.id },
                            } as any),
                    )
                  }
                >
                  <View style={styles.jobSmallLogoWrap}>
                    <ExpoImage
                      source={require("@/assets/images/cv.webp")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  </View>
                  <Text
                    style={[styles.jobSmallTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {resume.name}
                  </Text>
                  <Text
                    style={[
                      styles.jobSmallCompany,
                      { color: colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {resume.type === "ats"
                      ? `ATS ${resume.score}%`
                      : "Manual"}
                  </Text>
                  <View style={styles.jobSmallFooter}>
                    <Text
                      style={[styles.jobTagText, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {resume.type === "ats"
                        ? "Checked"
                        : `Modified ${resume.date}`}
                    </Text>
                    {resume.type === "builder" ? (
                      <TouchableOpacity
                        onPress={async () =>
                          await exportToPDF(resume.data, resume.template)
                        }
                        style={styles.applyBtnSmall}
                      >
                        <Download size={14} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.applyBtnSmall}>
                        <ChevronRight size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.viewMoreCardSmall}
                activeOpacity={0.8}
                onPress={() => router.push("/my-resumes")}
              >
                <View style={styles.viewMoreIcon}>
                  <ArrowRight size={22} color={Theme.colors.primary} />
                </View>
                <Text style={[styles.viewMoreText, { color: colors.text }]}>
                  Manage All
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>😔</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No resumes found
              </Text>
              <TouchableOpacity
                style={styles.createBtnInline}
                onPress={() => router.push("/(tabs)/builder")}
              >
                <Text style={styles.createBtnInlineText}>
                  Create your first resume
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Career & Jobs Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended Jobs
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={styles.seeAll}>Search Jobs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.horizontalJobsContainer}>
          {jobsLoading ? (
            <ActivityIndicator
              color={Theme.colors.primary}
              style={{ marginVertical: 40 }}
            />
          ) : recommendedJobs.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollPadding}
              decelerationRate="fast"
            >
              {recommendedJobs.slice(0, 6).map((job, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  style={[
                    styles.jobSmallCard,
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
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
                          job.detected_extensions?.salary || "Competitive",
                      },
                    })
                  }
                >
                  <View style={styles.jobSmallLogoWrap}>
                    {job.thumbnail ? (
                      <Image
                        source={{ uri: job.thumbnail }}
                        style={styles.jobLogo}
                      />
                    ) : (
                      <ExpoImage
                        source={require("@/assets/case.webp")}
                        style={{ width: 22, height: 22 }}
                        contentFit="contain"
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.jobSmallTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {job.title}
                  </Text>
                  <Text
                    style={[
                      styles.jobSmallCompany,
                      { color: colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {job.company_name}
                  </Text>
                  <View style={styles.jobSmallFooter}>
                    <View style={styles.jobTag}>
                      <MapPin size={10} color={Theme.colors.secondary} />
                      <Text style={styles.jobTagText} numberOfLines={1}>
                        {(job.location || "Anywhere").split(",")[0]}
                      </Text>
                    </View>
                    <View style={styles.applyBtnSmall}>
                      <ArrowRight size={14} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.viewMoreCardSmall}
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/jobs")}
              >
                <View style={styles.viewMoreIcon}>
                  <ArrowRight size={22} color={Theme.colors.primary} />
                </View>
                <Text style={[styles.viewMoreText, { color: colors.text }]}>
                  View All Jobs
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Update profile to get job matches
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(tabs)/builder")}
      >
        <Plus size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profilePicContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    overflow: "hidden",
  },
  profilePic: {
    width: "100%",
    height: "100%",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  badge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 1.5,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    marginBottom: 24,
    overflow: "hidden",
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    borderRadius: 14,
    borderWidth: 0,
    ...Theme.shadow,
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  actionCard: {
    height: 115,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Theme.colors.surface,
  },
  cardImageBg: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  cardOverlay: {
    padding: 10,
    justifyContent: "space-between",
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  neoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardIndex: {
    position: "absolute",
    right: -5,
    top: -5,
    fontSize: 60,
    fontWeight: "900",
  },
  cardMain: { flex: 1, alignItems: "center", justifyContent: "center" },
  neoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  neoTextSection: { alignItems: "center" },
  neoTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  neoDesc: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  neoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  neoActionText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  neoArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  seeAll: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  resumeCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalStripe: {
    width: 6,
    height: "100%",
  },
  resumeIconBox: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  resumeIcon: {
    width: "100%",
    height: "100%",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "800",
  },
  chatMessage: {
    fontSize: 12,
    fontWeight: "500",
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatScore: {
    fontWeight: "800",
    fontSize: 15,
  },
  downloadIconBtn: {
    padding: 6,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 8,
    marginRight: 4,
  },
  horizontalJobsContainer: {
    marginHorizontal: -20,
    marginBottom: 40,
  },
  horizontalScrollPadding: {
    paddingHorizontal: 20,
    gap: 12,
  },
  jobSmallCard: {
    width: (width - 52) / 2,
    height: 182,
    padding: 14,
    borderRadius: 20,
    justifyContent: "flex-start",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
    marginBottom: 10,
  },
  jobSmallLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(128,128,128,0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
    marginBottom: 10,
  },
  jobCardRight: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 20,
    justifyContent: "space-between",
  },
  jobLogo: {
    width: "100%",
    height: "100%",
  },
  jobSmallTitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 3,
  },
  jobSmallCompany: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
  },
  jobSmallFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  jobTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    maxWidth: "75%",
  },
  jobTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.colors.secondary,
    flexShrink: 1,
  },
  applyBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  viewMoreCardSmall: {
    width: (width - 52) / 2,
    height: 182,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(128,128,128,0.05)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(128,128,128,0.2)",
    marginBottom: 10,
  },
  viewMoreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    display: "none",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(128,128,128,0.05)",
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(128,128,128,0.2)",
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  createBtnInline: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  createBtnInlineText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  bannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "transparent",
    paddingBottom: 4,
  },
  // ─── New version banner ───
  updateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 16,
    ...Theme.shadow,
  },
  updateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#10b98118",
    justifyContent: "center",
    alignItems: "center",
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  updateDesc: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  updateBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  atsCard: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    overflow: "hidden",
    width: "100%",
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  atsGlowBig: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  atsGlowSmall: {
    position: "absolute",
    top: 40,
    right: 90,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  atsGlowRing: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 14,
    borderColor: "rgba(255,255,255,0.08)",
  },
  atsTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  atsCardLeft: {
    flex: 1,
    gap: 3,
  },
  atsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  atsBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#fff",
  },
  atsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  atsScoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 2,
  },
  atsScoreBig: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 30,
  },
  atsScoreUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 5,
    marginLeft: 2,
  },
  atsCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  atsCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.82)",
  },
  atsSideBadge: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
    gap: 6,
  },
  atsSideIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  atsSideImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
  },
  atsSideText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 13,
  },
  atsProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.22)",
    marginTop: 8,
    overflow: "hidden",
    flexDirection: "row",
    width: "100%",
  },
  atsProgressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  atsActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  atsActionText: {
    color: "#1e1b4b",
    fontSize: 13,
    fontWeight: "900",
  },
  atsArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularScore({ score, onDark }: { score: number | null; onDark?: boolean }) {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (score !== null) {
      progress.value = withTiming(score / 100, { duration: 1000 });
    }
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor = onDark
    ? "#fff"
    : score === null ? Theme.colors.primary
    : score < 50 ? "#ef4444"
    : score < 80 ? "#f59e0b"
    : "#10b981";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={onDark ? "rgba(255,255,255,0.3)" : "#f0e8ff"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: '900', color: scoreColor }}>
        {score === null ? '--' : `${score}%`}
      </Text>
    </View>
  );
}
