import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { generateResumeHtml } from "@/components/resume-html-generator";
import {
  CreativeTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  ProfessionalTemplate,
} from "@/components/resume-templates";
import { C, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

export interface TemplateItem {
  id: string;
  name: string;
  desc: string;
  badge: string;
  seriesId: string;
  seriesName: string;
  color: string;
  atsScore: number;
}

export const TEMPLATE_SERIES_CATALOG = [
  {
    id: "elder",
    name: "Elder Series",
    shortName: "Elder",
    desc: "ATS-Optimized & Professional",
    icon: "🛡️",
    badge: "ATS ELITE",
    templates: [
      { id: "Elder-1", name: "Elder 1: Elite", desc: "Sleek Sidebar", badge: "POPULAR", color: "#573353", atsScore: 98 },
      { id: "Elder-2", name: "Elder 2: ATS", desc: "ATS Master Format", badge: "TOP PICK", color: "#10b981", atsScore: 99 },
      { id: "Elder-3", name: "Elder 3: LI", desc: "LinkedIn Executive", badge: "EXECUTIVE", color: "#0077b5", atsScore: 97 },
      { id: "Elder-4", name: "Elder 4: Timeline", desc: "Timeline & Career", badge: "CREATIVE", color: "#22a3d6", atsScore: 96 },
      { id: "Elder-5", name: "Elder 5: Right", desc: "Right Column Grid", badge: "PORTFOLIO", color: "#d946ef", atsScore: 95 },
      { id: "Elder-6", name: "Elder 6: Ribbon", desc: "Dark Ribbon Header", badge: "MODERN", color: "#0ea5e9", atsScore: 96 },
      { id: "Elder-7", name: "Elder 7: Gold", desc: "Two-Tone Classic", badge: "PREMIUM", color: "#facc15", atsScore: 97 },
      { id: "Elder-8", name: "Elder 8: Skyline", desc: "Blue Timeline Bar", badge: "PREMIUM", color: "#0ea5e9", atsScore: 96 },
      { id: "Elder-9", name: "Elder 9: Classic", desc: "Traditional Executive ATS", badge: "ATS SAFE", color: "#1F1625", atsScore: 99 },
      { id: "Elder-10", name: "Elder 10: Compact", desc: "Dense Dual Column", badge: "ATS SAFE", color: "#1F1625", atsScore: 98 },
      { id: "Elder-11", name: "Elder 11: Minimal", desc: "Clean Minimalist Lines", badge: "ATS SAFE", color: "#1F1625", atsScore: 98 },
      { id: "Elder-12", name: "Elder 12: Grid", desc: "Structured Executive Grid", badge: "ATS SAFE", color: "#1F1625", atsScore: 99 },
      { id: "Elder-13", name: "Elder 13: Corporate", desc: "Corporate Navy Header", badge: "EXECUTIVE", color: "#1e3a8a", atsScore: 98 },
      { id: "Elder-14", name: "Elder 14: Monolith", desc: "High-Impact Modern Split", badge: "TOP PICK", color: "#0f766e", atsScore: 97 },
    ],
  },
  {
    id: "titan",
    name: "Titan Series",
    shortName: "Titan",
    desc: "Modern Grids & Bold Accents",
    icon: "⚡",
    badge: "MODERN",
    templates: [
      { id: "Titan-1", name: "Titan 1: PRO", desc: "Curved Slate Sidebar", badge: "POPULAR", color: "#573353", atsScore: 97 },
      { id: "Titan-2", name: "Titan 2: Dome", desc: "Pill Header Structure", badge: "NEW", color: "#9b7eb5", atsScore: 95 },
      { id: "Titan-3", name: "Titan 3: Split", desc: "Warm Orange Split", badge: "FEATURED", color: "#ea580c", atsScore: 96 },
      { id: "Titan-4", name: "Titan 4: Ruby", desc: "High-Impact Accent", badge: "NEW", color: "#dc2626", atsScore: 95 },
    ],
  },
  {
    id: "blackwolf",
    name: "Black Wolf Series",
    shortName: "Black Wolf",
    desc: "Elite Minimalist & Monolith",
    icon: "🐺",
    badge: "EXECUTIVE",
    templates: [
      { id: "BlackWolf-1", name: "Black Wolf 1", desc: "Monolith Minimalist", badge: "PREMIUM", color: "#111827", atsScore: 98 },
      { id: "BlackWolf-2", name: "Black Wolf 2", desc: "Structured Timeline", badge: "NEW", color: "#1f2937", atsScore: 97 },
      { id: "BlackWolf-3", name: "Black Wolf 3", desc: "Modern Split Axis", badge: "NEW", color: "#374151", atsScore: 96 },
      { id: "BlackWolf-4", name: "Black Wolf 4", desc: "Two-Column Minimal", badge: "NEW", color: "#111827", atsScore: 97 },
    ],
  },
  {
    id: "fresher",
    name: "Fresher Series",
    shortName: "Fresher",
    desc: "Built for Entry-Level & Graduates",
    icon: "🎓",
    badge: "ENTRY-LEVEL",
    templates: [
      { id: "Fresher-1", name: "Fresher 1: Smart", desc: "Academic & Project First", badge: "FRESHER", color: "#059669", atsScore: 98 },
      { id: "Fresher-2", name: "Fresher 2: Spark", desc: "Internship Showcase", badge: "FRESHER", color: "#0284c7", atsScore: 97 },
      { id: "Fresher-3", name: "Fresher 3: Rise", desc: "Skills & Certifications", badge: "FRESHER", color: "#FDA758", atsScore: 96 },
      { id: "Fresher-4", name: "Fresher 4: Pro", desc: "Junior Professional", badge: "FRESHER", color: "#dc2626", atsScore: 97 },
      { id: "Fresher-5", name: "Fresher 5: Build", desc: "Portfolio & Hackathons", badge: "FRESHER", color: "#d97706", atsScore: 96 },
      { id: "Fresher-6", name: "Fresher 6: Tech", desc: "Coding & STEM Projects", badge: "STEM", color: "#6366F1", atsScore: 98 },
      { id: "Fresher-7", name: "Fresher 7: Scholar", desc: "Academic Honors & Research", badge: "ACADEMIC", color: "#0284c7", atsScore: 97 },
      { id: "Fresher-8", name: "Fresher 8: Vanguard", desc: "High-Density Junior ATS", badge: "ATS SAFE", color: "#10b981", atsScore: 99 },
      { id: "Fresher-9", name: "Fresher 9: Apex", desc: "Creative Hackathon Grid", badge: "PORTFOLIO", color: "#ea580c", atsScore: 96 },
      { id: "Fresher-10", name: "Fresher 10: Launch", desc: "Dual-Tone Corporate Entry", badge: "ENTRY-LEVEL", color: "#0d9488", atsScore: 97 },
    ],
  },
  {
    id: "jocker",
    name: "Jocker Series",
    shortName: "Jocker",
    desc: "Bold Headers & Distinctive Typography",
    icon: "🃏",
    badge: "CREATIVE",
    templates: [
      { id: "Jocker-1", name: "Jocker 1: Pun", desc: "Bold Accent Top", badge: "ATS SAFE", color: "#ec4899", atsScore: 96 },
      { id: "Jocker-2", name: "Jocker 2: Card", desc: "Clean Card Sections", badge: "ATS SAFE", color: "#ec4899", atsScore: 95 },
      { id: "Jocker-3", name: "Jocker 3: Bold", desc: "High Contrast Headers", badge: "ATS SAFE", color: "#ec4899", atsScore: 96 },
      { id: "Jocker-4", name: "Jocker 4: Trick", desc: "Typographic Focus", badge: "ATS SAFE", color: "#ec4899", atsScore: 95 },
      { id: "Jocker-5", name: "Jocker 5: Royal", desc: "Structured Timeline", badge: "ATS SAFE", color: "#ec4899", atsScore: 95 },
    ],
  },
];

const ALL_TEMPLATES_FLAT: TemplateItem[] = TEMPLATE_SERIES_CATALOG.flatMap((series) =>
  series.templates.map((t) => ({
    ...t,
    seriesId: series.id,
    seriesName: series.name,
  }))
);

const MOCK_RESUME_DATA = {
  name: "Jane Doe",
  title: "Senior Full-Stack Developer",
  email: "jane.doe@example.com",
  phone: "+91 9876543210",
  location: "Tamil Nadu, India",
  summary:
    "Dynamic and results-driven Senior Full-Stack Developer with over 5 years of experience in architecting high-performance mobile and web apps. Expert in React Native, Node.js, and Cloud Infrastructure.",
  experience: [
    {
      id: "1",
      company: "Innovate Tech Hub",
      role: "Lead Full-Stack Developer",
      period: "2022 – Present",
      description:
        "Architected flagship fintech application using React Native, serving 100k+ active users. Improved API response times by 60%.",
    },
    {
      id: "2",
      company: "Digital Stream Systems",
      role: "Software Engineer",
      period: "2019 – 2022",
      description:
        "Engineered scalable web interfaces for high-traffic e-commerce systems.",
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
      name: "AI Resume Architect",
      link: "github.com/janedoe/resume-builder",
      description: "State-of-the-art resume platform featuring real-time AI ATS parsing.",
    },
  ],
  skills: "React Native, React, Node.js, TypeScript, AWS, Docker, PostgreSQL",
  tools: "VS Code, Git, Figma, Postman",
  languages: "English, Tamil",
  links: [
    { label: "GitHub", url: "github.com/janedoe" },
    { label: "Portfolio", url: "janedoe.dev" },
  ],
  certifications: [
    { title: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
  ],
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&q=80",
};

// Mini preview component with scaled WebView
const TemplateMiniPreview = React.memo(({ id, colors }: { id: string; colors: any }) => {
  const isHtmlTemplate =
    id.startsWith("Elder") ||
    id.startsWith("Titan") ||
    id.startsWith("BlackWolf") ||
    id.startsWith("Jocker") ||
    id.startsWith("Fresher") ||
    id.startsWith("Rich");

  if (isHtmlTemplate) {
    const htmlString = generateResumeHtml(
      MOCK_RESUME_DATA,
      id,
      colors.primary || C.text,
      "Inter",
      false,
      true
    );

    return (
      <View style={styles.previewCanvas}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: htmlString }}
          style={styles.webView}
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

  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const scale = CARD_WIDTH / A4_WIDTH;

  return (
    <View style={styles.nativePreviewWrap}>
      <View style={{ width: A4_WIDTH, height: A4_HEIGHT, transform: [{ scale }] }}>
        {id === "executive" && <ExecutiveTemplate resumeData={MOCK_RESUME_DATA} selectedFont="Roboto" />}
        {id === "modern" && <ModernTemplate resumeData={MOCK_RESUME_DATA} selectedFont="Roboto" />}
        {id === "creative" && <CreativeTemplate resumeData={MOCK_RESUME_DATA} selectedFont="Roboto" />}
        {id === "professional" && <ProfessionalTemplate resumeData={MOCK_RESUME_DATA} selectedFont="Roboto" />}
      </View>
    </View>
  );
});

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

  // Filter templates based on series
  const filteredTemplates = useMemo(() => {
    if (selectedSeries === "all") return ALL_TEMPLATES_FLAT;
    return ALL_TEMPLATES_FLAT.filter((t) => t.seriesId === selectedSeries);
  }, [selectedSeries]);

  // Navigate to manual builder with selected template
  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      setPreviewTemplate(null);
      router.push({
        pathname: "/builder/manual",
        params: { templateId },
      } as any);
    },
    [router]
  );

  // Render individual template card in the 2-column grid
  const renderTemplateCard = useCallback(
    ({ item, index }: { item: TemplateItem; index: number }) => {
      return (
        <Animated.View
          entering={FadeInDown.delay(Math.min(index * 30, 240)).duration(260)}
          style={styles.cardContainer}
        >
          {/* Card Top: A4 Document Preview */}
          <View style={styles.previewArea}>
            <TemplateMiniPreview id={item.id} colors={colors} />

            {/* Floating Top Pill: ATS Score */}
            <View style={styles.atsPill}>
              <CheckCircle2 size={10} color="#10B981" />
              <Text style={styles.atsPillText}>{item.atsScore}% ATS</Text>
            </View>

            {/* Floating Top-Right: Quick Preview Eye Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPreviewTemplate(item)}
              style={styles.quickEyeBtn}
              accessibilityLabel={`Preview ${item.name}`}
              hitSlop={8}
            >
              <Eye size={13} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Category Tag on Bottom-Left of Preview */}
            <View style={[styles.badgeTag, { backgroundColor: item.color }]}>
              <Text style={styles.badgeTagText}>{item.badge}</Text>
            </View>
          </View>

          {/* Card Bottom: Clean Professional Metadata & Action */}
          <View style={styles.cardInfo}>
            <Text style={styles.templateTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.templateSubtitle} numberOfLines={1}>
              {item.desc}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectTemplate(item.id)}
              style={styles.useTemplateBtn}
            >
              <Text style={styles.useTemplateText}>Use Template</Text>
              <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [colors, handleSelectTemplate]
  );

  // Series selection pills
  const seriesTabs = useMemo(() => {
    return (
      <View style={styles.seriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seriesScrollContent}
        >
          {/* All Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedSeries("all")}
            style={[
              styles.seriesChip,
              selectedSeries === "all" ? styles.seriesChipActive : styles.seriesChipInactive,
            ]}
          >
            <Sparkles
              size={13}
              color={selectedSeries === "all" ? "#FFFFFF" : C.text}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.seriesChipText,
                selectedSeries === "all" ? styles.seriesTextActive : styles.seriesTextInactive,
              ]}
            >
              All
            </Text>
            <View
              style={[
                styles.seriesCountBadge,
                selectedSeries === "all" ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  selectedSeries === "all" ? styles.countTextActive : styles.countTextInactive,
                ]}
              >
                {ALL_TEMPLATES_FLAT.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Catalog Series */}
          {TEMPLATE_SERIES_CATALOG.map((series) => {
            const isActive = selectedSeries === series.id;
            return (
              <TouchableOpacity
                key={series.id}
                activeOpacity={0.8}
                onPress={() => setSelectedSeries(series.id)}
                style={[
                  styles.seriesChip,
                  isActive ? styles.seriesChipActive : styles.seriesChipInactive,
                ]}
              >
                <Text style={{ fontSize: 13 }}>{series.icon}</Text>
                <Text
                  style={[
                    styles.seriesChipText,
                    isActive ? styles.seriesTextActive : styles.seriesTextInactive,
                  ]}
                >
                  {series.shortName}
                </Text>
                <View
                  style={[
                    styles.seriesCountBadge,
                    isActive ? styles.countBadgeActive : styles.countBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      isActive ? styles.countTextActive : styles.countTextInactive,
                    ]}
                  >
                    {series.templates.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [selectedSeries]);

  // Featured Spotlight Hero Banner (Recruiter's #1 Choice with interactive thumbnail)
  const spotlightBanner = useMemo(() => {
    if (selectedSeries !== "all" && selectedSeries !== "elder") {
      return null;
    }

    const featured = ALL_TEMPLATES_FLAT.find((t) => t.id === "Elder-2") || ALL_TEMPLATES_FLAT[0];

    return (
      <View style={styles.spotlightCard}>
        {/* Top Badges */}
        <View style={styles.spotlightHeader}>
          <View style={styles.spotlightBadge}>
            <ShieldCheck size={13} color="#059669" strokeWidth={2.4} />
            <Text style={styles.spotlightBadgeText}>RECRUITER'S #1 CHOICE</Text>
          </View>
          <View style={styles.atsScoreHighlight}>
            <Text style={styles.atsScoreText}>99% ATS Pass Rate</Text>
          </View>
        </View>

        {/* Dual Column Layout: Info on Left, Interactive A4 Thumbnail on Right */}
        <View style={styles.spotlightBodyRow}>
          <View style={styles.spotlightLeftCol}>
            <Text style={styles.spotlightTitle}>{featured.name}</Text>
            <Text style={styles.spotlightDesc} numberOfLines={3}>
              Engineered specifically to score 99%+ on Workday, Greenhouse & Taleo ATS screeners with zero parsing errors.
            </Text>

            <View style={styles.spotlightPillsRow}>
              <View style={styles.spotlightMiniPill}>
                <Text style={styles.spotlightMiniPillText}>✓ Single-Column</Text>
              </View>
              <View style={styles.spotlightMiniPill}>
                <Text style={styles.spotlightMiniPillText}>✓ 1-Page A4</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelectTemplate(featured.id)}
              style={styles.spotlightCta}
            >
              <Text style={styles.spotlightCtaText}>Use Template</Text>
              <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Right Column: Visual Interactive Document Preview */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPreviewTemplate(featured)}
            style={styles.spotlightDocThumbWrap}
            accessibilityLabel={`Preview ${featured.name}`}
          >
            <View style={styles.spotlightDocCanvas}>
              <TemplateMiniPreview id={featured.id} colors={colors} />
            </View>

            {/* Floating Quick Preview Pill on Thumbnail */}
            <View style={styles.spotlightDocOverlay}>
              <Eye size={11} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.spotlightDocOverlayText}>Preview</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [selectedSeries, colors, handleSelectTemplate]);

  // Catalog Section Header
  const catalogHeader = useMemo(() => {
    return (
      <View style={styles.catalogHeaderWrap}>
        {spotlightBanner}
        {seriesTabs}
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: "800", color: C.text }}>{filteredTemplates.length}</Text> templates
          </Text>
          {selectedSeries !== "all" && (
            <TouchableOpacity onPress={() => setSelectedSeries("all")}>
              <Text style={styles.resetFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [spotlightBanner, seriesTabs, filteredTemplates.length, selectedSeries]);

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Executive Clean Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.brandTag}>
              <Sparkles size={11} color={C.primaryDeep} />
              <Text style={styles.brandTagText}>ATS OPTIMIZED CATALOG</Text>
            </View>
            <Text style={styles.headerTitle}>Resume Templates</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/builder/manual")}
            style={styles.createBtn}
            accessibilityLabel="Create Custom Resume"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.createBtnText}>Blank</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Template Grid */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderTemplateCard}
        ListHeaderComponent={catalogHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Sparkles size={36} color={C.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No templates found</Text>
            <Text style={styles.emptySub}>
              No templates are currently available in this category.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => setSelectedSeries("all")}
            >
              <Text style={styles.emptyResetText}>View All Templates</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
      />

      {/* Interactive Full Preview Modal (Slide-up Sheet with Backdrop) */}
      <Modal
        visible={previewTemplate !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={styles.modalBadgeRow}>
                    <View style={[styles.badgeTag, { backgroundColor: previewTemplate.color }]}>
                      <Text style={styles.badgeTagText}>{previewTemplate.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={1}>{previewTemplate.name}</Text>
                  <Text style={styles.modalDesc}>{previewTemplate.desc} • {previewTemplate.seriesName}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setPreviewTemplate(null)}
                  style={styles.modalCloseBtn}
                  accessibilityLabel="Close Preview"
                  hitSlop={12}
                >
                  <X size={18} color={C.text} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {/* High-Resolution Full-Page Document Canvas */}
              <View style={styles.modalPreviewFrame}>
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: generateResumeHtml(
                      MOCK_RESUME_DATA,
                      previewTemplate.id,
                      C.text,
                      "Inter",
                      false,
                      false // Full-fidelity document with proper margins and authentic shadow
                    ),
                  }}
                  style={styles.modalWebView}
                  scalesPageToFit={true}
                  javaScriptEnabled={true}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                />
              </View>

              {/* Modal Sticky Bottom Action Bar */}
              <View style={styles.modalFooter}>
                <View style={styles.modalFooterInfo}>
                  <Text style={styles.modalFooterLabel}>Format</Text>
                  <Text style={styles.modalFooterVal}>A4 Single-Page Standard</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleSelectTemplate(previewTemplate.id)}
                  style={styles.modalCtaBtn}
                >
                  <Text style={styles.modalCtaText}>Use This Template</Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: C.bg,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  brandTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.primaryDeep,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.4,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 12,
  },
  catalogHeaderWrap: {
    paddingBottom: 6,
  },
  spotlightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: "rgba(253, 167, 88, 0.35)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  spotlightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  spotlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  spotlightBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 0.5,
  },
  atsScoreHighlight: {
    backgroundColor: "rgba(253, 167, 88, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  atsScoreText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.primaryDeep,
  },
  spotlightBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  spotlightLeftCol: {
    flex: 1.3,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  spotlightDesc: {
    fontSize: 11.5,
    color: C.muted,
    lineHeight: 16.5,
    fontWeight: "500",
    marginBottom: 10,
  },
  spotlightPillsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  spotlightMiniPill: {
    backgroundColor: C.inputBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(87, 51, 83, 0.08)",
  },
  spotlightMiniPillText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: C.text,
  },
  spotlightCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "flex-start",
  },
  spotlightCtaText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  spotlightDocThumbWrap: {
    width: 102,
    height: 144,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    position: "relative",
  },
  spotlightDocCanvas: {
    flex: 1,
  },
  spotlightDocOverlay: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(87, 51, 83, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  spotlightDocOverlayText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  seriesSection: {
    marginVertical: 8,
  },
  seriesScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  seriesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  seriesChipActive: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  seriesChipInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(87, 51, 83, 0.12)",
  },
  seriesChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  seriesTextActive: {
    color: "#FFFFFF",
  },
  seriesTextInactive: {
    color: C.text,
  },
  seriesCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countBadgeInactive: {
    backgroundColor: C.inputBg,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  countTextActive: {
    color: "#FFFFFF",
  },
  countTextInactive: {
    color: C.text,
  },
  resultsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.primaryDeep,
  },
  cardContainer: {
    width: CARD_WIDTH,
    margin: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  previewArea: {
    width: "100%",
    aspectRatio: 1 / 1.36,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(87, 51, 83, 0.05)",
  },
  previewCanvas: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  nativePreviewWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  atsPill: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(16, 185, 129, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  atsPillText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#059669",
  },
  quickEyeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(87, 51, 83, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTag: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  cardInfo: {
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.2,
  },
  templateSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
    marginBottom: 8,
  },
  useTemplateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: C.primary,
    paddingVertical: 7,
    borderRadius: 8,
  },
  useTemplateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: "500",
    color: C.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 17,
  },
  emptyResetBtn: {
    marginTop: 16,
    backgroundColor: C.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyResetText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 22, 37, 0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    height: "92%",
    backgroundColor: "#FBF7F2",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
    paddingTop: 10,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(87, 51, 83, 0.2)",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(87, 51, 83, 0.08)",
    backgroundColor: "#FFFFFF",
  },
  modalBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.3,
  },
  modalDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.inputBg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modalPreviewFrame: {
    flex: 1,
    backgroundColor: "#EDE5DE",
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  modalWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(87, 51, 83, 0.08)",
    gap: 12,
  },
  modalFooterInfo: {
    flex: 1,
  },
  modalFooterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    textTransform: "uppercase",
  },
  modalFooterVal: {
    fontSize: 12,
    fontWeight: "800",
    color: C.text,
    marginTop: 1,
  },
  modalCtaBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    height: 48,
    borderRadius: 14,
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCtaText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
