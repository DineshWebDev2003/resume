import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Layout, Code, Palette, Landmark, ShieldCheck, Sparkles } from "lucide-react-native";
import { Theme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Animated, { FadeInDown } from "react-native-reanimated";
import { WebView } from 'react-native-webview';
import { generateResumeHtml } from "@/components/resume-html-generator";
import { ResumeData } from "@/components/resume-templates";
import { TemplatePreviewModal } from "@/components/TemplatePreviewModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOCK_RESUME: ResumeData = {
  name: "Alex Johnson",
  title: "Senior Product Designer",
  email: "alex.j@example.com",
  phone: "+1 555 000 1111",
  summary: "Results-driven designer with 10+ years of experience in creating elite digital products for global tech leaders.",
  experience: [
    { role: "Senior Designer", company: "Tech Giant", period: "2020 - 2024", description: "Led redesign of core mobile platform, increasing user engagement by 45%." },
  ],
  education: { degree: "Fine Arts", school: "Design University", year: "2016" },
  skills: "UX/UI, React Native, Prototyping, Strategy, Systems Thinking",
};

const TemplateThumbnail = ({ templateId }: { templateId: string }) => {
  const html = generateResumeHtml(MOCK_RESUME, templateId);
  
  return (
    <View style={styles.thumbnailOuter}>
       <WebView 
          pointerEvents="none"
          originWhitelist={['*']}
          source={{ html }}
          style={styles.thumbnailWebView}
          scalesPageToFit={true}
          scrollEnabled={false}
       />
    </View>
  );
};

const CATEGORIES = [
  { id: "all", name: "All Designs", icon: Layout },
  { id: "Tech", name: "IT & Tech", icon: Code },
  { id: "Creative", name: "Creative", icon: Palette },
  { id: "Executive", name: "Business", icon: Landmark },
  { id: "Healthcare", name: "Medical", icon: ShieldCheck },
];

const TEMPLATES = [
  { id: "Elite", name: "Nina Lane", field: "Creative", description: "Elite Canva-style design", tags: ["Premium", "Creative", "Bold"] },
  { id: "Corporate", name: "Executive Pro", field: "Executive", description: "Clean corporate layout", tags: ["Corporate", "Clean", "Pro"] },
  { id: "Modern", name: "Modern IT", field: "Tech", description: "Vibrant and aesthetic", tags: ["Tech", "Modern", "Sleek"] },
  { id: "Medical", name: "Shield Health", field: "Healthcare", description: "Professional medical format", tags: ["Medical", "Clear", "Standard"] },
];

export default function CategoryTemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeField, setActiveField] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = activeField === "all" 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.field === activeField);

  const renderTemplateItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.cardWrapper}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
        onPress={() => setSelectedTemplate(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
            <TemplateThumbnail templateId={item.id} />
            <View style={[styles.badgeContainer, { backgroundColor: Theme.colors.primary }]}>
                <Sparkles size={8} color="#000" />
                <Text style={styles.badgeText}>ELITE</Text>
            </View>
        </View>
        <View style={styles.infoContainer}>
            <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.tagRow}>
              <Text style={[styles.templateDesc, { color: colors.textMuted }]} numberOfLines={1}>{item.description}</Text>
            </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <ChevronLeft color={colors.text} size={28} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
            <Sparkles size={20} color={Theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Explore Fields</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setActiveField(cat.id)}
              style={[
                styles.filterTab, 
                { backgroundColor: activeField === cat.id ? Theme.colors.primary : colors.surface },
              ]}
            >
              <cat.icon size={16} color={activeField === cat.id ? "#000" : colors.textMuted} />
              <Text style={[styles.filterTabText, { color: activeField === cat.id ? "#000" : colors.textMuted }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      />

      <TemplatePreviewModal 
        visible={!!selectedTemplate}
        templateId={selectedTemplate?.id || ''}
        onClose={() => setSelectedTemplate(null)}
        onSelect={(id) => {
          setSelectedTemplate(null);
          router.push({
            pathname: "/builder/manual",
            params: { theme: id }
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, gap: 15 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  filterSection: { marginBottom: 10 },
  filterScroll: { paddingHorizontal: 20, gap: 12 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  filterTabText: { fontSize: 13, fontWeight: "700" },
  listContent: { padding: 15, gap: 15 },
  columnWrapper: { justifyContent: 'space-between', gap: 15 },
  cardWrapper: { width: '48%' },
  card: { borderRadius: 20, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  imageContainer: { width: "100%", aspectRatio: 0.8, backgroundColor: 'transparent', overflow: 'hidden' },
  thumbnailOuter: { flex: 1, backgroundColor: '#fff' }, // Resume itself stays white
  thumbnailWebView: { flex: 1, backgroundColor: 'transparent', opacity: 0.9 },
  badgeContainer: { position: "absolute", top: 10, right: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 10 },
  badgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
  infoContainer: { padding: 14 },
  templateName: { fontSize: 13, fontWeight: "800" },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  templateDesc: { fontSize: 10, fontWeight: "600" },
});
