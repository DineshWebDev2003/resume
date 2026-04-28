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
import {
    Briefcase,
    Code,
    GraduationCap,
    Heart,
    Plus,
    ShieldCheck,
    Trash2,
    Zap
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

const CATEGORIES = [
  {
    id: "it",
    name: "IT & Software",
    icon: Code,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "accounts",
    name: "Accounts",
    icon: Briefcase,
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: Zap,
    image:
      "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "healthcare",
    name: "Medical",
    icon: Heart,
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80",
  },
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

function CategoryCard({
  item,
  index,
  scrollX,
  selectedCategory,
  setSelectedCategory,
  colors,
  router,
}: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, { width: CARD_WIDTH, marginRight: SPACING }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setSelectedCategory(item.id);
          router.push({
            pathname: "/category-templates",
            params: { categoryId: item.id, categoryName: item.name },
          } as any);
        }}
        style={[
          styles.bigCatCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <View style={styles.bigCatImageContainer}>
          <Image source={{ uri: item.image }} style={styles.bigCatImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
            style={styles.bigCatOverlay}
          />
          <View style={styles.bigCatInfo}>
            <View
              style={[
                styles.catIconCircleBig,
                { backgroundColor: "rgba(255, 255, 255, 0.25)" },
              ]}
            >
              <item.icon size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.bigCatName}>{item.name}</Text>
              <Text style={styles.bigCatSub}>Professional Templates</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("it");

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Create looped data for infinite carousel
  const [loopedData] = useState([...CATEGORIES, ...CATEGORIES, ...CATEGORIES]);
  const totalItems = CATEGORIES.length;
  const loopIndexOffset = totalItems; // Middle set start

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  useEffect(() => {
    // Initial scroll to middle set
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: loopIndexOffset,
        animated: false,
      });
    }, 100);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // Auto-slide logic for looped data
      const nextIndex = Math.round(scrollX.value / (CARD_WIDTH + SPACING)) + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      // Handle loop reset silently in onMomentumScrollEnd
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const loadData = async () => {
    InteractionManager.runAfterInteractions(async () => {
      setLoading(true);
      const data = await getResumes();
      setResumes(data);
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Templates
        </Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: Theme.colors.primary }]}
          onPress={() => router.push("/builder/manual")}
        >
          <Plus size={18} color="#000" />
          <Text style={styles.newButtonText}>Quick Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: 5 },
            ]}
          >
            Premium Elder Series
          </Text>
          <Text
            style={{ color: colors.textMuted, marginBottom: 25, fontSize: 13 }}
          >
            High-performance templates engineered for ATS and LinkedIn success.
          </Text>

          <View style={styles.miniGrid}>
            {[
              {
                id: "Elder-1",
                name: "Elder 1: Elite",
                desc: "Sleek Sidebar",
                badge: "POPULAR",
                color: Theme.colors.secondary,
              },
              {
                id: "Elder-2",
                name: "Elder 2: ATS",
                desc: "ATS Master",
                badge: "ATS SAFE",
                color: "#10b981",
              },
              {
                id: "Elder-3",
                name: "Elder 3: LI",
                desc: "LinkedIn Style",
                badge: "EXECUTIVE",
                color: "#0077b5",
              },
              {
                id: "Elder-4",
                name: "Elder 4: Timeline",
                desc: "Timeline & Sidebar",
                badge: "CREATIVE",
                color: "#22a3d6",
              },
              {
                id: "Elder-5",
                name: "Elder 5: Right",
                desc: "Right Sidebar",
                badge: "PORTFOLIO",
                color: "#d946ef",
              },
              {
                id: "Elder-6",
                name: "Elder 6: Ribbon",
                desc: "Ribbon Dark Sidebar",
                badge: "MODERN",
                color: "#0ea5e9",
              },
              {
                id: "Elder-7",
                name: "Elder 7: Gold",
                desc: "Two-Tone Sidebar",
                badge: "PREMIUM",
                color: "#facc15",
              },
              {
                id: "Elder-8",
                name: "Elder 8: Skyline",
                desc: "Blue Timelines",
                badge: "PREMIUM",
                color: "#0ea5e9",
              },
              {
                id: "Titan-1",
                name: "Titan 1: PRO",
                desc: "Curved Dark Sidebar",
                badge: "NEW",
                color: "#1e293b",
              },
              {
                id: "Titan-2",
                name: "Titan 2: Dome",
                desc: "Purple Pill Theme",
                badge: "NEW",
                color: "#9b7eb5",
              },
              {
                id: "Titan-3",
                name: "Titan 3: Split",
                desc: "Orange Accent",
                badge: "NEW",
                color: "#ea580c",
              },
              {
                id: "Titan-4",
                name: "Titan 4: Ruby",
                desc: "Dark Red Theme",
                badge: "NEW",
                color: "#dc2626",
              },
              {
                id: "BlackWolf-1",
                name: "Black Wolf 1",
                desc: "Minimal & Clean",
                badge: "MINIMAL",
                color: "#000000",
              },
            ].map((t, idx) => (
              <Animated.View
                key={t.id}
                entering={FadeInDown.delay(100 * idx)}
                style={[
                  styles.miniBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                    height: "auto",
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
                            width: "auto",
                            paddingHorizontal: 6,
                            height: 16,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: "900",
                            color: "#fff",
                          }}
                        >
                          {t.badge}
                        </Text>
                      </View>
                    </View>
                  </View>

                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>


        {/* My Resumes - Mini Boxes */}
        {resumes.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
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
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {resumes.length}/3 Versions
              </Text>
            </View>
            <View style={styles.miniGrid}>
              {resumes.map((resume, idx) => (
                <Animated.View
                  key={resume.id}
                  entering={FadeInDown.delay(100 * idx)}
                  style={[
                    styles.miniBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() =>
                      router.push({
                        pathname: "/builder/manual",
                        params: { resumeId: resume.id },
                      } as any)
                    }
                  >
                    <View style={styles.miniHeader}>
                      <View style={styles.miniMockup}>
                        <TemplateMiniPreview
                          id={resume.template || "modern"}
                          colors={colors}
                          isDark={isDark}
                          data={resume.data}
                        />
                        <View style={styles.miniOverlay}>
                          <TouchableOpacity
                            onPress={() => handleDelete(resume.id)}
                            style={styles.miniDelete}
                          >
                            <Trash2 size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  newButtonText: {
    fontWeight: "800",
    color: "#fff",
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },

  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
  },
  recentCardWrapper: {
    width: "50%",
    padding: 6,
  },
  recentCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recentImageContainer: {
    aspectRatio: 1 / 1.4142,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  recentSnapshot: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recentPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  recentTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "700",
  },
  recentTime: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    opacity: 0.7,
  },
  recentMenu: {
    padding: 4,
  },
  addCardGrid: {
    aspectRatio: 1 / 1.35,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addCardText: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyPrompt: {
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.1)",
  },
  emptyPromptText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "600",
  },
  proBadgeMini: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Theme.colors.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  templateRawCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  templateLabelOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  templateLabelText: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
  },
  elderCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  elderPreviewContainer: {
    aspectRatio: 1 / 1.3,
    width: "100%",
    position: "relative",
    backgroundColor: "#fff",
  },
  elderBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  elderBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  elderFooter: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    zIndex: 10,
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
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  startBtnText: {
    color: "#000",
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
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  miniBox: {
    width: (SCREEN_WIDTH - 56) / 2,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
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
  miniOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,0,0,0.8)",
    borderRadius: 8,
    padding: 4,
  },
  miniDelete: {
    padding: 2,
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
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
});
