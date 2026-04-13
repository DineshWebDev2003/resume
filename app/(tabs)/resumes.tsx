import { GlassCard } from "@/components/glass-card";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteResume, getResumes, UserResume } from "@/utils/storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, Plus, Star, Trash2, Download } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { generateResumeHtml } from "@/components/resume-html-generator";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = [
  {
    name: "Software IT",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    count: 45,
    description: "Dev, Ops, Cloud",
  },
  {
    name: "Business & Finance",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    count: 32,
    description: "MBA, Finance, Sales",
  },
  {
    name: "Healthcare",
    image:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
    count: 28,
    description: "Medical & Nursing",
  },
  {
    name: "Creative & Design",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80",
    count: 35,
    description: "UI/UX, Arts, Media",
  },
  {
    name: "Education",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    count: 15,
    description: "Teaching & Research",
  },
];

const CATEGORY_CONTENT: Record<string, any> = {
  "Software IT": {
    name: "Sarah Chen",
    role: "Senior Full Stack Cloud Architect",
    summary:
      "Expert in React, Node.js and AWS Cloud Infrastructure. 8+ years experience building scalable enterprise applications and leading cross-functional engineering teams to deliver high-performance digital solutions.",
  },
  "Business & Finance": {
    name: "Michael Ross",
    role: "Strategic Investment Analyst",
    summary:
      "Results-oriented financial advisor with a decade of expertise in equity research, risk mitigation, and portfolio optimization. Proven track record in managing $100M+ assets and delivering consistent ROI.",
  },
  Healthcare: {
    name: "Dr. Emily Watson",
    role: "Head Registered Nurse (Emergency Care)",
    summary:
      "Compassionate healthcare professional with 12 years of experience in high-volume trauma centers. Specialized in critical care coordination, patient advocacy, and mentorship of junior nursing staff.",
  },
  "Creative & Design": {
    name: "Alex Rivera",
    role: "Design Lead & UI/UX Strategist",
    summary:
      "Empathy-driven visual storyteller focused on crafting intuitive, accessible, and high-conversion digital products. Expertise in Figma, Adobe Creative Suite, and conversion rate optimization (CRO) through design.",
  },
  Education: {
    name: "David Miller",
    role: "Associate Professor of Computer Science",
    summary:
      "Dedicated educator and research fellow with a focus on artificial intelligence ethics and distributed systems. Published 15+ peer-reviewed papers and facilitated various award-winning STEM programs.",
  },
};

const generateResumesForCategory = (category: string) => {
  const resumes = [];
  const templates = ["Executive", "Modern", "Creative"];
  const colors = ["#FF1493", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];
  const content = CATEGORY_CONTENT[category] || {
    name: "Alex Johnson",
    role: "Professional",
    summary: "Career details...",
  };

  for (let i = 1; i <= 20; i++) {
    const isPremium = i > 10;
    resumes.push({
      id: `${category}-${i}`,
      name: `${category} Template ${i}`,
      userName: content.name,
      userRole: content.role,
      userSummary: content.summary,
      template: templates[i % templates.length],
      color: colors[i % colors.length],
      isPremium,
      hasPhoto: i % 3 === 0,
    });
  }
  return resumes;
};

import {
  CreativeTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  ProfessionalTemplate,
} from "@/components/resume-templates";

const TemplateMiniPreview = ({
  template,
  name,
  role,
  summary,
  isFeatured = false,
}: any) => {
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const scale = isFeatured ? 0.2 : 0.28;

  const previewData = {
    name: name || "Alex Johnson",
    title: role || "Senior Software Systems Engineer",
    summary:
      summary ||
      "Innovative and results-driven Software Engineer with over 7 years of experience in designing and implementing scalable cloud-native applications. Expert in React Native, Node.js, and Distributed Systems, with a passion for optimizing performance and enhancing user experience.",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 234-5678",
    skills: "React Native, TypeScript, Node.js, AWS (Lambda, S3, RDS), Docker, Kubernetes, GraphQL, Tailwind CSS, CI/CD, Agile Methodologies",
    experience: [
      {
        role: "Senior Systems Architect",
        company: "TechFlow Solutions Inc.",
        period: "2021-Present",
        description: "Leading the development of a microservices architecture that handles 1M+ daily active users. Improved system latency by 45% through strategic caching and query optimization.",
      },
      {
        role: "Lead Frontend Developer",
        company: "Innovation Hub",
        period: "2018-2021",
        description: "Spearheaded the migration of legacy mobile apps to React Native, reducing development time by 30% and maintaining a 4.8-star rating on the App Store.",
      },
      {
        role: "Software Engineer",
        company: "Junior Dev Studios",
        period: "2016-2018",
        description: "Focused on developing interactive UI components and integrating third-party APIs for various fintech clients.",
      },
    ],
    projects: [
      {
        id: "1",
        title: "Global E-commerce Engine",
        description: "Built a multi-tenant e-commerce platform supporting multiple currencies and languages with integrated Stripe payments.",
      },
      {
        id: "2",
        title: "AI Resume Builder",
        description: "Developed an AI-powered tool that analyzes resumes against job descriptions to provide optimization scores and suggestions.",
      },
    ],
    education: {
      degree: "M.S. in Computer Science",
      school: "Western Institute of Technology",
      year: "2018",
    },
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          backgroundColor: "#fff",
          transform: [{ scale }],
        }}
      >
        {template === "Executive" && (
          <ExecutiveTemplate resumeData={previewData} selectedFont="Roboto" />
        )}
        {template === "Modern" && (
          <ModernTemplate resumeData={previewData} selectedFont="Roboto" />
        )}
        {template === "Creative" && (
          <CreativeTemplate resumeData={previewData} selectedFont="Roboto" />
        )}
        {template === "Professional" && (
          <ProfessionalTemplate
            resumeData={previewData}
            selectedFont="Roboto"
          />
        )}
      </View>
    </View>
  );
};

export default function ResumesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [myResumes, setMyResumes] = useState<UserResume[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMyResumes();
    }, []),
  );

  const loadMyResumes = async () => {
    const loaded = await getResumes();
    setMyResumes(loaded);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Resume", "Are you sure you want to delete this resume?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await deleteResume(id);
          if (success) {
            setMyResumes((prev) => prev.filter((r) => r.id !== id));
          }
        },
      },
    ]);
  };

  const handleDownload = async (resume: UserResume) => {
    try {
      const html = generateResumeHtml(
        resume.data,
        resume.template,
        resume.color || Theme.colors.primary,
        "Roboto"
      );

      const { uri } = await Print.printToFileAsync({
        html,
        width: 794,
        height: 1123,
      });

      const filename = `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`;

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              filename,
              "application/pdf"
            );
          await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert("Success", "Resume saved to Downloads perfectly!");
          return;
        }
      }

      await Sharing.shareAsync(uri, {
        UTI: "public.pdf",
        dialogTitle: "Save your Resume",
      });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Could not generate or save PDF");
    }
  };

  const renderCategoryList = () => (
    <View style={styles.categoryContainer}>
      {CATEGORIES.map((cat, index) => (
        <Animated.View
          key={cat.name}
          entering={FadeInUp.delay(index * 150)
            .duration(600)
            .springify()}
        >
          <TouchableOpacity
            style={[
              styles.chatCard,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8f9fa",
                borderColor: colors.glassBorder,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <View style={styles.chatAvatarContainer}>
              <Image source={{ uri: cat.image }} style={styles.chatAvatar} />
              <View
                style={[
                  styles.onlineStatus,
                  { backgroundColor: Theme.colors.primary },
                ]}
              />
            </View>

            <View style={styles.chatInfo}>
              <Text style={[styles.chatName, { color: colors.text }]}>
                {cat.name}
              </Text>
              <Text
                style={[styles.chatMessage, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                Browse {cat.description} templates
              </Text>
            </View>

            <View style={styles.chatMeta}>
              <Text style={[styles.chatTime, { color: colors.textMuted }]}>
                {10 + index}m ago
              </Text>
              <View
                style={[
                  styles.chatBadge,
                  { backgroundColor: Theme.colors.primary },
                ]}
              >
                <Text style={styles.chatBadgeText}>{cat.count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderTemplateGrid = () => {
    if (!selectedCategory) return null;
    const resumes = generateResumesForCategory(selectedCategory);

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.backToCatBtn,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
              borderColor: colors.glassBorder,
            },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backToCatText, { color: colors.text }]}>
            Back to Categories
          </Text>
        </TouchableOpacity>

        <Text style={[styles.gridHeadline, { color: colors.text }]}>
          {selectedCategory} Resumes
        </Text>

        <View style={styles.grid}>
          {resumes.map((resume) => (
            <TouchableOpacity
              key={resume.id}
              style={styles.gridItem}
              onPress={() =>
                router.push({
                  pathname: "/builder/manual",
                  params: {
                    theme: resume.template,
                    color: resume.color,
                    name: resume.userName,
                    role: resume.userRole,
                    summary: resume.userSummary,
                  },
                })
              }
            >
              <View
                style={[
                  styles.resumePreview,
                  {
                    borderColor: "#eee",
                    backgroundColor: isDark ? "#1e1e1e" : "#fff",
                  },
                ]}
              >
                {resume.isPremium && (
                  <View style={styles.premiumRibbon}>
                    <Star size={10} color="#fff" fill="#fff" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
                <TemplateMiniPreview
                  template={resume.template}
                  name={resume.userName}
                  role={resume.userRole}
                  summary={resume.userSummary}
                />
              </View>
              <Text
                style={[styles.resumeGridName, { color: colors.text }]}
                numberOfLines={1}
              >
                {resume.name}
              </Text>
              <Text
                style={[styles.resumeGridTemplate, { color: colors.textMuted }]}
              >
                {resume.template}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 5,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Resumes
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/builder/manual" })}
        >
          <LinearGradient
            colors={[Theme.colors.secondary, "#FF69B4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.newButton}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.newButtonText}>New Blank</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedCategory ? (
          <>
            {myResumes.length > 0 && (
              <View style={styles.featuredSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  My Resumes ({myResumes.length}/3)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredScroll}
                >
                  {myResumes.map((res) => (
                    <TouchableOpacity
                      key={res.id}
                      onPress={() =>
                        router.push({
                          pathname: "/builder/manual",
                          params: { resumeId: res.id },
                        })
                      }
                      onLongPress={() => handleDelete(res.id)}
                    >
                      <GlassCard
                        style={[
                          styles.featuredItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.glassBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.featuredPreview,
                            {
                              backgroundColor: isDark ? "#1e1e1e" : "#fff",
                              borderColor: colors.glassBorder,
                            },
                          ]}
                        >
                          <TemplateMiniPreview
                            template={res.template}
                            name={res.name}
                            role={res.role}
                            summary={res.data.summary}
                            isFeatured={true}
                          />
                          <TouchableOpacity
                            style={styles.deleteBadge}
                            onPress={() => handleDelete(res.id)}
                          >
                            <Trash2 size={12} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.downloadBadge}
                            onPress={() => handleDownload(res)}
                          >
                            <Download size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                        <Text
                          style={[styles.featuredName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {res.role || "Untitled"}
                        </Text>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.featuredSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Featured Layouts
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {generateResumesForCategory("Software IT")
                  .slice(0, 5)
                  .map((res, i) => (
                    <TouchableOpacity
                      key={`feat-${i}`}
                      onPress={() =>
                        router.push({
                          pathname: "/builder/manual",
                          params: {
                            theme: res.template,
                            color: res.color,
                            name: res.userName,
                            role: res.userRole,
                            summary: res.userSummary,
                          },
                        })
                      }
                    >
                      <GlassCard
                        style={[
                          styles.featuredItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.glassBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.featuredPreview,
                            {
                              backgroundColor: isDark ? "#1e1e1e" : "#fff",
                              borderColor: colors.glassBorder,
                            },
                          ]}
                        >
                          <TemplateMiniPreview
                            template={res.template}
                            name={res.userName}
                            role={res.userRole}
                            summary={res.userSummary}
                            isFeatured={true}
                          />
                        </View>
                        <Text
                          style={[styles.featuredName, { color: colors.text }]}
                        >
                          {res.template}
                        </Text>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose a Profession
            </Text>
            {renderCategoryList()}
          </>
        ) : (
          renderTemplateGrid()
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  newButtonText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categoryContainer: {
    gap: 16,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: 1,
  },
  chatAvatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
  },
  onlineStatus: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#000",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  chatMessage: {
    fontSize: 14,
    fontWeight: "500",
  },
  chatMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  chatTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  chatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  backToCatBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
  },
  backToCatText: {
    fontSize: 15,
    fontWeight: "700",
  },
  gridHeadline: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  resumePreview: {
    width: "100%",
    aspectRatio: 1 / 1.414,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  premiumRibbon: {
    position: "absolute",
    top: 10,
    right: -25,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 30,
    paddingVertical: 4,
    transform: [{ rotate: "45deg" }],
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  premiumText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  resumeGridName: {
    fontSize: 14,
    fontWeight: "700",
  },
  resumeGridTemplate: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  featuredSection: {
    marginBottom: 32,
  },
  featuredScroll: {
    gap: 16,
    paddingRight: 20,
  },
  featuredItem: {
    width: 140,
    padding: 12,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
  },
  featuredPreview: {
    width: "100%",
    aspectRatio: 1 / 1.4142,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  featuredName: {
    fontSize: 14,
    fontWeight: "700",
  },
  deleteBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
