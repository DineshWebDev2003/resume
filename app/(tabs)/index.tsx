import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Theme, Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import axios from "axios";
import { 
  Bell, 
  Search, 
  Plus, 
  FileText, 
  Briefcase, 
  Zap, 
  ChevronRight,
  Sparkles,
  Target,
  ArrowRight,
  Download,
  Clock,
  LogOut,
  MapPin
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { exportToPDF } from "@/utils/resume-exporter";
import { ResumeData } from "@/components/resume-templates";
import { getResumes } from "@/utils/storage";
import { getAtsHistory } from "@/services/firestore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { API_CONFIG } from "@/constants/config";

const { width } = Dimensions.get('window');
const bannerId = __DEV__ ? TestIds.BANNER : API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

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
        setIsLoading(true);
        try {
          const localResumes = await getResumes();
          const atsHistory = await getAtsHistory();
          
          setResumes([
            ...localResumes.map(r => ({ ...r, type: 'builder' })),
            ...atsHistory.map(a => ({ ...a, name: a.resumeName, date: 'recent', type: 'ats' }))
          ]);

          if (atsHistory.length > 0) {
            setAtsScore(atsHistory[0].score);
          }

          // Fetch Jobs based on Profile Roles
          if (user) {
            setJobsLoading(true);
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const roles = userDoc.data().jobRoles || [];
              const location = userDoc.data().location || "India";
              if (roles.length > 0) {
                const query = `${roles[0]} jobs in ${location}`;
                const API_KEY = 'c4ac0c4c3bf946f49c3a6b1251ebcdbe790be3978ae298102dfb6598ce9e7f2d';
                const res = await axios.get(`https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${API_KEY}`);
                setRecommendedJobs(res.data.jobs_results?.slice(0, 5) || []);
              }
            }
            setJobsLoading(false);
          }
        } catch (e) {
          console.error("Dashboard load error:", e);
        } finally {
          setIsLoading(false);
          setJobsLoading(false);
        }
      };
      loadData();
    }, [user])
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
      id: 'create', 
      title: 'Create\nResume', 
      icon: Plus, 
      color: Theme.colors.primary, 
      route: '/(tabs)/builder' 
    },
    { 
      id: 'ats', 
      title: 'ATS\nScore', 
      icon: Target, 
      color: Theme.colors.secondary, 
      route: '/builder/ats' 
    },
    { 
      id: 'my', 
      title: 'My\nResumes', 
      icon: FileText, 
      color: '#4A90E2', 
      route: '/(tabs)/explore' 
    },
    { 
      id: 'jobs', 
      title: 'My\nJobs', 
      icon: Clock, 
      color: '#10B981', 
      route: '/my-jobs' 
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.stickyHeader, { paddingTop: insets.top, backgroundColor: isDark ? 'rgba(18, 18, 18, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'}>
          <View style={styles.topBar}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                onPress={() => router.push("/(tabs)/explore")}
                style={[styles.profilePicContainer, { borderColor: colors.glassBorder }]}
              >
                <Image 
                  source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=60' }} 
                  style={styles.profilePic} 
                />
              </TouchableOpacity>
              <View>
                <Text style={[styles.greeting, { color: colors.textMuted }]}>
                  Welcome back,
                </Text>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user?.displayName || user?.email?.split('@')[0] || "User"} 👋
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
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
                <View style={[styles.badge, { borderColor: colors.background }]} />
              </TouchableOpacity>
              
            </View>
          </View>
        </BlurView>
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
            <TouchableOpacity 
              onPress={() => router.push('/builder/ats')}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={require('@/assets/images/ats-promo.png')}
                style={styles.heroCard}
                imageStyle={{ borderRadius: 28 }}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <View style={styles.scoreHeader}>
                    <Sparkles size={20} color="#fff" />
                    <Text style={[styles.heroTitle, { color: "#fff" }]}>
                      Unlock Your Future
                    </Text>
                  </View>
                  <Text style={[styles.heroPromoTitle, { color: "#fff" }]}>
                    Ready to beat the ATS?
                  </Text>
                  <Text style={[styles.heroDescription, { color: "rgba(255, 255, 255, 0.9)" }]}>
                    Join 10,000+ professionals who optimized their resumes and got hired.
                  </Text>
                  <View style={[styles.improveBtn, { backgroundColor: Theme.colors.primary }]}>
                    <Text style={[styles.improveBtnText, { color: '#000' }]}>
                      Check ATS Score
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <LinearGradient
              colors={
                isDark
                  ? ["#1e1e1e", "#2d2d2d"]
                  : [Theme.colors.primary, Theme.colors.accent]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.heroCard,
                isDark && { borderWidth: 1, borderColor: colors.glassBorder },
              ]}
            >
              <View style={styles.heroContent}>
                <View style={styles.scoreHeader}>
                  <Zap size={20} color={isDark ? Theme.colors.primary : "#fff"} />
                  <Text style={[styles.heroTitle, { color: isDark ? colors.text : "#fff" }]}>
                    ATS Optimization
                  </Text>
                </View>
                <Text style={[styles.heroScore, { color: isDark ? Theme.colors.primary : "#fff" }]}>
                  {atsScore}%
                </Text>
                <Text style={[styles.heroDescription, { color: isDark ? colors.textMuted : "rgba(255, 255, 255, 0.9)" }]}>
                  Your resume is performing well. Fix some issues to reach 95%.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.improveBtn,
                    { backgroundColor: isDark ? Theme.colors.primary : '#fff' },
                  ]}
                  onPress={() => router.push('/builder/ats')}
                >
                  <Text style={[styles.improveBtnText, { color: isDark ? '#000' : Theme.colors.primary }]}>
                    View Audit
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scoreCircle}>
                <View style={[styles.innerCircle, { borderColor: isDark ? Theme.colors.primary : '#fff' }]} />
                <Sparkles size={100} color="rgba(255, 255, 255, 0.15)" style={styles.sparkleBg} />
              </View>
            </LinearGradient>
          )}
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          {quickActions.map((action, index) => (
            <Animated.View 
              key={action.id} 
              entering={FadeInDown.delay(300 + index * 100)}
              style={styles.gridItem}
            >
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <action.icon size={26} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                <View style={styles.actionArrow}>
                  <ChevronRight size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Recent Resumes (Chat Style) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Resumes
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.seeAll}>Manage All</Text>
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeInDown.delay(700)}>
          {resumes.length > 0 ? (
            resumes.slice(0, 3).map((resume, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chatCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                onPress={() => router.push(resume.type === 'ats' ? '/builder/ats' : { pathname: '/builder/manual', params: { resumeId: resume.id } } as any)}
              >
                <View style={[styles.chatAvatar, { backgroundColor: resume.type === 'ats' ? Theme.colors.secondary + '15' : Theme.colors.primary + '15' }]}>
                  {resume.snapshotUri ? (
                     <Image source={{ uri: resume.snapshotUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                  ) : resume.imageUrl ? (
                     <Image source={{ uri: resume.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                  ) : (
                    resume.type === 'ats' ? <Target size={24} color={Theme.colors.secondary} /> : <FileText size={24} color={Theme.colors.primary} />
                  )}
                </View>
                <View style={styles.chatInfo}>
                  <Text style={[styles.chatName, { color: colors.text }]}>{resume.name}</Text>
                  <Text style={[styles.chatMessage, { color: colors.textMuted }]}>
                    {resume.type === 'ats' ? `ATS Checked • ${resume.score}%` : `Modified ${resume.date}`}
                  </Text>
                </View>
                <View style={styles.chatMeta}>
                  {resume.type === 'builder' && (
                    <TouchableOpacity 
                      onPress={async () => await exportToPDF(resume.data, resume.template)}
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
              <Text style={[styles.emptyText, { color: colors.text }]}>No resumes found</Text>
              <TouchableOpacity 
                style={styles.createBtnInline}
                onPress={() => router.push('/(tabs)/builder')}
              >
                <Text style={styles.createBtnInlineText}>Create your first resume</Text>
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
             <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 40 }} />
          ) : recommendedJobs.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollPadding}
              snapToInterval={width * 0.75 + 16}
              decelerationRate="fast"
            >
              {recommendedJobs.map((job, i) => (
                <TouchableOpacity 
                   key={i} 
                   style={[styles.jobCardHorizontal, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                   onPress={() => router.push({
                     pathname: '/job-details',
                     params: {
                       title: job.title,
                       company: job.company_name,
                       location: job.location,
                       logo: job.thumbnail,
                       applyLink: job.apply_options?.[0]?.link || job.share_link,
                       salary: job.detected_extensions?.salary || 'Competitive'
                     }
                   })}
                >
                   <View style={styles.jobCardTop}>
                      <View style={[styles.jobLogoContainer, { backgroundColor: '#fff' }]}>
                         {job.thumbnail ? <Image source={{ uri: job.thumbnail }} style={styles.jobLogo} /> : <Briefcase size={20} color="#000" />}
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.jobCardTitle, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
                         <Text style={[styles.jobCardCompany, { color: colors.textMuted }]} numberOfLines={1}>{job.company_name}</Text>
                      </View>
                   </View>
                   <View style={styles.jobCardBottom}>
                      <View style={styles.jobTag}>
                         <MapPin size={12} color={Theme.colors.secondary} />
                         <Text style={styles.jobTagText}>{job.location || 'Anywhere'}</Text>
                      </View>
                      <View style={styles.applyBtnSmall}>
                         <ArrowRight size={16} color="#fff" />
                      </View>
                   </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.viewMoreCard}
                onPress={() => router.push('/(tabs)/jobs')}
              >
                <View style={styles.viewMoreIcon}>
                  <ArrowRight size={24} color={Theme.colors.primary} />
                </View>
                <Text style={[styles.viewMoreText, { color: colors.text }]}>View All Jobs</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>Update profile to get job matches</Text>
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

      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={bannerId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
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
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePicContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
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
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: '80%',
  },
  heroDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    width: '90%',
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
      position: 'absolute',
      right: -30,
      top: -10,
      width: 180,
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
  },
  innerCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 15,
      opacity: 0.1,
  },
  sparkleBg: {
      position: 'absolute',
      opacity: 0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridItem: {
    width: (width - 40 - 12) / 2,
  },
  actionCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    height: 140,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  actionArrow: {
    alignSelf: 'flex-end',
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  seeAll: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatMessage: {
    fontSize: 13,
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatScore: {
    fontWeight: '800',
    fontSize: 15,
  },
  downloadIconBtn: {
    padding: 6,
    backgroundColor: 'rgba(128,128,128,0.1)',
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
    width: width * 0.75,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    height: 160,
    justifyContent: 'space-between',
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  jobLogo: {
    width: '100%',
    height: '100%',
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  jobCardCompany: {
    fontSize: 13,
    fontWeight: '600',
  },
  jobCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.secondary,
  },
  applyBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreCard: {
    width: 140,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.2)',
  },
  viewMoreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.2)',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  createBtnInline: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnInlineText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: 4,
  },
});
