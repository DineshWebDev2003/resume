import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signOut } from "@/services/auth";
import { db } from "@/services/firebase";
import { getAtsHistory } from "@/services/firestore";
import { exportToPDF } from "@/utils/resume-exporter";
import { getResumes } from "@/utils/storage";
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
    Sparkles,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [atsScore, setAtsScore] = useState<number | null>(null);
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
                  const API_KEY =
                    "c4ac0c4c3bf946f49c3a6b1251ebcdbe790be3978ae298102dfb6598ce9e7f2d";
                  try {
                    const res = await axios.get(
                      `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${API_KEY}`,
                    );
                    setRecommendedJobs(
                      res.data.jobs_results?.slice(0, 5) || [],
                    );
                  } catch (e) {
                    console.error("Job fetch API error:", e);
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
      image: require("@/assets/document (1).png"),
    },
    {
      id: "my",
      name: "My Resumes",
      route: "/my-resumes",
      image: require("@/assets/resume (1).png"),
    },
    {
      id: "jobs",
      name: "My Jobs",
      route: "/my-jobs",
      image: require("@/assets/case.png"),
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
        {/* ATS Score Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <TouchableOpacity
            onPress={() => router.push("/builder/ats")}
            activeOpacity={0.8}
            style={[styles.atsCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.atsCardLeft}>
              <View
                style={[
                  styles.atsBadge,
                  {
                    backgroundColor: !atsScore
                      ? Theme.colors.primary + "15"
                      : atsScore < 50 ? "#ef444415" : atsScore < 80 ? "#f59e0b15" : "#10b98115",
                  },
                ]}
              >
                <Sparkles
                  size={10}
                  color={!atsScore ? Theme.colors.primary : atsScore < 50 ? "#ef4444" : atsScore < 80 ? "#f59e0b" : "#10b981"}
                  fill={!atsScore ? Theme.colors.primary : atsScore < 50 ? "#ef4444" : atsScore < 80 ? "#f59e0b" : "#10b981"}
                />
                <Text
                  style={[
                    styles.atsBadgeText,
                    { color: !atsScore ? Theme.colors.primary : atsScore < 50 ? "#ef4444" : atsScore < 80 ? "#f59e0b" : "#10b981" },
                  ]}
                >
                  {!atsScore ? "ATS Scanner" : atsScore < 50 ? "Low Match" : atsScore < 80 ? "Fair Match" : "Strong Match"}
                </Text>
              </View>

              <Text style={[styles.atsCardTitle, { color: colors.text }]} numberOfLines={1}>
                {!atsScore ? "Ready to beat the ATS?" : atsScore < 50 ? "Action Required" : atsScore < 80 ? "Keep Improving" : "Highly Compatible!"}
              </Text>

              <Text style={[styles.atsCardDesc, { color: colors.textMuted }]} numberOfLines={1}>
                {!atsScore ? "Analyze your resume against any job" : "View the full audit to improve your score."}
              </Text>

              <View
                style={[styles.atsActionBtn, { backgroundColor: !atsScore ? Theme.colors.primary : atsScore < 50 ? "#ef4444" : atsScore < 80 ? "#f59e0b" : "#10b981" }]}
              >
                <Text style={styles.atsActionText}>{!atsScore ? "Scan Resume" : "View Audit"}</Text>
              </View>
            </View>

            <View style={styles.atsCardRight}>
              <CircularScore score={atsScore} />
            </View>
          </TouchableOpacity>
        </Animated.View>

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
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={() => router.push(action.route as any)}
                >
                  <Image
                    source={action.image}
                    style={styles.iconImage}
                    resizeMode="contain"
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
        <Animated.View entering={FadeInDown.delay(700)}>
          {resumes.length > 0 ? (
            resumes.slice(0, 2).map((resume, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.chatCard,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() =>
                  router.push(
                    resume.type === "ats"
                      ? "/builder/ats"
                      : ({
                          pathname: "/builder/manual",
                          params: { resumeId: resume.id },
                        } as any),
                  )
                }
              >
                <View style={styles.resumeCardLeft}>
                  <View style={styles.resumeIconBox}>
                    <Image
                      source={require("@/assets/images/cv.png")}
                      style={styles.resumeIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <View style={styles.chatInfo}>
                  <Text
                    style={[styles.chatName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {resume.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    {resume.type === "ats" ? (
                      <View
                        style={[
                          styles.badgeContainer,
                          {
                            backgroundColor: isDark
                              ? "rgba(34, 191, 192, 0.15)"
                              : "rgba(26, 158, 159, 0.1)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: isDark ? "#22BFC0" : "#1A9E9F" },
                          ]}
                        >
                          ATS {resume.score}%
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.badgeContainer,
                          {
                            backgroundColor: isDark
                              ? "rgba(137, 196, 244, 0.15)"
                              : "rgba(137, 196, 244, 0.1)",
                          },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: "#89C4F4" }]}>
                          Manual
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[styles.chatMessage, { color: colors.textMuted }]}
                    >
                      {resume.type === "ats"
                        ? "Checked"
                        : `Modified ${resume.date}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.chatMeta}>
                  {resume.type === "builder" && (
                    <TouchableOpacity
                      onPress={async () =>
                        await exportToPDF(resume.data, resume.template)
                      }
                      style={styles.downloadIconBtn}
                    >
                      <Download size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
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
        </Animated.View>

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
              snapToInterval={width * 0.85 + 16}
              decelerationRate="fast"
            >
              {recommendedJobs.slice(0, 2).map((job, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.jobCardHorizontal,
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
                  <View style={styles.jobCardTop}>
                    <View style={styles.jobLogoContainer}>
                      {job.thumbnail ? (
                        <Image
                          source={{ uri: job.thumbnail }}
                          style={styles.jobLogo}
                        />
                      ) : (
                        <Image
                          source={require("@/assets/case.png")}
                          style={{ width: 24, height: 24 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.jobCardTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {job.title}
                      </Text>
                      <Text
                        style={[
                          styles.jobCardCompany,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {job.company_name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.jobCardBottom}>
                    <View style={styles.jobTag}>
                      <MapPin size={12} color={Theme.colors.secondary} />
                      <Text style={styles.jobTagText}>
                        {job.location || "Anywhere"}
                      </Text>
                    </View>
                    <View style={styles.applyBtnSmall}>
                      <ArrowRight size={16} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.viewMoreCard}
                onPress={() => router.push("/(tabs)/jobs")}
              >
                <View style={styles.viewMoreIcon}>
                  <ArrowRight size={24} color={Theme.colors.primary} />
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
    aspectRatio: 1,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  iconImage: {
    width: 48,
    height: 48,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
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
    gap: 16,
  },
  jobCardHorizontal: {
    width: width * 0.85,
    padding: 20,
    borderRadius: 28,
    height: 160,
    justifyContent: "space-between",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
    marginBottom: 10,
  },
  jobCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  jobLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(128,128,128,0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
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
  jobCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  jobCardCompany: {
    fontSize: 14,
    fontWeight: "600",
  },
  jobCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
  applyBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreCard: {
    width: 140,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "rgba(128,128,128,0.05)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(128,128,128,0.2)",
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
    color: "#000",
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
  // ─── Modern ATS Card ─────────────────────────────────────
  atsCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  atsCardLeft: {
    flex: 1,
    gap: 6,
  },
  atsCardRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  atsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  atsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  atsCardTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  atsCardDesc: {
    fontSize: 12,
    lineHeight: 15,
  },
  atsActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  atsActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularScore({ score }: { score: number | null }) {
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

  const scoreColor = score === null ? Theme.colors.primary
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
          stroke="#f0e8ff"
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
