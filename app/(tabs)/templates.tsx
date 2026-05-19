import { generateResumeHtml } from "@/components/resume-html-generator";
import {
    CreativeTemplate,
    ExecutiveTemplate,
    ModernTemplate,
    ProfessionalTemplate,
} from "@/components/resume-templates";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteResume, getResumes, UserResume } from "@/utils/storage";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ArrowLeft,
    Briefcase,
    ChevronRight,
    Code,
    GraduationCap,
    Heart,
    Plus,
    ShieldCheck,
    Trash2,
    Zap,
    Sparkles,
    Star
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    InteractionManager,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Extrapolate,
    FadeInDown,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH - 40;
const SPACING = 15;
const SIDE_PEEK = 20;

const TEMPLATE_SERIES = [
  {
    id: "elder",
    name: "Elder Series",
    desc: "ATS-Optimized & Professional",
    icon: ShieldCheck,
    color: "#0077b5",
    badge: "POPULAR",
    templates: [
      { id: "Elder-1", name: "Elder 1: Elite", desc: "Sleek Sidebar", badge: "POPULAR", color: Theme.colors.secondary },
      { id: "Elder-2", name: "Elder 2: ATS", desc: "ATS Master", badge: "ATS SAFE", color: "#10b981" },
      { id: "Elder-3", name: "Elder 3: LI", desc: "LinkedIn Style", badge: "EXECUTIVE", color: "#0077b5" },
      { id: "Elder-4", name: "Elder 4: Timeline", desc: "Timeline & Sidebar", badge: "CREATIVE", color: "#22a3d6" },
      { id: "Elder-5", name: "Elder 5: Right", desc: "Right Sidebar", badge: "PORTFOLIO", color: "#d946ef" },
      { id: "Elder-6", name: "Elder 6: Ribbon", desc: "Ribbon Dark Sidebar", badge: "MODERN", color: "#0ea5e9" },
      { id: "Elder-7", name: "Elder 7: Gold", desc: "Two-Tone Sidebar", badge: "PREMIUM", color: "#facc15" },
      { id: "Elder-8", name: "Elder 8: Skyline", desc: "Blue Timelines", badge: "PREMIUM", color: "#0ea5e9" },
    ]
  },
  {
    id: "titan",
    name: "Titan Series",
    desc: "Modern Grids & Bold Accents",
    icon: Zap,
    color: "#ea580c",
    badge: "MODERN",
    templates: [
      { id: "Titan-1", name: "Titan 1: PRO", desc: "Curved Dark Sidebar", badge: "NEW", color: "#1e293b" },
      { id: "Titan-2", name: "Titan 2: Dome", desc: "Purple Pill Theme", badge: "NEW", color: "#9b7eb5" },
      { id: "Titan-3", name: "Titan 3: Split", desc: "Orange Accent", badge: "NEW", color: "#ea580c" },
      { id: "Titan-4", name: "Titan 4: Ruby", desc: "Dark Red Theme", badge: "NEW", color: "#dc2626" },
    ]
  },
  {
    id: "blackwolf",
    name: "Black Wolf Series",
    desc: "Elite Minimalist Designs",
    icon: Code,
    color: "#000000",
    badge: "PREMIUM",
    templates: [
      { id: "BlackWolf-1", name: "Black Wolf 1", desc: "Elite Minimalist", badge: "PREMIUM", color: "#000000" },
      { id: "BlackWolf-2", name: "Black Wolf 2", desc: "Structured Timeline", badge: "NEW", color: "#1a1a1a" },
      { id: "BlackWolf-3", name: "Black Wolf 3", desc: "Modern Split", badge: "NEW", color: "#333333" },
      { id: "BlackWolf-4", name: "Black Wolf 4", desc: "Minimalist Two-Column", badge: "NEW", color: "#1a202c" },
    ]
  },
  {
    id: "jocker",
    name: "Jocker Series",
    desc: "Bold ATS-Friendly Layouts",
    icon: Heart,
    color: "#ec4899",
    badge: "NEW",
    templates: [
      { id: "Jocker-1", name: "Jocker 1: Pun", desc: "Bold Accent Top", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-2", name: "Jocker 2: Card", desc: "Clean Card Sections", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-3", name: "Jocker 3: Bold", desc: "High Contrast Headers", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-4", name: "Jocker 4: Trick", desc: "Typographic Focus", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-5", name: "Jocker 5: Royal", desc: "Structured Timeline", badge: "ATS Safe", color: "#ec4899" },
    ]
  }
];

const ALL_TEMPLATES = [
  { key: "t1", id: "executive", name: "Executive", isPro: false },
  { key: "t2", id: "modern", name: "Modern", isPro: true },
  { key: "t3", id: "creative", name: "Creative", isPro: false },
  { key: "t4", id: "professional", name: "Professional", isPro: true },
  { key: "t5", id: "modern", name: "Minimal", isPro: false },
  { key: "t6", id: "professional", name: "Elite Pro", isPro: true },
  { key: "t7", id: "creative", name: "Fancy Pink", isPro: false },
  { key: "t8", id: "executive", name: "Classic Grey", isPro: false },
  { key: "t9", id: "modern", name: "Bold Impact", isPro: true },
  { key: "t10", id: "professional", name: "Developer", isPro: false },
];

const TemplateMiniPreview = React.memo(
  ({
    id,
    colors,
    isDark,
    data,
  }: {
    id: string;
    colors: any;
    isDark: boolean;
    data?: any;
  }) => {
    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const targetWidth = (SCREEN_WIDTH - 56) / 2;
    const scale = targetWidth / A4_WIDTH;

    const defaultData = {
      name: "DINESH KUMAR",
      title: "Senior Full-Stack Developer",
      email: "dinesh@example.com",
      phone: "+91 9876543210",
      location: "Tamil Nadu, India",
      summary:
        "Dynamic and results-driven Senior Full-Stack Developer with over 5 years of experience in architecting and deploying high-performance mobile and web applications. Expert in React Native, Node.js, and Cloud Infrastructure. Proven track record of leading cross-functional teams to deliver scalable solutions that enhance user engagement by 40%.",
      experience: [
        {
          id: "1",
          company: "Innovate Tech Hub",
          role: "Lead Full-Stack Developer",
          period: "2022 – Present",
          description:
            "Architected and launched a flagship fintech mobile application using React Native, reaching 100k+ active users within the first quarter. Engineered a robust Node.js microservices backend that improved API response times by 60%.",
        },
        {
          id: "2",
          company: "Digital Stream Systems",
          role: "Software Engineer",
          period: "2019 – 2022",
          description:
            "Developed and maintained highly responsive web interfaces for high-traffic e-commerce platforms. Collaborated with UI/UX designers to implement pixel-perfect designs.",
        }
      ],
      education: {
        school: "Anna University",
        degree: "B.Tech Information Technology",
        year: "2015 – 2019",
        honors: "First Class with Distinction",
      },
      projects: [
        {
          id: "1",
          name: "Elite AI Resume Builder",
          link: "https://github.com/dinesh/resume-builder",
          description: "A state-of-the-art resume platform featuring real-time AI optimization.",
        },
        {
          id: "2",
          name: "CryptoPulse Tracker",
          link: "https://github.com/dinesh/cryptopulse",
          description: "A comprehensive real-time cryptocurrency monitoring dashboard.",
        }
      ],
      skills: "React Native, React, Node.js, TypeScript, AWS, Docker",
      tools: "VS Code, Git, Figma, Postman",
      languages: "English, Tamil",
      links: [
        { label: "GitHub", url: "github.com/dinesh" },
        { label: "Portfolio", url: "dinesh.dev" }
      ],
      certifications: [
        { title: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
        { title: "Meta Front-End Developer", issuer: "Coursera", year: "2022" }
      ],
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&q=80",
    };

    const resumeData = data || defaultData;

    const isHtmlTemplate = id.startsWith("Elder") || id.startsWith("Titan") || id.startsWith("BlackWolf");

    if (isHtmlTemplate) {
      const htmlString = generateResumeHtml(
        resumeData,
        id,
        colors.primary || "#1e293b",
        "Inter",
        false,
        true,
      );
      return (
        <View style={{ flex: 1, backgroundColor: "#fff", overflow: "hidden" }}>
          <WebView
              originWhitelist={["*"]}
              source={{ html: htmlString }}
              style={{ flex: 1, backgroundColor: "transparent" }}
              scalesPageToFit={true}
              scrollEnabled={false}
              javaScriptEnabled={true}
              pointerEvents="none"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              bounces={false}
            />
        </View>
      );
    }

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <View
          style={{ width: A4_WIDTH, height: A4_HEIGHT, transform: [{ scale }] }}
        >
          {id === "executive" && (
            <ExecutiveTemplate resumeData={resumeData} selectedFont="Roboto" />
          )}
          {(id === "modern" || id === "elder") && (
            <ModernTemplate resumeData={resumeData} selectedFont="Roboto" />
          )}
          {id === "creative" && (
            <CreativeTemplate resumeData={resumeData} selectedFont="Roboto" />
          )}
          {id === "professional" && (
            <ProfessionalTemplate
              resumeData={resumeData}
              selectedFont="Roboto"
            />
          )}
        </View>
      </View>
    );
  },
);


export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [resumeLimit, setResumeLimit] = useState(3);
  const loadData = async () => {
    InteractionManager.runAfterInteractions(async () => {
      setLoading(true);
      const data = await getResumes();
      setResumes(data);
      try {
        const cached = await AsyncStorage.getItem('cached_resume_limit');
        if (cached) {
          setResumeLimit(parseInt(cached, 10));
        }
      } catch (e) {
        console.log("Error reading cached_resume_limit in templates:", e);
      }
      setLoading(false);
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Resume",
      "Are you sure you want to delete this resume?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteResume(id);
            loadData();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sleek solid matching header layout */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: isDark ? '#121824' : '#F0F4F8' }]}>
        <View style={styles.headerTitleRow}>
          <Sparkles size={20} color={Theme.colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Templates
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: Theme.colors.primary }]}
          onPress={() => router.push("/builder/manual")}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#000" />
          <Text style={[styles.newButtonText, { color: "#000" }]}>Quick Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Decorative Top Banner */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.heroBanner}>
          <LinearGradient
            colors={isDark ? ['#1E2638', '#121824'] : ['#FFFFFF', '#E2E8F0']}
            style={[styles.heroBannerInner, { borderColor: colors.glassBorder, borderWidth: 1 }]}
          >
            <Text style={[styles.heroBannerTitle, { color: colors.text }]}>
              Build with the Best
            </Text>
            <Text style={[styles.heroBannerSub, { color: colors.textMuted }]}>
              Recruiter-approved layout series optimized for deep ATS parsing and maximum visual impact.
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ paddingHorizontal: 20 }}>
          {!selectedSeries ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
                Template Series
              </Text>
              <Text style={{ color: colors.textMuted, marginBottom: 20, fontSize: 13 }}>
                Select a premium layout framework below to begin editing.
              </Text>

              {TEMPLATE_SERIES.map((series, idx) => {
                // Determine decorative details based on series
                let atsScoreText = "98% ATS Match";
                let ratingText = "9.9 Recruiter Score";
                
                if (series.id === 'elder') {
                  atsScoreText = "99% ATS Safe";
                  ratingText = "9.8/10 Score";
                } else if (series.id === 'titan') {
                  atsScoreText = "94% ATS Score";
                  ratingText = "9.9/10 Score";
                } else if (series.id === 'blackwolf') {
                  atsScoreText = "97% ATS Score";
                  ratingText = "9.8/10 Score";
                } else if (series.id === 'jocker') {
                  atsScoreText = "98% ATS Score";
                  ratingText = "9.7/10 Score";
                }

                return (
                  <Animated.View
                    key={series.id}
                    entering={FadeInDown.delay(100 * idx)}
                    style={{ marginBottom: 16 }}
                  >
                    <LinearGradient
                      colors={isDark ? ['rgba(99, 102, 241, 0.05)', 'rgba(30, 38, 56, 0.4)'] : ['#FFFFFF', '#EEF2FF']}
                      style={[styles.seriesCardGradient, { borderColor: colors.glassBorder, borderWidth: 1 }]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedSeries(series.id)}
                        style={styles.seriesCardInner}
                      >
                        {/* Halos */}
                        <View style={[styles.glowRing, { borderColor: series.color + '08', right: -30, top: -10, width: 140, height: 140, borderRadius: 70, position: 'absolute' }]} />

                        <View style={[styles.seriesIconBox, { backgroundColor: series.color + "15" }]}>
                          <series.icon size={22} color={series.color} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.seriesName, { color: colors.text }]}>
                              {series.name}
                            </Text>
                            <View style={[styles.seriesBadge, { backgroundColor: series.color }]}>
                              <Text style={styles.seriesBadgeText}>{series.badge}</Text>
                            </View>
                          </View>
                          
                          <Text style={[styles.seriesDesc, { color: colors.textMuted }]} numberOfLines={1}>
                            {series.desc}
                          </Text>

                          {/* Stats capsule row */}
                          <View style={styles.statsCapsuleRow}>
                            <View style={[styles.statsCapsule, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9' }]}>
                              <ShieldCheck size={10} color={series.color} />
                              <Text style={[styles.statsCapsuleText, { color: colors.text }]}>{atsScoreText}</Text>
                            </View>
                            <View style={[styles.statsCapsule, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9' }]}>
                              <Star size={10} color="#EAB308" fill="#EAB308" />
                              <Text style={[styles.statsCapsuleText, { color: colors.text }]}>{ratingText}</Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <TouchableOpacity 
                  onPress={() => setSelectedSeries(null)}
                  style={[styles.backBtn, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
                >
                  <ArrowLeft size={18} color={colors.text} />
                </TouchableOpacity>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20 }]}>
                    {TEMPLATE_SERIES.find(s => s.id === selectedSeries)?.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    Choose a layout to build your resume
                  </Text>
                </View>
              </View>

              <View style={styles.miniGrid}>
                {TEMPLATE_SERIES.find(s => s.id === selectedSeries)?.templates.map((t, idx) => (
                  <Animated.View
                    key={t.id}
                    entering={FadeInDown.delay(80 * idx)}
                    style={[
                      styles.miniBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/builder/manual",
                          params: { templateId: t.id },
                        } as any)
                      }
                      style={{ flex: 1 }}
                    >
                      <View style={styles.miniHeader}>
                        <View style={styles.miniMockup}>
                          <TemplateMiniPreview
                            id={t.id}
                            colors={colors}
                            isDark={isDark}
                          />
                          <View
                            style={[
                              styles.proBadgeMini,
                              {
                                backgroundColor: t.color,
                                position: "absolute",
                                top: 8,
                                right: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 8, fontWeight: "900", color: "#fff" }}>
                              {t.badge}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.miniInfo, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : '#FAFAFA' }]}>
                        <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={1}>{t.name}</Text>
                        <Text style={[styles.miniDate, { color: colors.textMuted }]} numberOfLines={1}>{t.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* My Resumes - Portfolio Horizontal Carousel */}
        {resumes.length > 0 && (
          <View style={{ paddingHorizontal: 0, marginTop: 35, marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: 18 },
                ]}
              >
                My Resumes
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                {resumes.length}/{resumeLimit >= 1000 ? "∞" : resumeLimit} Saved
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            >
              {resumes.map((resume, idx) => (
                <Animated.View
                  key={resume.id}
                  entering={FadeInDown.delay(100 * idx)}
                  style={[
                    styles.resumeCarouselCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.glassBorder,
                      width: SCREEN_WIDTH * 0.58,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/builder/manual",
                        params: { resumeId: resume.id },
                      } as any)
                    }
                    style={{ flex: 1 }}
                  >
                    <View style={styles.carouselMockupContainer}>
                      <TemplateMiniPreview
                        id={resume.template || "modern"}
                        colors={colors}
                        isDark={isDark}
                        data={resume.data}
                      />
                      <TouchableOpacity
                        onPress={() => handleDelete(resume.id)}
                        style={styles.carouselDeleteBtn}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.carouselInfoContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : '#FAFAFA' }]}>
                      <Text style={[styles.carouselResumeName, { color: colors.text }]} numberOfLines={1}>
                        {resume.data.name || "Untitled Resume"}
                      </Text>
                      <Text style={[styles.carouselResumeMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {resume.template ? `${resume.template.split('-')[0]} Layout` : "Modern Layout"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  newButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  heroBannerInner: {
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroBannerSub: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  seriesCardGradient: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  seriesCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  seriesIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesName: {
    fontSize: 15,
    fontWeight: '900',
  },
  seriesBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seriesBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  seriesDesc: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  statsCapsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statsCapsuleText: {
    fontSize: 9,
    fontWeight: '700',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  miniBox: {
    width: (SCREEN_WIDTH - 56) / 2,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  miniHeader: {
    aspectRatio: 1 / 1.414,
    width: "100%",
    backgroundColor: "#fff",
  },
  miniMockup: {
    flex: 1,
    position: "relative",
  },
  proBadgeMini: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniInfo: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  miniName: {
    fontSize: 12,
    fontWeight: "800",
  },
  miniDate: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  resumeCarouselCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  carouselMockupContainer: {
    aspectRatio: 1 / 1.35,
    width: '100%',
    position: 'relative',
    backgroundColor: '#fff',
  },
  carouselDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  carouselInfoContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  carouselResumeName: {
    fontSize: 12,
    fontWeight: '800',
  },
  carouselResumeMeta: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  // Legacy styles to guarantee backward compatibility
  elderCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  elderPreviewContainer: {
    width: '100%',
    aspectRatio: 1 / 1.414,
    backgroundColor: '#fff',
  },
  elderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  elderFooter: {
    padding: 20,
  },
  elderName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  elderDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
  },
  startBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 15,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.8,
  },
});
