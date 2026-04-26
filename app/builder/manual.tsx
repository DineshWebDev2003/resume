/**
 * manual.tsx  (app/resume/manual.tsx or wherever you placed it)
 *
 * FIXES vs original:
 * 1. WebView preview — pass isPrint=false so the HTML's JS scaler runs inside WebView.
 *    We no longer try to manually compute scale in React Native; the HTML itself scales.
 * 2. WebView — added injectedJavaScript to post the content height back so the
 *    WebView's own scroll area is correct.
 * 3. PDF — pass isPrint=true so the scaling script is omitted and @page CSS fires.
 *    expo-print with width=794, height=1123, all margins=0 produces pixel-perfect A4.
 * 4. Add/Remove experience entries with the Plus / Trash2 buttons.
 * 5. Education and Contact fields added to the Edit tab.
 */

import { generateResumeHtml } from "@/components/resume-html-generator";
import { Theme } from "@/constants/theme";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Edit2, Eye, Plus, Save, Sparkles, Trash2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { auth } from "@/services/firebase";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";

// ─── types ───────────────────────────────────────────────────────────────────
interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  year: string;
  honors: string;
}

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  summary: string;
  experience: Experience[];
  education: Education;
  skills: string;
  languages: string;
  photo?: string;
  projects: Array<{
    id: string;
    title: string;
    year: string;
    description: string;
  }>;
}

// ─── sample / default data ───────────────────────────────────────────────────
const INITIAL_DATA: ResumeData = {
  name: "DINESH KUMAR",
  title: "Full-Stack Developer",
  email: "dinesh@example.com",
  phone: "+91 9876543210",
  location: "Tamil Nadu, India",
  summary:
    "Experienced developer specialising in React Native and Node.js. Passionate about building high-quality, pixel-perfect user interfaces and scalable back-end services.",
  experience: [
    {
      id: "1",
      company: "Tech Solutions",
      role: "Lead Developer",
      period: "2022 – Present",
      description:
        "Leading a team of 5 developers building enterprise-scale mobile applications.",
    },
  ],
  education: {
    school: "Anna University",
    degree: "B.Tech Information Technology",
    year: "2018 – 2022",
    honors: "First Class with Distinction",
  },
  skills: "React Native, React, Node.js, TypeScript, Firebase, AWS",
  languages: "English, Tamil",
  projects: [],
};

// ─── component ───────────────────────────────────────────────────────────────
export default function ManualBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#f59e0b"); // Elite Yellow

  // ── Sync User Profile ──────────────────────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
        photo: user.photoURL || undefined,
      }));
    }
  }, []);

  const THEME_COLORS = [
    "#1e293b", // Slate
    "#0f172a", // Dark
    "#3b82f6", // Blue
    "#d946ef", // Fuchsia
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
  ];

  // ── field helpers ──────────────────────────────────────────────────────────
  const set = useCallback(
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
      setData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setEdu = useCallback(
    <K extends keyof Education>(key: K, value: string) =>
      setData((prev) => ({
        ...prev,
        education: { ...prev.education, [key]: value },
      })),
    [],
  );

  const setExp = useCallback(
    (id: string, key: keyof Experience, value: string) =>
      setData((prev) => ({
        ...prev,
        experience: prev.experience.map((e) =>
          e.id === id ? { ...e, [key]: value } : e,
        ),
      })),
    [],
  );

  const addExp = useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        experience: [
          ...prev.experience,
          {
            id: Date.now().toString(),
            company: "",
            role: "",
            period: "",
            description: "",
          },
        ],
      })),
    [],
  );

  const removeExp = useCallback(
    (id: string) =>
      setData((prev) => ({
        ...prev,
        experience: prev.experience.filter((e) => e.id !== id),
      })),
    [],
  );

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      const html = generateResumeHtml(
        data,
        "Elite",
        primaryColor,
        "Inter",
        true,
      );

      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
        margins: { left: 0, right: 0, top: 0, bottom: 0 },
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save your Resume",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const previewHtml = useMemo(
    () =>
      generateResumeHtml(data, "Elite", primaryColor, "Inter", false),
    [data, primaryColor],
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Elite Studio</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.headerSub}>Auto-syncing to PDF</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={handleDownloadPDF}
          style={[styles.saveBtn, isGenerating && styles.saveBtnDisabled]}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Sparkles size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabBar}>
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("edit");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.segment, activeTab === "edit" && styles.activeSegment]}
          >
            <Edit2 size={16} color={activeTab === "edit" ? "#fff" : "#64748b"} />
            <Text style={[styles.segmentText, activeTab === "edit" && styles.activeSegmentText]}>Editor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("preview");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.segment, activeTab === "preview" && styles.activeSegment]}
          >
            <Eye size={16} color={activeTab === "preview" ? "#fff" : "#64748b"} />
            <Text style={[styles.segmentText, activeTab === "preview" && styles.activeSegmentText]}>Preview</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "edit" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Theme Selection */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionTitle}>Elite Theme</Text>
            <View style={[styles.sectionCard, { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }]}>
              {THEME_COLORS.map((color) => (
                <TouchableOpacity 
                  key={color}
                  onPress={() => {
                    setPrimaryColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: color },
                    primaryColor === color && styles.activeColorCircle
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Section: Personal */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.sectionCard}>
              <Field label="Full Name" value={data.name} onChange={(v) => set("name", v)} icon="user" />
              <Field label="Headline" value={data.title} onChange={(v) => set("title", v)} icon="briefcase" />
              <Field label="Profile Photo URL" value={data.photo || ""} onChange={(v) => set("photo", v)} placeholder="https://example.com/photo.jpg" />
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Field label="Email" value={data.email} onChange={(v) => set("email", v)} keyboardType="email-address" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field label="Phone" value={data.phone} onChange={(v) => set("phone", v)} keyboardType="phone-pad" />
                </View>
              </View>
              <Field label="Location" value={data.location} onChange={(v) => set("location", v)} />
              <Field label="Professional Summary" value={data.summary} onChange={(v) => set("summary", v)} multiline />
            </View>
          </View>

          {/* Section: Experience */}
          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <TouchableOpacity onPress={addExp} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add New</Text>
              </TouchableOpacity>
            </View>
            
            {data.experience.map((exp, idx) => (
              <View key={exp.id} style={styles.sectionCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardIndex}>Experience #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeExp(exp.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field label="Company" value={exp.company} onChange={(v) => setExp(exp.id, "company", v)} />
                <Field label="Role" value={exp.role} onChange={(v) => setExp(exp.id, "role", v)} />
                <Field label="Duration" value={exp.period} onChange={(v) => setExp(exp.id, "period", v)} placeholder="e.g. 2022 – Present" />
                <Field label="Description" value={exp.description} onChange={(v) => setExp(exp.id, "description", v)} multiline />
              </View>
            ))}
          </View>

          {/* Section: Education */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.sectionCard}>
              <Field label="School / University" value={data.education.school} onChange={(v) => setEdu("school", v)} />
              <Field label="Degree" value={data.education.degree} onChange={(v) => setEdu("degree", v)} />
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Field label="Year" value={data.education.year} onChange={(v) => setEdu("year", v)} placeholder="2018 – 2022" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field label="GPA / Honors" value={data.education.honors} onChange={(v) => setEdu("honors", v)} />
                </View>
              </View>
            </View>
          </View>

          {/* Section: Skills & More */}
          <View style={styles.editorSection}>
            <Text style={styles.sectionTitle}>Skills & Languages</Text>
            <View style={styles.sectionCard}>
              <Field label="Skills (comma separated)" value={data.skills} onChange={(v) => set("skills", v)} multiline />
              <Field label="Languages" value={data.languages} onChange={(v) => set("languages", v)} />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <View style={styles.statusDot} />
            <Text style={styles.previewHeaderText}>Live Preview · A4 Standard</Text>
          </View>
          <WebView
            originWhitelist={["*"]}
            source={{ html: previewHtml }}
            style={styles.webview}
            scalesPageToFit={true}
            scrollEnabled={true}
            javaScriptEnabled={true}
            setSupportMultipleWindows={false}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              if (message.startsWith('edit:')) {
                setActiveTab("edit");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Optional: add logic to scroll to specific field
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline, placeholder, keyboardType }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  headerSub: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: '#1e293b', // Dark Navy
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },

  // Tabs
  tabBar: { paddingHorizontal: 20, paddingVertical: 15 },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeSegment: { backgroundColor: Theme.colors.primary, elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  activeSegmentText: { color: "#fff" },

  // Editor
  editorContent: { paddingHorizontal: 20 },
  editorSection: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#334155", marginBottom: 12 },
  addSectionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addSectionText: { fontSize: 13, fontWeight: "700", color: Theme.colors.primary },
  
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    marginBottom: 15,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  cardIndex: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  deleteBtn: { padding: 4 },

  rowFields: { flexDirection: "row" },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, marginLeft: 2 },
  input: {
    backgroundColor: "#fcfdfe",
    borderWidth: 1.5,
    borderColor: "#edf2f7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1a202c",
    fontWeight: "600",
  },
  inputMultiline: { height: 110, paddingTop: 14 },

  // Preview
  previewContainer: { flex: 1, backgroundColor: "#cbd5e1" },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  previewHeaderText: { fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 1 },
  webview: { flex: 1, backgroundColor: "transparent" },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorCircle: {
    borderColor: '#fff',
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

