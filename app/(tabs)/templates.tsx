import { generateResumeHtml } from "@/components/resume-html-generator";
import {
    CreativeTemplate,
    ExecutiveTemplate,
    ModernTemplate,
    ProfessionalTemplate,
} from "@/components/resume-templates";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
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
    emoji: "🛡️",
    color: "#0077b5",
    badge: "POPULAR",
    templates: [
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
    ],
  },
  {
    id: "titan",
    name: "Titan Series",
    desc: "Modern Grids & Bold Accents",
    emoji: "⚡",
    color: "#ea580c",
    badge: "MODERN",
    templates: [
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
    ],
  },
  {
    id: "blackwolf",
    name: "Black Wolf Series",
    desc: "Elite Minimalist Designs",
    emoji: "🐺",
    color: "#000000",
    badge: "PREMIUM",
    templates: [
      {
        id: "BlackWolf-1",
        name: "Black Wolf 1",
        desc: "Elite Minimalist",
        badge: "PREMIUM",
        color: "#000000",
      },
      {
        id: "BlackWolf-2",
        name: "Black Wolf 2",
        desc: "Structured Timeline",
        badge: "NEW",
        color: "#1a1a1a",
      },
      {
        id: "BlackWolf-3",
        name: "Black Wolf 3",
        desc: "Modern Split",
        badge: "NEW",
        color: "#333333",
      },
      {
        id: "BlackWolf-4",
        name: "Black Wolf 4",
        desc: "Minimalist Two-Column",
        badge: "NEW",
        color: "#1a202c",
      },
    ],
  },
  {
    id: "jocker",
    name: "Jocker Series",
    desc: "Bold ATS-Friendly Layouts",
    emoji: "🃏",
    color: "#ec4899",
    badge: "NEW",
    templates: [
      {
        id: "Jocker-1",
        name: "Jocker 1: Pun",
        desc: "Bold Accent Top",
        badge: "ATS Safe",
        color: "#ec4899",
      },
      {
        id: "Jocker-2",
        name: "Jocker 2: Card",
        desc: "Clean Card Sections",
        badge: "ATS Safe",
        color: "#ec4899",
      },
      {
        id: "Jocker-3",
        name: "Jocker 3: Bold",
        desc: "High Contrast Headers",
        badge: "ATS Safe",
        color: "#ec4899",
      },
      {
        id: "Jocker-4",
        name: "Jocker 4: Trick",
        desc: "Typographic Focus",
        badge: "ATS Safe",
        color: "#ec4899",
      },
      {
        id: "Jocker-5",
        name: "Jocker 5: Royal",
        desc: "Structured Timeline",
        badge: "ATS Safe",
        color: "#ec4899",
      },
    ],
  },
  {
    id: "fresher",
    name: "Fresher Series",
    desc: "Built for Fresh Graduates",
    emoji: "🎓",
    color: "#059669",
    badge: "NEW",
    templates: [
      {
        id: "Fresher-1",
        name: "Fresher 1: Smart",
        desc: "Clean Academic Focus",
        badge: "FRESHER",
        color: "#059669",
      },
      {
        id: "Fresher-2",
        name: "Fresher 2: Spark",
        desc: "Internship Showcase",
        badge: "FRESHER",
        color: "#0284c7",
      },
      {
        id: "Fresher-3",
        name: "Fresher 3: Rise",
        desc: "Project & Skills First",
        badge: "FRESHER",
        color: "#7c3aed",
      },
      {
        id: "Fresher-4",
        name: "Fresher 4: Pro",
        desc: "Professional Fresher",
        badge: "FRESHER",
        color: "#dc2626",
      },
      {
        id: "Fresher-5",
        name: "Fresher 5: Build",
        desc: "Achievement Focused",
        badge: "FRESHER",
        color: "#d97706",
      },
    ],
  },
  {
    id: "rich",
    name: "Rich Series",
    desc: "Black & White ATS-Friendly Designs",
    emoji: "⚫",
    color: "#000000",
    badge: "ATS SAFE",
    templates: [
      {
        id: "Rich-1",
        name: "Rich 1: Classic",
        desc: "Traditional Executive",
        badge: "ATS SAFE",
        color: "#000000",
      },
      {
        id: "Rich-2",
        name: "Rich 2: Compact",
        desc: "Dense Two-Column",
        badge: "ATS SAFE",
        color: "#000000",
      },
      {
        id: "Rich-3",
        name: "Rich 3: Modern",
        desc: "Clean Minimal",
        badge: "ATS SAFE",
        color: "#000000",
      },
      {
        id: "Rich-4",
        name: "Rich 4: Grid",
        desc: "Structured Grid Layout",
        badge: "ATS SAFE",
        color: "#000000",
      },
    ],
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
  { key: "t11", id: "Rich-1", name: "Rich 1: Classic", isPro: false },
  { key: "t12", id: "Rich-2", name: "Rich 2: Compact", isPro: false },
  { key: "t13", id: "Rich-3", name: "Rich 3: Modern", isPro: false },
  { key: "t14", id: "Rich-4", name: "Rich 4: Grid", isPro: false },
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
    const targetWidth = (SCREEN_WIDTH - 36) / 2;
    const scale = targetWidth / A4_WIDTH;

    const defaultData = {
      name: "Jane Doe",
      title: "Senior Full-Stack Developer",
      email: "jane.doe@example.com",
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
        },
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
          link: "https://github.com/janedoe/resume-builder",
          description:
            "A state-of-the-art resume platform featuring real-time AI optimization.",
        },
        {
          id: "2",
          name: "CryptoPulse Tracker",
          link: "https://github.com/janedoe/cryptopulse",
          description:
            "A comprehensive real-time cryptocurrency monitoring dashboard.",
        },
      ],
      skills: "React Native, React, Node.js, TypeScript, AWS, Docker",
      tools: "VS Code, Git, Figma, Postman",
      languages: "English, Tamil",
      links: [
        { label: "GitHub", url: "github.com/janedoe" },
        { label: "Portfolio", url: "janedoe.dev" },
      ],
      certifications: [
        { title: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
        { title: "Meta Front-End Developer", issuer: "Coursera", year: "2022" },
      ],
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&q=80",
    };

    const resumeData = data || defaultData;

    const isHtmlTemplate =
      id.startsWith("Elder") ||
      id.startsWith("Titan") ||
      id.startsWith("BlackWolf") ||
      id.startsWith("Jocker") ||
      id.startsWith("Fresher") ||
      id.startsWith("Rich");

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

  const [selectedSeries, setSelectedSeries] = useState<string>(
    TEMPLATE_SERIES[0].id,
  );

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  // Grid card — FlatList mounts only visible cells, so the heavy
  // WebView previews don't all render at once.
  const renderTemplateCard = ({ item: t }: any) => (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[
        styles.miniBox,
        {
          backgroundColor: colors.surface,
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

            {/* Floating Name and Description Overlay */}
            <LinearGradient
              colors={["transparent", Theme.colors.primary + "f2"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 10,
                paddingTop: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "900",
                  color: "#fff",
                }}
                numberOfLines={1}
              >
                {t.name}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "600",
                  color: "rgba(255, 255, 255, 0.75)",
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {t.desc}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const seriesTabs = (
    <View style={{ marginBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 10,
          paddingVertical: 4,
        }}
      >
        {TEMPLATE_SERIES.map((series) => {
          const isActive = selectedSeries === series.id;
          return (
            <TouchableOpacity
              key={series.id}
              activeOpacity={0.8}
              onPress={() => setSelectedSeries(series.id)}
              style={[
                styles.seriesTab,
                {
                  backgroundColor: isActive
                    ? Theme.colors.primary
                    : colors.surface,
                  borderColor: Theme.border.color,
                  borderWidth: Theme.border.width,
                  ...Theme.shadow,
                },
              ]}
            >
              <Text style={{ fontSize: 15 }}>{series.emoji}</Text>
              <Text
                style={[
                  styles.seriesTabText,
                  { color: isActive ? "#fff" : colors.text },
                ]}
              >
                {series.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sleek solid matching header layout */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.profilePicContainer,
                {
                  borderColor: Theme.border.color,
                  backgroundColor: Theme.colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <ExpoImage
                source={require("@/assets/resume (1).webp")}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>
                Explore
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                Templates
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/builder/manual")}
              style={[
                styles.notificationBtn,
                {
                  backgroundColor: "#fff",
                  borderColor: Theme.border.color,
                  ...Theme.shadow,
                },
              ]}
            >
              <Animated.View style={animatedButtonStyle}>
                <Plus size={24} color={"#000"} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        key={selectedSeries}
        data={TEMPLATE_SERIES.find((s) => s.id === selectedSeries)?.templates || []}
        keyExtractor={(t) => t.id}
        numColumns={2}
        renderItem={renderTemplateCard}
        ListHeaderComponent={seriesTabs}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={{ paddingHorizontal: 6 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
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
  scrollContent: {
    paddingBottom: 120,
  },
  heroBanner: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  heroBannerInner: {
    borderRadius: 24,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  heroBannerTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroBannerSub: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  seriesCardGradient: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  seriesCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    position: "relative",
    overflow: "hidden",
  },
  seriesIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  seriesName: {
    fontSize: 15,
    fontWeight: "900",
  },
  seriesBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seriesBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },
  seriesDesc: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  statsCapsuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statsCapsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statsCapsuleText: {
    fontSize: 9,
    fontWeight: "700",
  },
  glowRing: {
    position: "absolute",
    borderWidth: 1.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadow,
  },
  seriesTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  seriesTabText: {
    fontSize: 14,
    fontWeight: "800",
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  miniBox: {
    width: (SCREEN_WIDTH - 36) / 2,
    margin: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
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
    overflow: "hidden",
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  carouselMockupContainer: {
    aspectRatio: 1 / 1.35,
    width: "100%",
    position: "relative",
    backgroundColor: "#fff",
  },
  carouselDeleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  carouselInfoContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  carouselResumeName: {
    fontSize: 12,
    fontWeight: "800",
  },
  carouselResumeMeta: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  // Legacy styles to guarantee backward compatibility
  elderCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  elderPreviewContainer: {
    width: "100%",
    aspectRatio: 1 / 1.414,
    backgroundColor: "#fff",
  },
  elderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elderBadgeText: {
    fontSize: 10,
    fontWeight: "900",
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
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
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
