/**
 * manual.tsx
 *
 * 1. WebView preview — pass isPrint=false so the HTML's JS scaler runs inside WebView.
 * 2. PDF — pass isPrint=true so the scaling script is omitted and @page CSS fires.
 * 3. Add/Remove experience entries with the Plus / Trash2 buttons.
 * 4. Education and Contact fields added to the Edit tab.
 * 5. Full Dark Theme support with dynamic colors and Status Bar integration.
 */

import React from "react";
import { generateResumeHtml } from "@/components/resume-html-generator";
import { Theme, Colors } from "@/constants/theme";
import * as Print from "expo-print";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from "react-native";
import { ArrowLeft, Edit2, Eye, Plus, Sparkles, Trash2, Save, FolderOpen, History, ChevronDown, X } from "lucide-react-native";
import { auth } from "@/services/firebase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { callAI } from "@/services/ai";
import { UserStorage } from "@/services/storage";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { API_CONFIG } from "@/constants/config";
import { StatusBar } from "expo-status-bar";

const bannerId = __DEV__ ? TestIds.BANNER : API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

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

interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
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
  projects: Project[];
  skills: string;
  languages: string;
  photo?: string;
}

// ─── default data ────────────────────────────────────────────────────────────
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
  projects: [
    {
      id: "1",
      name: "Elite Resume Builder",
      link: "https://github.com/dinesh/resume-builder",
      description: "A premium AI-powered resume builder built with React Native and Expo.",
    },
  ],
  skills: "React Native, React, Node.js, TypeScript, Firebase, AWS",
  languages: "English, Tamil",
};

export default function ManualBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = React.useState<"edit" | "preview">("preview");
  const [data, setData] = React.useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState("#f59e0b");

  // Version States
  const [versions, setVersions] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [showVersionDropdown, setShowVersionDropdown] = React.useState(false);

  const fetchVersions = async () => {
    const v = await UserStorage.getResumeVersions();
    setVersions(v);
  };

  React.useEffect(() => {
    fetchVersions();
  }, []);

  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) {
      Alert.alert("Name required", "Please enter a name for this version.");
      return;
    }
    try {
      setIsSaving(true);
      await UserStorage.saveResumeVersion(newVersionName.trim(), data);
      await fetchVersions();
      setShowSaveModal(false);
      setNewVersionName("");
      Alert.alert("Saved", "Resume version saved successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadVersion = (version: any) => {
    Alert.alert(
      "Load Version",
      `Overwrite current content with "${version.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Load", 
          onPress: () => {
            setData(version.data);
            setShowVersionDropdown(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } 
        }
      ]
    );
  };

  const handleDeleteVersion = async (name: string) => {
    Alert.alert(
      "Delete Version",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await UserStorage.deleteResumeVersion(name);
            await fetchVersions();
          } 
        }
      ]
    );
  };

  React.useEffect(() => {
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

  const { importData } = useLocalSearchParams<{ importData?: string }>();

  React.useEffect(() => {
    if (importData) {
      try {
        const parsed = JSON.parse(importData);
        setData(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          summary: parsed.summary || prev.summary,
          experience: parsed.experience ? parsed.experience.map((e: any) => ({
            ...e,
            id: Math.random().toString(36).substr(2, 9)
          })) : prev.experience,
          projects: parsed.projects ? parsed.projects.map((p: any) => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9)
          })) : prev.projects,
          skills: parsed.skills || prev.skills,
        }));
        // Switch to edit tab to show the imported data
        setActiveTab("edit");
        // Clear params to avoid re-importing on refresh
        router.setParams({ importData: undefined });
        Alert.alert("Success", "Optimized content has been imported into the editor!");
      } catch (e) {
        console.error("Import error:", e);
      }
    }
  }, [importData]);

  const THEME_COLORS = [
    "#1e293b", "#0f172a", "#3b82f6", "#d946ef", "#10b981", "#f59e0b", "#ef4444",
  ];

  const set = React.useCallback(
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
      setData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setEdu = React.useCallback(
    <K extends keyof Education>(key: K, value: string) =>
      setData((prev) => ({
        ...prev,
        education: { ...prev.education, [key]: value },
      })),
    [],
  );

  const setExp = React.useCallback(
    (id: string, key: keyof Experience, value: string) =>
      setData((prev) => ({
        ...prev,
        experience: prev.experience.map((e) =>
          e.id === id ? { ...e, [key]: value } : e,
        ),
      })),
    [],
  );

  const addExp = React.useCallback(
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

  const removeExp = React.useCallback(
    (id: string) =>
      setData((prev) => ({
        ...prev,
        experience: prev.experience.filter((e) => e.id !== id),
      })),
    [],
  );

  const setProj = React.useCallback(
    (id: string, key: keyof Project, value: string) =>
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === id ? { ...p, [key]: value } : p,
        ),
      })),
    [],
  );

  const addProj = React.useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        projects: [
          ...prev.projects,
          {
            id: Date.now().toString(),
            name: "",
            link: "",
            description: "",
          },
        ],
      })),
    [],
  );

  const removeProj = React.useCallback(
    (id: string) =>
      setData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      })),
    [],
  );

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      const html = generateResumeHtml(data, "Elite", primaryColor, "Inter", true);

      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
        margins: { left: 0, right: 0, top: 0, bottom: 0 },
      });

      const fileName = `Resume_${data.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(newPath);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } else {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Download Resume',
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [enhancingField, setEnhancingField] = React.useState<string | null>(null);

  const handleEnhance = async (text: string, fieldId: string, type: string, onUpdate: (newText: string) => void) => {
    if (!text || text.trim().length < 5) {
      Alert.alert("Text too short", "Please enter more content to enhance.");
      return;
    }
    
    try {
      setEnhancingField(fieldId);
      const messages = [
        { 
          role: 'system' as const, 
          content: 'You are an expert resume writer. Fix grammar, improve vocabulary, and make the text more professional. Keep it concise and impactful. Return ONLY the improved text, no extra commentary.' 
        },
        { 
          role: 'user' as const, 
          content: `Enhance this ${type}: ${text}` 
        }
      ];

      const result = await callAI(messages, { jsonMode: false });
      if (result) {
        onUpdate(result.trim().replace(/^"|"$/g, ''));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("AI Enhancement Failed", "There was an error processing your request. Please try again.");
    } finally {
      setEnhancingField(null);
    }
  };

  const previewHtml = React.useMemo(
    () => generateResumeHtml(data, "Elite", primaryColor, "Inter", false),
    [data, primaryColor],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.glassBorder }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Elite Studio</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.liveIndicator} />
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Auto-syncing to PDF</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={handleDownloadPDF}
          style={[styles.saveBtn, isGenerating && styles.saveBtnDisabled, { backgroundColor: isDark ? Theme.colors.primary : '#1e293b' }]}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
          ) : (
            <>
              <Sparkles size={16} color={isDark ? "#000" : "#fff"} />
              <Text style={[styles.saveBtnText, { color: isDark ? "#000" : "#fff" }]}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === "edit" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Version Management Section */}
          <View style={styles.editorSection}>
             <View style={styles.versionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Resume Versions</Text>
                <View style={styles.versionActions}>
                   <TouchableOpacity 
                    onPress={() => setShowVersionDropdown(!showVersionDropdown)}
                    style={[styles.dropdownBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                   >
                      <FolderOpen size={16} color={Theme.colors.primary} />
                      <Text style={[styles.dropdownBtnText, { color: colors.text }]}>Load Version</Text>
                      <ChevronDown size={14} color={colors.textMuted} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                    onPress={() => setShowSaveModal(true)}
                    style={[styles.saveVersionIconBtn, { backgroundColor: Theme.colors.primary + '15' }]}
                   >
                      <Save size={18} color={Theme.colors.primary} />
                   </TouchableOpacity>
                </View>
             </View>

             {showVersionDropdown && (
               <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  {versions.length === 0 ? (
                    <Text style={[styles.emptyVersions, { color: colors.textMuted }]}>No saved versions yet (Max 3)</Text>
                  ) : (
                    versions.map((v) => (
                      <TouchableOpacity 
                        key={v.name} 
                        style={[styles.dropdownItem, { borderBottomColor: colors.glassBorder }]}
                        onPress={() => handleLoadVersion(v)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.versionName, { color: colors.text }]}>{v.name}</Text>
                          <Text style={[styles.versionDate, { color: colors.textMuted }]}>
                            Saved {new Date(v.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteVersion(v.name)}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  )}
               </View>
             )}
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Elite Theme</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, flexDirection: 'row', gap: 12, flexWrap: 'wrap' }]}>
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

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Field label="Full Name" value={data.name} onChange={(v: string) => set("name", v)} colors={colors} />
              <Field label="Headline" value={data.title} onChange={(v: string) => set("title", v)} colors={colors} />
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Field label="Email" value={data.email} onChange={(v: string) => set("email", v)} keyboardType="email-address" colors={colors} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field label="Phone" value={data.phone} onChange={(v: string) => set("phone", v)} keyboardType="phone-pad" colors={colors} />
                </View>
              </View>
              <Field label="Location" value={data.location} onChange={(v: string) => set("location", v)} colors={colors} />
              <Field 
                label="Summary" 
                value={data.summary} 
                onChange={(v: string) => set("summary", v)} 
                multiline 
                colors={colors}
                onEnhance={() => handleEnhance(data.summary, 'summary', 'professional summary', (v) => set("summary", v))}
                isEnhancing={enhancingField === 'summary'}
              />
            </View>
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Experience</Text>
              <TouchableOpacity onPress={addExp} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add New</Text>
              </TouchableOpacity>
            </View>
            
            {data.experience.map((exp, idx) => (
              <View key={exp.id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <View style={[styles.cardTop, { borderBottomColor: colors.glassBorder }]}>
                  <Text style={styles.cardIndex}>Experience #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeExp(exp.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field label="Company" value={exp.company} onChange={(v: string) => setExp(exp.id, "company", v)} colors={colors} />
                <Field label="Role" value={exp.role} onChange={(v: string) => setExp(exp.id, "role", v)} colors={colors} />
                <Field label="Duration" value={exp.period} onChange={(v: string) => setExp(exp.id, "period", v)} colors={colors} />
                <Field 
                  label="Description" 
                  value={exp.description} 
                  onChange={(v: string) => setExp(exp.id, "description", v)} 
                  multiline 
                  colors={colors} 
                  onEnhance={() => handleEnhance(exp.description, `exp-${exp.id}`, 'job description', (v) => setExp(exp.id, "description", v))}
                  isEnhancing={enhancingField === `exp-${exp.id}`}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Projects</Text>
              <TouchableOpacity onPress={addProj} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add Project</Text>
              </TouchableOpacity>
            </View>
            
            {data.projects.map((proj, idx) => (
              <View key={proj.id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <View style={[styles.cardTop, { borderBottomColor: colors.glassBorder }]}>
                  <Text style={styles.cardIndex}>Project #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeProj(proj.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field label="Project Name" value={proj.name} onChange={(v: string) => setProj(proj.id, "name", v)} colors={colors} />
                <Field label="Link (GitHub/Live)" value={proj.link} onChange={(v: string) => setProj(proj.id, "link", v)} colors={colors} />
                <Field 
                  label="Description" 
                  value={proj.description} 
                  onChange={(v: string) => setProj(proj.id, "description", v)} 
                  multiline 
                  colors={colors} 
                  onEnhance={() => handleEnhance(proj.description, `proj-${proj.id}`, 'project description', (v) => setProj(proj.id, "description", v))}
                  isEnhancing={enhancingField === `proj-${proj.id}`}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Field label="School" value={data.education.school} onChange={(v: string) => setEdu("school", v)} colors={colors} />
              <Field label="Degree" value={data.education.degree} onChange={(v: string) => setEdu("degree", v)} colors={colors} />
              <Field label="Year" value={data.education.year} onChange={(v: string) => setEdu("year", v)} colors={colors} />
            </View>
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills & Languages</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Field label="Skills" value={data.skills} onChange={(v: string) => set("skills", v)} multiline colors={colors} />
              <Field label="Languages" value={data.languages} onChange={(v: string) => set("languages", v)} colors={colors} />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={[styles.previewContainer, { backgroundColor: isDark ? colors.background : "#0f172a" }]}>
          <View style={[styles.webviewWrapper, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <WebView
              originWhitelist={["*"]}
              source={{ html: previewHtml }}
              style={styles.webview}
              scalesPageToFit={true}
              scrollEnabled={true}
              javaScriptEnabled={true}
            />
          </View>
        </View>
      )}

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.glassBorder }]}>
        <View style={[styles.segmentedContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
          <TouchableOpacity
            onPress={() => setActiveTab("edit")}
            style={[styles.segment, activeTab === "edit" && { backgroundColor: Theme.colors.primary }]}
          >
            <Edit2 size={16} color={activeTab === "edit" ? "#fff" : colors.textMuted} />
            <Text style={[styles.segmentText, { color: activeTab === "edit" ? "#fff" : colors.textMuted }]}>Editor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("preview")}
            style={[styles.segment, activeTab === "preview" && { backgroundColor: Theme.colors.primary }]}
          >
            <Eye size={16} color={activeTab === "preview" ? "#fff" : colors.textMuted} />
            <Text style={[styles.segmentText, { color: activeTab === "preview" ? "#fff" : colors.textMuted }]}>Preview</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bannerContainer, { backgroundColor: colors.background }]}>
        <BannerAd
          unitId={bannerId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>

      {/* Save Version Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.saveModal, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Save Current Version</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter a name for this version (e.g. Google Tailored). Max 3 versions allowed.
            </Text>
            <TextInput 
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder }]}
              value={newVersionName}
              onChangeText={setNewVersionName}
              placeholder="Version Name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.confirmSaveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveVersion}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmSaveBtnText}>Save Resume</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChange, multiline, placeholder, keyboardType, colors, onEnhance, isEnhancing }: any) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
        {onEnhance && (
          <TouchableOpacity 
            onPress={onEnhance} 
            disabled={isEnhancing}
            style={styles.enhanceBtn}
          >
            {isEnhancing ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <>
                <Sparkles size={12} color={Theme.colors.primary} />
                <Text style={[styles.enhanceBtnText, { color: Theme.colors.primary }]}>AI Enhance</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[
          styles.input, 
          multiline && styles.inputMultiline, 
          { 
            backgroundColor: colors.background, 
            borderColor: colors.glassBorder,
            color: colors.text 
          }
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  headerSub: { fontSize: 11, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontWeight: "800", fontSize: 13 },
  tabBar: { 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  segmentedContainer: {
    flexDirection: "row",
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
  segmentText: { fontSize: 13, fontWeight: "700" },
  editorContent: { paddingHorizontal: 20, paddingTop: 20 },
  editorSection: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  addSectionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addSectionText: { fontSize: 13, fontWeight: "700" },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardIndex: { fontSize: 12, fontWeight: "700" },
  deleteBtn: { padding: 4 },
  rowFields: { flexDirection: "row" },
  fieldContainer: { marginBottom: 16 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  enhanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, backgroundColor: Theme.colors.primary + '10' },
  enhanceBtnText: { fontSize: 10, fontWeight: '800' },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "600",
  },
  inputMultiline: { height: 110, paddingTop: 14 },
  previewContainer: { flex: 1 },
  webviewWrapper: { 
    flex: 1, 
    margin: 15,
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  bannerContainer: {
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  },
  versionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  versionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1 
  },
  dropdownBtnText: { fontSize: 13, fontWeight: '700' },
  saveVersionIconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  dropdownMenu: { 
    borderRadius: 18, 
    borderWidth: 1, 
    overflow: 'hidden', 
    marginBottom: 10 
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderBottomWidth: 1 
  },
  versionName: { fontSize: 14, fontWeight: '700' },
  versionDate: { fontSize: 10, marginTop: 2 },
  emptyVersions: { textAlign: 'center', padding: 20, fontSize: 13 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  saveModal: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, marginBottom: 20 },
  confirmSaveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  confirmSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
