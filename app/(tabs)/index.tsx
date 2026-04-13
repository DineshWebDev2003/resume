import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Theme, Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth";
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
  LogOut
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { exportToPDF } from "@/utils/resume-exporter";
import { ResumeData } from "@/components/resume-templates";

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

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
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=60' }} 
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
              
              <TouchableOpacity
                onPress={handleLogout}
                style={[
                  styles.notificationBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <LogOut size={24} color={colors.text} />
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
                85%
              </Text>
              <Text style={[styles.heroDescription, { color: isDark ? colors.textMuted : "rgba(255, 255, 255, 0.9)" }]}>
                Your resume is performing well. Fix 3 issues to reach 95%.
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
          {[
            { name: "Senior UX Designer", date: "2 days ago", score: "85" },
            { name: "Product Manager", date: "1 week ago", score: "72" },
          ].map((resume, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chatCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
              onPress={() => router.push("/(tabs)/builder")}
            >
              <View style={[styles.chatAvatar, { backgroundColor: Theme.colors.primary + '15' }]}>
                <FileText size={24} color={Theme.colors.primary} />
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: colors.text }]}>{resume.name}</Text>
                <Text style={[styles.chatMessage, { color: colors.textMuted }]}>Modified {resume.date}</Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={[styles.chatScore, { color: Theme.colors.secondary, marginRight: 8 }]}>{resume.score}%</Text>
                <TouchableOpacity 
                   onPress={async () => {
                      const mockResume: ResumeData = {
                        name: "Alex Johnson",
                        title: resume.name,
                        email: "alex.johnson@example.com",
                        phone: "+1 234 567 890",
                        summary: "Strategic leader with over 10 years of experience in leading high-performance product teams and delivering market-leading solutions.",
                        experience: [
                          { role: resume.name, company: "Tech Solutions", period: "2018 - Present", description: "Led development of core cloud products and improved user retention by 45%." },
                        ],
                        skills: "Strategy, Leadership, Cloud Computing, AI, Product Lifecycle, Agile",
                        education: { degree: "Master of Design", school: "Stanford University", year: "2014" }
                      };
                      await exportToPDF(mockResume, 'Modern');
                   }}
                   style={styles.downloadIconBtn}
                >
                  <Download size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Career & Jobs Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended Jobs
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/resumes")}>
            <Text style={styles.seeAll}>Search Jobs</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(900)} style={styles.jobsList}>
          {[
            { role: "Product Designer", company: "Google", loc: "Remote", type: "Full-time" },
            { role: "UX Researcher", company: "Meta", loc: "London", type: "Hybrid" },
          ].map((job, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
            >
              <View style={styles.jobInfo}>
                <Text style={[styles.jobRole, { color: colors.text }]}>{job.role}</Text>
                <Text style={[styles.jobCompany, { color: colors.textMuted }]}>{job.company} • {job.loc}</Text>
                <View style={styles.jobTags}>
                  <View style={[styles.tag, { backgroundColor: Theme.colors.secondary + '10' }]}>
                    <Text style={[styles.tagText, { color: Theme.colors.secondary }]}>{job.type}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: '#4A90E210' }]}>
                    <Text style={[styles.tagText, { color: '#4A90E2' }]}>₹6L - ₹12L</Text>
                  </View>
                </View>
              </View>
              <View style={styles.applyBtn}>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
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
  jobsList: {
    gap: 12,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  jobInfo: {
    flex: 1,
  },
  jobRole: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    marginBottom: 12,
  },
  jobTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  applyBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
});
