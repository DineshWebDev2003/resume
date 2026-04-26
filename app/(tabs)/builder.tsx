import { GlassCard } from "@/components/glass-card";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getResumes, UserResume } from "@/utils/storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronRight,
  FileSearch,
  FileText,
  Linkedin,
  Mic,
  PenTool,
  Sparkles,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TemplatePreviewModal } from "@/components/TemplatePreviewModal";
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { API_CONFIG } from "@/constants/config";

import {
  ProfessionalTemplate,
} from "@/components/resume-templates";

const bannerId = __DEV__ ? TestIds.BANNER : API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

export default function BuilderLanding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [myResumes, setMyResumes] = useState<UserResume[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getResumes().then(setMyResumes);
    }, []),
  );

  const smartOptions = [
    { title: "AI Chat Builder", description: "Human-like conversation to build our professional profile.", icon: Sparkles, color: Theme.colors.primary, mode: "chat" },
    { title: "Voice Assistant", description: "Just speak and let AI structure your experience live.", icon: Mic, color: Theme.colors.secondary, mode: "voice" },
    { title: "LinkedIn Sync", description: "Intelligently extract data from your LinkedIn profile.", icon: Linkedin, color: "#0077B5", mode: "linkedin" },
    { title: "ATS AI Score", description: "Check your resume compatibility score and get improvement tips.", icon: FileSearch, color: "#10b981", mode: "ats" },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 60), backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Smart Resume Builder</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Select an AI-powered creation method</Text>
        </View>

        <View style={styles.grid}>
          {smartOptions.map((option, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 150)} style={styles.gridItem}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (option.mode === "linkedin") router.push("/builder/linkedin");
                  else if (option.mode === "ats") router.push("/builder/ats");
                  else if (option.mode === "voice") router.push("/builder/ai-interview");
                  else router.push({ pathname: "/builder/chat", params: { initialMode: option.mode } });
                }}
              >
                <GlassCard style={[styles.smartCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <View style={[styles.iconBox, { backgroundColor: option.color + "15" }]}>
                    <option.icon size={28} color={option.color} />
                  </View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{option.description}</Text>
                  <View style={styles.footer}>
                    <Text style={[styles.workableText, { color: option.color }]}>WORKABLE AI</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={styles.manualEntry}>
          <TouchableOpacity style={styles.manualLink} onPress={() => router.push("/builder/manual")}>
            <PenTool size={16} color={colors.textMuted} />
            <Text style={[styles.manualText, { color: colors.textMuted }]}>Prefer Manual Entry?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Resumes</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/resumes")}>
            <GlassCard style={[styles.myResumesContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <View style={[styles.resumeIconBox, { backgroundColor: Theme.colors.primary + "20" }]}>
                <FileText size={24} color={Theme.colors.primary} />
              </View>
              <View style={styles.myResumesInfo}>
                <Text style={[styles.myResumesTitle, { color: colors.text }]}>
                  {myResumes.length > 0 ? `${myResumes.length} Professional Resume${myResumes.length > 1 ? "s" : ""}` : "Manage Saved Resumes"}
                </Text>
                <Text style={[styles.myResumesSubtitle, { color: colors.textMuted }]}>
                  {myResumes.length > 0 ? "Tap to view and manage your drafts" : "Access your stored resumes and drafts"}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resume Preview Styles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateList}>
            {[
              { id: 1, name: "Executive" },
              { id: 2, name: "Modern" },
              { id: 3, name: "Creative" },
              { id: 4, name: "Professional" },
            ].map((template) => (
              <TouchableOpacity key={template.id} onPress={() => setSelectedTemplateId(template.name)}>
                <GlassCard style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <View style={[styles.templatePreview, { backgroundColor: "#fff", borderColor: colors.glassBorder }]}>
                    <BuilderMiniResume index={template.id} isDark={isDark} colors={colors} />
                  </View>
                  <Text style={[styles.templateName, { color: colors.text }]}>{template.name}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <TemplatePreviewModal 
        visible={!!selectedTemplateId} 
        templateId={selectedTemplateId || ''} 
        onClose={() => setSelectedTemplateId(null)}
        onSelect={(id) => {
          setSelectedTemplateId(null);
          router.push({ pathname: "/builder/manual", params: { theme: id } });
        }}
      />

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

const BuilderMiniResume = ({ index, isDark }: { index: number; isDark: boolean; colors: any; }) => {
  const isExecutive = index === 1;
  const isModern = index === 2;
  const isCreative = index === 3;
  const isProfessional = index === 4;

  const mockData = {
    name: "Alex Johnson",
    title: "Senior Software Systems Engineer",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 234-5678",
    summary: "Innovative and results-driven Software Engineer with over 7 years of experience in designing and implementing scalable cloud-native applications.",
    experience: [
      { role: "Senior Systems Architect", company: "TechFlow Solutions", period: "2021-Present", description: "Leading the development of a microservices architecture." },
    ],
    skills: "React Native, TypeScript, Node.js, AWS, CI/CD",
    education: { degree: "M.S. in Computer Science", school: "Western Tech", year: "2018" },
  };

  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const scale = 0.19;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: A4_WIDTH, height: A4_HEIGHT, backgroundColor: "#fff", transform: [{ scale }] }}>
        {isExecutive && <ExecutiveTemplate resumeData={mockData} selectedFont="System" />}
        {isModern && <ModernTemplate resumeData={mockData} selectedFont="System" />}
        {isCreative && <CreativeTemplate resumeData={mockData} selectedFont="System" />}
        {isProfessional && <ProfessionalTemplate resumeData={mockData} selectedFont="System" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 16, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  gridItem: { width: "47.5%", aspectRatio: 0.85 },
  smartCard: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, justifyContent: "space-between" },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  optionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  optionDesc: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  workableText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  manualEntry: { alignItems: "center", marginTop: 24, marginBottom: 8 },
  manualLink: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  manualText: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  recentSection: { marginTop: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
  templateList: { gap: 16, paddingRight: 20 },
  templateCard: { width: 140, padding: 12, alignItems: "center", borderRadius: 20, borderWidth: 1 },
  templatePreview: { width: "100%", aspectRatio: 1 / 1.4142, borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  templateName: { fontSize: 14, fontWeight: "700" },
  myResumesContainer: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 24, borderWidth: 1 },
  resumeIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 16 },
  myResumesInfo: { flex: 1 },
  myResumesTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  myResumesSubtitle: { fontSize: 13, fontWeight: "500" },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: 4,
  },
});
