import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signOut } from "@/services/auth";
import { db } from "@/services/firebase";
import { getAtsHistory } from "@/services/firestore";
import { exportToPDF } from "@/utils/resume-exporter";
import { getResumes } from "@/utils/storage";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowRight,
  Bell,
  Briefcase,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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
      image: require("@/assets/images/nav-icons/create.png"),
    },
    {
      id: "my",
      name: "My Resumes",
      route: "/my-resumes",
      image: require("@/assets/images/nav-icons/Builder.png"),
    },
    {
      id: "jobs",
      name: "My Jobs",
      route: "/my-jobs",
      image: require("@/assets/images/nav-icons/jobs.png"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
      />

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
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={[
                styles.notificationBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Bell size={24} color={colors.text} />
              <View
                style={[styles.badge, { borderColor: colors.background }]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ATS Score Hero */}
        <Animated.View entering={FadeInUp.delay(200)}>
          {!atsScore ? (
            <LinearGradient
              colors={isDark ? ['#6366F1', '#4F46E5', '#1E1B4B'] : ['#EEF2FF', '#C7D2FE', '#E0E7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                {
                  borderRadius: 28,
                  marginBottom: 24,
                  overflow: 'hidden',
                  padding: 1.5,
                },
                isDark && { borderWidth: 1, borderColor: colors.glassBorder },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.push("/builder/ats")}
                activeOpacity={0.8}
                style={[styles.heroCardInner, { backgroundColor: isDark ? 'rgba(30, 27, 75, 0.65)' : 'rgba(255, 255, 255, 0.65)' }]}
              >
                {/* Decorative halos */}
                <View style={[styles.glowRing, { borderColor: 'rgba(99, 102, 241, 0.15)', right: -40, top: -10, width: 200, height: 200, borderRadius: 100 }]} />
                <View style={[styles.glowRingOuter, { borderColor: 'rgba(99, 102, 241, 0.05)', right: -50, top: -20, width: 220, height: 220, borderRadius: 110 }]} />

                <View style={styles.heroContent}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.matchBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                      <Sparkles size={10} color={Theme.colors.primary} fill={Theme.colors.primary} />
                      <Text style={[styles.matchBadgeText, { color: colors.text }]}>
                        ATS Scanner
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.heroPromoTitle, { color: colors.text, fontSize: 22, marginTop: 4, width: '100%' }]}>
                    Ready to beat the ATS?
                  </Text>
                  
                  <Text style={[styles.heroDescription, { color: colors.textMuted, marginTop: 4, width: '100%', marginBottom: 12 }]}>
                    Analyze your resume against any job description using advanced neural parsing to get hired.
                  </Text>

                  <View style={[styles.improveBtn, { backgroundColor: Theme.colors.primary, paddingHorizontal: 22, paddingVertical: 10, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.improveBtnText, { color: '#000', fontWeight: '800' }]}>
                      Scan Resume
                    </Text>
                  </View>
                </View>

                <View style={[styles.scoreCircle, { right: 10, top: '50%', marginTop: -50, width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(99, 102, 241, 0.2)', backgroundColor: 'rgba(0,0,0,0.02)', position: 'absolute' }]}>
                  <View style={[styles.scoreCircleInner, { width: 88, height: 88, borderRadius: 44, borderColor: 'rgba(99, 102, 241, 0.1)', position: 'absolute' }]} />
                  <Text style={[styles.scoreNumber, { color: colors.text, fontSize: 26, fontWeight: '900' }]}>--</Text>
                  <Text style={[styles.scoreLabel, { color: colors.textMuted, fontSize: 8 }]}>ATS MATCH</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          ) : (() => {
            const getDashboardMatch = (scoreNum: number) => {
              if (scoreNum < 50) return { label: 'Low Match', status: 'Action Required', color: '#EF4444' };
              if (scoreNum < 80) return { label: 'Fair Match', status: 'Keep Improving', color: '#F59E0B' };
              return { label: 'Strong Match', status: 'Highly Compatible!', color: '#10B981' };
            };
            const match = getDashboardMatch(atsScore);
            return (
              <LinearGradient
                colors={isDark ? ['#6366F1', '#4F46E5', '#1E1B4B'] : ['#EEF2FF', '#C7D2FE', '#E0E7FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  {
                    borderRadius: 28,
                    marginBottom: 24,
                    overflow: 'hidden',
                    padding: 1.5,
                  },
                  isDark && { borderWidth: 1, borderColor: colors.glassBorder },
                ]}
              >
                <View style={[styles.heroCardInner, { backgroundColor: isDark ? 'rgba(30, 27, 75, 0.65)' : 'rgba(255, 255, 255, 0.65)' }]}>
                  {/* Outer decorative halos */}
                  <View style={[styles.glowRing, { borderColor: match.color + '15', left: undefined, right: -40, top: -10, width: 200, height: 200, borderRadius: 100 }]} />
                  <View style={[styles.glowRingOuter, { borderColor: match.color + '05', left: undefined, right: -50, top: -20, width: 220, height: 220, borderRadius: 110 }]} />

                  <View style={styles.heroContent}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.matchBadge, { backgroundColor: match.color + '15' }]}>
                        <Zap size={10} color={match.color} fill={match.color} />
                        <Text style={[styles.matchBadgeText, { color: match.color }]}>
                          {match.label}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.heroPromoTitle, { color: colors.text, fontSize: 22, marginTop: 4, width: '100%' }]}>
                      {match.status}
                    </Text>
                    
                    <Text style={[styles.heroDescription, { color: colors.textMuted, marginTop: 4, width: '100%', marginBottom: 12 }]}>
                      Your resume is scanned. View audit details to improve it.
                    </Text>

                    <View style={[styles.progressBarBg, { marginTop: 0, marginBottom: 16, width: '90%' }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                             width: `${atsScore}%`, 
                             backgroundColor: match.color 
                          }
                        ]} 
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.improveBtn,
                        { backgroundColor: match.color, paddingHorizontal: 22, paddingVertical: 10 }
                      ]}
                      onPress={() => router.push("/builder/ats")}
                    >
                      <Text style={[styles.improveBtnText, { color: '#fff', fontWeight: '800' }]}>
                        View Audit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.scoreCircle, { right: 10, top: '50%', marginTop: -50, width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: match.color, backgroundColor: 'rgba(0,0,0,0.02)', position: 'absolute' }]}>
                    <View style={[styles.scoreCircleInner, { width: 88, height: 88, borderRadius: 44, borderColor: match.color + '30', position: 'absolute' }]} />
                    <Text style={[styles.scoreNumber, { color: match.color, fontSize: 26, fontWeight: '900' }]}>{atsScore}%</Text>
                    <Text style={[styles.scoreLabel, { color: colors.textMuted, fontSize: 8 }]}>ATS MATCH</Text>
                  </View>
                </View>
              </LinearGradient>
            );
          })()}
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
                      source={require("@/assets/images/nav-icons/resume.png")}
                      style={styles.resumeIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                    {resume.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {resume.type === "ats" ? (
                      <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(34, 191, 192, 0.15)' : 'rgba(26, 158, 159, 0.1)' }]}>
                        <Text style={[styles.badgeText, { color: isDark ? '#22BFC0' : '#1A9E9F' }]}>
                          ATS {resume.score}%
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(137, 196, 244, 0.15)' : 'rgba(137, 196, 244, 0.1)' }]}>
                        <Text style={[styles.badgeText, { color: '#89C4F4' }]}>
                          Manual
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.chatMessage, { color: colors.textMuted }]}>
                      {resume.type === "ats" ? "Checked" : `Modified ${resume.date}`}
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
                        <Briefcase size={24} color={colors.text} />
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
    borderWidth: 1,
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
    borderWidth: 1,
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
  heroContent: {
    flex: 1,
    zIndex: 1,
    paddingRight: 100,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroScore: {
    fontSize: 52,
    fontWeight: "900",
    marginVertical: 4,
  },
  heroPromoTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 4,
    width: "80%",
  },
  heroDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    width: "90%",
  },
  improveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  improveBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },
  scoreCircle: {
    position: "absolute",
    right: -30,
    top: -10,
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 15,
    opacity: 0.1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
    borderWidth: 1.5,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
  heroCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26.5,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1.5,
    opacity: 0.6,
  },
  glowRingOuter: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreCircleInner: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.7,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -1,
  },
});
