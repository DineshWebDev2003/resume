/**
 * manual.tsx
 *
 * 1. WebView preview — pass isPrint=false so the HTML's JS scaler runs inside WebView.
 * 2. PDF — pass isPrint=true so the scaling script is omitted and @page CSS fires.
 * 3. Add/Remove experience entries with the Plus / Trash2 buttons.
 * 4. Education and Contact fields added to the Edit tab.
 * 5. Full Dark Theme support with dynamic colors and Status Bar integration.
 */

import { generateResumeHtml } from "@/components/resume-html-generator";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLimits } from "@/constants/limits";
import { callAI } from "@/services/ai";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserStorage } from "@/services/storage";
import { getResumes, saveResume } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as IntentLauncher from "expo-intent-launcher";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    ChevronDown,
    Download,
    Edit2,
    Eye,
    FolderOpen,
    History,
    Plus,
    Save,
    Sparkles,
    Trash2,
    X,
    Zap,
} from "lucide-react-native";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const bannerId = API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

const SCREEN_WIDTH = Dimensions.get("window").width;

const AVAILABLE_TEMPLATES = [
  { id: "Elder-1", name: "Elder 1: Classic" },
  { id: "Elder-2", name: "Elder 2: Elegant" },
  { id: "Elder-3", name: "Elder 3: Bold" },
  { id: "Elder-4", name: "Elder 4: Modern" },
  { id: "Elder-5", name: "Elder 5: Compact" },
  { id: "Elder-6", name: "Elder 6: Premium" },
  { id: "Elder-7", name: "Elder 7: Gold" },
  { id: "Elder-8", name: "Elder 8: Skyline" },
  { id: "Titan-1", name: "Titan 1: PRO" },
  { id: "Titan-2", name: "Titan 2: Dome" },
  { id: "Titan-3", name: "Titan 3: Split" },
  { id: "Titan-4", name: "Titan 4: Ruby" },
  { id: "BlackWolf-1", name: "Black Wolf 1" },
  { id: "BlackWolf-2", name: "Black Wolf 2" },
  { id: "BlackWolf-3", name: "Black Wolf 3" },
  { id: "BlackWolf-4", name: "Black Wolf 4" },
  { id: "Jocker-1", name: "Jocker 1: Pun" },
  { id: "Jocker-2", name: "Jocker 2: Card" },
  { id: "Jocker-3", name: "Jocker 3: Bold" },
  { id: "Jocker-4", name: "Jocker 4: Trick" },
  { id: "Jocker-5", name: "Jocker 5: Royal" },
];

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

interface Reference {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
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
  education: Education[];
  projects: Project[];
  skills: string;
  languages: string;
  photo?: string;
  references?: Reference[];
}

// We now use getLimits(selectedTemplate) instead of static FIELD_LIMITS

// ─── default data ────────────────────────────────────────────────────────────
const INITIAL_DATA: ResumeData = {
  name: "DINESH KUMAR",
  title: "Senior Full-Stack Developer",
  email: "dinesh@example.com",
  phone: "+91 9876543210",
  location: "Tamil Nadu, India",
  summary:
    "Dynamic and results-driven Senior Full-Stack Developer with over 5 years of experience in architecting and deploying high-performance mobile and web applications. Expert in React Native, Node.js, and Cloud Infrastructure. Proven track record of leading cross-functional teams to deliver scalable solutions that enhance user engagement by 40%. Committed to writing clean, maintainable code and staying ahead of emerging technology trends to drive business growth.",
  experience: [
    {
      id: "1",
      company: "Innovate Tech Hub",
      role: "Lead Full-Stack Developer",
      period: "2022 – Present",
      description:
        "Architected and launched a flagship fintech mobile application using React Native, reaching 100k+ active users within the first quarter. Engineered a robust Node.js microservices backend that improved API response times by 60% and integrated complex payment gateways with 99.9% reliability.",
    },
    {
      id: "2",
      company: "Digital Stream Systems",
      role: "Software Engineer",
      period: "2019 – 2022",
      description:
        "Developed and maintained highly responsive web interfaces for high-traffic e-commerce platforms. Collaborated with UI/UX designers to implement pixel-perfect designs and optimized front-end performance, resulting in a 25% reduction in page load speeds across all major browsers.",
    },
  ],
  education: [
    {
      id: "1",
      school: "Anna University",
      degree: "B.Tech Information Technology",
      year: "2015 – 2019",
      honors: "First Class with Distinction",
    },
  ],
  projects: [
    {
      id: "1",
      name: "Elite AI Resume Builder",
      link: "https://github.com/dinesh/resume-builder",
      description:
        "A state-of-the-art resume platform featuring real-time AI optimization, Canva-style previews, and professional PDF generation using Expo and Groq AI for instant content suggestions.",
    },
    {
      id: "2",
      name: "CryptoPulse Tracker",
      link: "https://github.com/dinesh/cryptopulse",
      description:
        "A comprehensive real-time cryptocurrency monitoring dashboard providing live price updates, advanced trend analysis charts, and automated price alerts using WebSockets and React Native.",
    },
  ],
  skills:
    "React Native, React, Node.js, TypeScript, Firebase, AWS, Docker, Kubernetes",
  tools: "VS Code, Git, Figma, Postman, Jira",
  languages: "English, Tamil",
  links: [
    { label: "GitHub", url: "github.com/dinesh" },
    { label: "Portfolio", url: "dinesh.dev" },
  ],
  certifications: [
    { title: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
    { title: "Meta Front-End Developer", issuer: "Coursera", year: "2022" },
  ],
  references: [
    {
      id: "1",
      name: "Aarya Agarwal",
      company: "Arrowwai Industries / CEO",
      phone: "+123-456-7890",
      email: "hello@reallygreatsite",
    },
    {
      id: "2",
      name: "Sharya Singh",
      company: "Arrowwai Industries / CEO",
      phone: "+123-456-7890",
      email: "social: @reallygreatsite",
    },
  ],
};

export default function ManualBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = React.useState<"edit" | "preview" | "history">(
    "preview",
  );
  const [data, setData] = React.useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState("#f59e0b");

  // Version States
  const [versions, setVersions] = React.useState<any[]>([]);
  const [historyList, setHistoryList] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [showVersionDropdown, setShowVersionDropdown] = React.useState(false);

  const fetchVersions = async () => {
    const v = await UserStorage.getResumeVersions();
    setVersions(v);
  };

  const fetchHistory = async () => {
    const h = await UserStorage.getImportHistory();
    setHistoryList(h);
  };

  React.useEffect(() => {
    fetchVersions();
    fetchHistory();
  }, []);

  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) {
      Alert.alert("Name required", "Please enter a name for this version.");
      return;
    }
    try {
      setIsSaving(true);
      
      // 1. Save to Local Versions
      await UserStorage.saveResumeVersion(newVersionName.trim(), data);
      await fetchVersions();
      
      // 2. Save to Main Resumes Store (My Resumes Dashboard)
      const savePayload = {
        name: newVersionName.trim(),
        role: data.title || "Resume",
        template: selectedTemplate,
        color: primaryColor,
        data: data,
      };

      const result = await saveResume(savePayload, loadedResumeId || undefined);
      
      if (result.success) {
        // If it was a new resume created, find it and set loadedResumeId
        const list = await getResumes();
        const match = list.find(r => r.name === newVersionName.trim());
        if (match) {
          setLoadedResumeId(match.id);
        }
        
        setShowSaveModal(false);
        setNewVersionName("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved Successfully", "Your resume has been saved to My Resumes and is accessible on the dashboard.");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSave = async () => {
    if (!loadedResumeId) {
      // If there's no loaded ID, prompt them for a name by opening the save modal
      setShowSaveModal(true);
      return;
    }
    
    try {
      setIsSaving(true);
      // Retrieve the current name of the loaded resume so we keep it
      const list = await getResumes();
      const loaded = list.find((r) => r.id === loadedResumeId);
      const nameOfDraft = loaded ? loaded.name : "My Resume Draft";

      // Save to main Resumes Store
      const result = await saveResume({
        name: nameOfDraft,
        role: data.title || "Resume",
        template: selectedTemplate,
        color: primaryColor,
        data: data,
      }, loadedResumeId);

      if (result.success) {
        // Also save to version tracking in the background
        try {
          await UserStorage.saveResumeVersion(nameOfDraft, data);
          await fetchVersions();
        } catch (vErr) {
          console.warn("Version save background error:", vErr);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Draft Saved", "Successfully saved changes to My Resumes draft!");
      } else {
        Alert.alert("Failed to Save", result.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
          },
        },
      ],
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
          },
        },
      ],
    );
  };

  React.useEffect(() => {
    const loadProfileData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Pre-populate with auth data first
        setData((prev) => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
          photo: user.photoURL || undefined,
        }));

        // Fetch Firestore profile data
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profile = docSnap.data();
            setData((prev) => ({
              ...prev,
              name: profile.name || prev.name,
              phone: profile.phone || prev.phone,
              location: profile.location || prev.location,
              website: profile.portfolio || prev.website,
            }));
          }
        } catch (error) {
          console.warn("Error loading user profile in manual.tsx:", error);
        }
      }
    };
    loadProfileData();
  }, []);

  const { importData, initialData, templateId: initialTemplateId, resumeId } = useLocalSearchParams<{
    importData?: string;
    initialData?: string;
    templateId?: string;
    resumeId?: string;
  }>();
  const [selectedTemplate, setSelectedTemplate] = React.useState(
    initialTemplateId || "Elder-1",
  );
  const [loadedResumeId, setLoadedResumeId] = React.useState<string | null>(resumeId || null);

  const limits = React.useMemo(() => getLimits(selectedTemplate), [selectedTemplate]);

  // Unified initial load effect (Resume ID, search params or draft fallback)
  React.useEffect(() => {
    const initializeData = async () => {
      try {
        // Case 1: Active resumeId passed (Dashboard card click)
        if (resumeId) {
          const list = await getResumes();
          const found = list.find((r) => r.id === resumeId);
          if (found) {
            setData(found.data);
            if (found.color) setPrimaryColor(found.color);
            if (found.template) setSelectedTemplate(initialTemplateId || found.template);
            setLoadedResumeId(found.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
        }

        // Case 2: Import data or Initial data passed (AI or JSON import)
        if (importData || initialData) {
          if (initialTemplateId) {
            setSelectedTemplate(initialTemplateId);
          }
          return;
        }

        // Case 3: No active override parameters -> Load local builder draft!
        const rawDraft = await AsyncStorage.getItem("manual_resume_draft");
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.data) setData(draft.data);
          if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
          setSelectedTemplate(initialTemplateId || draft.selectedTemplate || "Elder-1");
          if (draft.loadedResumeId) setLoadedResumeId(draft.loadedResumeId);
          console.log("Auto-save draft loaded successfully!");
        } else if (initialTemplateId) {
          setSelectedTemplate(initialTemplateId);
        }
      } catch (err) {
        console.error("Error initializing builder data:", err);
      }
    };
    initializeData();
  }, [resumeId, importData, initialData, initialTemplateId]);

  // Auto-save draft effect to preserve workspace edits in real-time
  React.useEffect(() => {
    const saveDraftObj = async () => {
      try {
        const draftObj = {
          data,
          selectedTemplate,
          primaryColor,
          loadedResumeId,
        };
        await AsyncStorage.setItem("manual_resume_draft", JSON.stringify(draftObj));
      } catch (err) {
        console.error("Error autosaving draft:", err);
      }
    };
    
    // Only save if data exists and is modified beyond empty initial data
    if (data && (data.name || data.experience?.length > 0 || data.education?.length > 0)) {
      const timer = setTimeout(saveDraftObj, 800); // 800ms debounce
      return () => clearTimeout(timer);
    }
  }, [data, selectedTemplate, primaryColor, loadedResumeId]);

  React.useEffect(() => {
    const rawData = importData || initialData;
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        
        setData((prev) => {
          const name = parsed.name || prev.name;
          const title = parsed.role || parsed.title || prev.title;
          const summary = parsed.summary || prev.summary;

          // Map experience safely
          let experience = prev.experience;
          if (parsed.experience) {
            const expArray = Array.isArray(parsed.experience) 
              ? parsed.experience 
              : [parsed.experience];
            experience = expArray.map((e: any) => ({
              id: e.id || Math.random().toString(36).substr(2, 9),
              company: e.company || "",
              role: e.role || e.title || "",
              period: e.period || e.duration || e.year || "2023 - Present",
              description: e.description || "",
            }));
          }

          // Map education safely
          let education = prev.education;
          if (parsed.education) {
            const eduArray = Array.isArray(parsed.education) 
              ? parsed.education 
              : [parsed.education];
            education = eduArray.map((e: any) => ({
              id: e.id || Math.random().toString(36).substr(2, 9),
              school: e.school || e.college || e.university || "",
              degree: e.degree || "",
              year: e.year || e.period || "",
              honors: e.honors || "",
            }));
          }

          // Map skills safely (convert array to comma separated string)
          let skills = prev.skills;
          if (parsed.skills) {
            skills = Array.isArray(parsed.skills)
              ? parsed.skills.join(", ")
              : parsed.skills;
          }

          // Map projects safely
          let projects = prev.projects;
          if (parsed.projects) {
            const projArray = Array.isArray(parsed.projects)
              ? parsed.projects
              : [parsed.projects];
            projects = projArray.map((p: any) => ({
              id: p.id || Math.random().toString(36).substr(2, 9),
              name: p.name || p.title || "",
              description: p.description || "",
              link: p.link || "",
            }));
          }

          // Map certifications safely
          let certifications = prev.certifications;
          if (parsed.certifications) {
            const certArray = Array.isArray(parsed.certifications)
              ? parsed.certifications
              : [parsed.certifications];
            certifications = certArray.map((c: any) => {
              if (typeof c === 'string') {
                return { title: c, issuer: "Certification", year: "" };
              }
              return {
                title: c.title || "",
                issuer: c.issuer || "",
                year: c.year || "",
              };
            });
          }

          return {
            ...prev,
            name,
            title,
            summary,
            experience,
            education,
            skills,
            projects,
            certifications,
            phone: parsed.phone || prev.phone,
            website: parsed.website || parsed.portfolio || prev.website,
            location: parsed.location || prev.location,
            email: parsed.email || prev.email,
            tools: parsed.tools || prev.tools,
            languages: parsed.languages || prev.languages,
            interests: parsed.interests || prev.interests,
          };
        });

        // Save entry to import history
        const label = initialData ? "Video AI Sync" : "Smart JSON Import";
        const entryName = `${label} (${parsed.role || parsed.title || "Resume"})`;
        UserStorage.saveImportHistory(entryName, parsed).then(() => {
          fetchHistory();
        }).catch(err => console.warn("Save history error:", err));

        // Switch to editor tab to show the imported data
        setActiveTab("edit");
        
        // Clear params to avoid re-importing on refresh
        router.setParams({ importData: undefined, initialData: undefined });
        Alert.alert(
          "Import Successful",
          "Video AI generated details have been successfully synced into your Canva editor!"
        );
      } catch (e) {
        console.error("AI Data Import error:", e);
      }
    }
  }, [importData, initialData]);

  const THEME_COLORS = [
    "#1e293b",
    "#0f172a",
    "#3b82f6",
    "#d946ef",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  const set = React.useCallback(
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
      setData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleOptimize = React.useCallback(() => {
    setData((prev) => ({
      ...prev,
      name: prev.name.slice(0, limits.name),
      title: prev.title.slice(0, limits.title),
      email: prev.email.slice(0, limits.email),
      phone: prev.phone.slice(0, limits.phone),
      location: prev.location.slice(0, limits.location),
      website: (prev.website || "").slice(0, limits.website),
      summary: prev.summary.slice(0, limits.summary),
      experience: prev.experience.map((exp) => ({
        ...exp,
        company: exp.company.slice(0, limits.company),
        role: exp.role.slice(0, limits.role),
        period: exp.period.slice(0, limits.period),
        description: exp.description.slice(0, limits.description),
      })),
      projects: prev.projects.map((proj) => ({
        ...proj,
        name: proj.name.slice(0, limits.projectName),
        link: proj.link.slice(0, limits.projectLink),
        description: proj.description.slice(0, limits.projectDesc),
      })),
      education: prev.education.map((edu) => ({
        ...edu,
        school: edu.school.slice(0, limits.school),
        degree: edu.degree.slice(0, limits.degree),
        year: edu.year.slice(0, limits.year),
      })),
      skills: prev.skills.slice(0, limits.skills),
      languages: prev.languages.slice(0, limits.languages),
      references: (prev.references || []).map((ref) => ({
        ...ref,
        name: ref.name.slice(0, limits.refName),
        company: ref.company.slice(0, limits.refCompany),
        phone: ref.phone.slice(0, limits.refPhone),
        email: ref.email.slice(0, limits.refEmail),
      })),
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Content Optimized", `All fields have been matched to the optimal character limits for ${selectedTemplate}.`);
  }, [limits, selectedTemplate]);

  const setEdu = React.useCallback(
    (id: string, key: keyof Education, value: string) =>
      setData((prev) => ({
        ...prev,
        education: prev.education.map((e, index) =>
          (e.id === id || (!e.id && index.toString() === id)) ? { ...e, [key]: value } : e
        ),
      })),
    [],
  );

  const addEdu = React.useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        education: [
          ...prev.education,
          {
            id: Date.now().toString(),
            school: "",
            degree: "",
            year: "",
            honors: "",
          },
        ],
      })),
    [],
  );

  const removeEdu = React.useCallback(
    (id: string) =>
      setData((prev) => ({
        ...prev,
        education: prev.education.filter((e, index) => e.id !== id && (!e.id ? index.toString() !== id : true)),
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

  const setRef = React.useCallback(
    (id: string, key: keyof Reference, value: string) =>
      setData((prev) => ({
        ...prev,
        references: (prev.references || []).map((r) =>
          r.id === id ? { ...r, [key]: value } : r,
        ),
      })),
    [],
  );

  const addRef = React.useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        references: [
          ...(prev.references || []),
          {
            id: Date.now().toString(),
            name: "",
            company: "",
            phone: "",
            email: "",
          },
        ],
      })),
    [],
  );

  const removeRef = React.useCallback(
    (id: string) =>
      setData((prev) => ({
        ...prev,
        references: (prev.references || []).filter((r) => r.id !== id),
      })),
    [],
  );

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      const html = generateResumeHtml(
        data,
        selectedTemplate,
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

      const fileName = `Resume_${data.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });

      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(newPath);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1,
              type: "application/pdf",
            },
          );
        } catch (launcherErr) {
          console.log(
            "IntentLauncher failed, falling back to sharing",
            launcherErr,
          );
          await Sharing.shareAsync(newPath, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
            dialogTitle: "Download Resume",
          });
        }
      } else {
        await Sharing.shareAsync(newPath, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: "Download Resume",
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [enhancingField, setEnhancingField] = React.useState<string | null>(
    null,
  );

  const handleEnhance = async (
    text: string,
    fieldId: string,
    type: string,
    onUpdate: (newText: string) => void,
  ) => {
    if (!text || text.trim().length < 5) {
      Alert.alert("Text too short", "Please enter more content to enhance.");
      return;
    }

    try {
      setEnhancingField(fieldId);
      const messages = [
        {
          role: "system" as const,
          content:
            "You are an expert resume writer. Fix grammar, improve vocabulary, and make the text more professional. Keep it concise and impactful. Return ONLY the improved text, no extra commentary.",
        },
        {
          role: "user" as const,
          content: `Enhance this ${type}: ${text}`,
        },
      ];

      const result = await callAI(messages, { jsonMode: false });
      if (result) {
        onUpdate(result.trim().replace(/^"|"$/g, ""));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "AI Enhancement Failed",
        "There was an error processing your request. Please try again.",
      );
    } finally {
      setEnhancingField(null);
    }
  };

  const handleLoadHistory = (item: any) => {
    Alert.alert(
      "Load History Entry",
      `Overwrite current workspace content with data from "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: () => {
            const parsed = item.data;
            setData((prev) => {
              const name = parsed.name || prev.name;
              const title = parsed.role || parsed.title || prev.title;
              const summary = parsed.summary || prev.summary;

              // Map experience safely
              let experience = prev.experience;
              if (parsed.experience) {
                const expArray = Array.isArray(parsed.experience) 
                  ? parsed.experience 
                  : [parsed.experience];
                experience = expArray.map((e: any) => ({
                  id: e.id || Math.random().toString(36).substr(2, 9),
                  company: e.company || "",
                  role: e.role || e.title || "",
                  period: e.period || e.duration || e.year || "2023 - Present",
                  description: e.description || "",
                }));
              }

              // Map education safely
              let education = prev.education;
              if (parsed.education) {
                const eduArray = Array.isArray(parsed.education) 
                  ? parsed.education 
                  : [parsed.education];
                education = eduArray.map((e: any) => ({
                  id: e.id || Math.random().toString(36).substr(2, 9),
                  school: e.school || e.college || e.university || "",
                  degree: e.degree || "",
                  year: e.year || e.period || "",
                  honors: e.honors || "",
                }));
              }

              // Map skills safely (convert array to comma separated string)
              let skills = prev.skills;
              if (parsed.skills) {
                skills = Array.isArray(parsed.skills)
                  ? parsed.skills.join(", ")
                  : parsed.skills;
              }

              // Map projects safely
              let projects = prev.projects;
              if (parsed.projects) {
                const projArray = Array.isArray(parsed.projects)
                  ? parsed.projects
                  : [parsed.projects];
                projects = projArray.map((p: any) => ({
                  id: p.id || Math.random().toString(36).substr(2, 9),
                  name: p.name || p.title || "",
                  description: p.description || "",
                  link: p.link || "",
                }));
              }

              // Map certifications safely
              let certifications = prev.certifications;
              if (parsed.certifications) {
                const certArray = Array.isArray(parsed.certifications)
                  ? parsed.certifications
                  : [parsed.certifications];
                certifications = certArray.map((c: any) => {
                  if (typeof c === 'string') {
                    return { title: c, issuer: "Certification", year: "" };
                  }
                  return {
                    title: c.title || "",
                    issuer: c.issuer || "",
                    year: c.year || "",
                  };
                });
              }

              return {
                ...prev,
                name,
                title,
                summary,
                experience,
                education,
                skills,
                projects,
                certifications,
                phone: parsed.phone || prev.phone,
                website: parsed.website || parsed.portfolio || prev.website,
                location: parsed.location || prev.location,
                email: parsed.email || prev.email,
                tools: parsed.tools || prev.tools,
                languages: parsed.languages || prev.languages,
                interests: parsed.interests || prev.interests,
              };
            });
            setActiveTab("edit");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all historical import entries?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await UserStorage.clearImportHistory();
            await fetchHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const renderHistoryView = () => {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 }}>
        {/* Header Title Block */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
            Import History
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
            Restore your latest 4 imports from Video AI sessions or custom JSON payloads. Restoring will overwrite the current editor content.
          </Text>
        </View>

        {historyList.length === 0 ? (
          <View
            style={{
              paddingVertical: 40,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <History size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center" }}>
              No History Recorded Yet
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 16 }}>
              Sync a Video AI session or paste an import JSON payload to see your records here!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {historyList.map((item, index) => (
              <View
                key={item.id || index}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.card,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: Theme.colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <History size={16} color={Theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                      {item.date}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleLoadHistory(item)}
                    style={{
                      flex: 2,
                      backgroundColor: Theme.colors.primary,
                      height: 38,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                      Restore Entry
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleClearHistory}
              style={{
                marginTop: 15,
                borderColor: colors.glassBorder,
                borderWidth: 1,
                borderRadius: 14,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 13 }}>
                Clear All Import History
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const previewHtml = React.useMemo(
    () =>
      generateResumeHtml(data, selectedTemplate, primaryColor, "Inter", false),
    [data, primaryColor, selectedTemplate],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.glassBorder,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
              },
            ]}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Elite Studio
            </Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.liveIndicator} />
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Auto-syncing to PDF •{" "}
                {AVAILABLE_TEMPLATES.find((t) => t.id === selectedTemplate)
                  ?.name || selectedTemplate}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleQuickSave}
            disabled={isSaving}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
              },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Save size={18} color={colors.text} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadPDF}
            disabled={isGenerating}
            style={[
              styles.backBtn,
              {
                backgroundColor: Theme.colors.primary + "15",
              },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Download size={20} color={Theme.colors.primary} />
            )}
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
          <View style={styles.editorSection}>
            <TouchableOpacity
              onPress={handleOptimize}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: Theme.colors.primary + "10",
                  borderColor: Theme.colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 15,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Theme.colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Zap size={20} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                    Smart Content Optimizer
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Auto-fit all content to template limits
                  </Text>
                </View>
              </View>
              <ArrowLeft size={18} color={Theme.colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Version Management Section */}
          <View style={styles.editorSection}>
            <View style={styles.versionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Resume Versions
              </Text>
              <View style={styles.versionActions}>
                <TouchableOpacity
                  onPress={() => setShowVersionDropdown(!showVersionDropdown)}
                  style={[
                    styles.dropdownBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                >
                  <FolderOpen size={16} color={Theme.colors.primary} />
                  <Text
                    style={[styles.dropdownBtnText, { color: colors.text }]}
                  >
                    Load Version
                  </Text>
                  <ChevronDown size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSaveModal(true)}
                  style={[
                    styles.saveVersionIconBtn,
                    { backgroundColor: Theme.colors.primary + "15" },
                  ]}
                >
                  <Save size={18} color={Theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {showVersionDropdown && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                {versions.length === 0 ? (
                  <Text
                    style={[styles.emptyVersions, { color: colors.textMuted }]}
                  >
                    No saved versions yet (Max 3)
                  </Text>
                ) : (
                  versions.map((v) => (
                    <TouchableOpacity
                      key={v.name}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: colors.glassBorder },
                      ]}
                      onPress={() => handleLoadVersion(v)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.versionName, { color: colors.text }]}
                        >
                          {v.name}
                        </Text>
                        <Text
                          style={[
                            styles.versionDate,
                            { color: colors.textMuted },
                          ]}
                        >
                          Saved {new Date(v.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteVersion(v.name)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Elite Theme
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                  flexDirection: "row",
                  gap: 12,
                  flexWrap: "wrap",
                },
              ]}
            >
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
                    primaryColor === color && styles.activeColorCircle,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Details
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Field
                label="Full Name"
                value={data.name}
                onChange={(v: string) => set("name", v)}
                colors={colors}
                maxLength={limits.name}
              />
              <Field
                label="Headline"
                value={data.title}
                onChange={(v: string) => set("title", v)}
                colors={colors}
                maxLength={limits.title}
              />
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Email"
                    value={data.email}
                    onChange={(v: string) => set("email", v)}
                    keyboardType="email-address"
                    colors={colors}
                    maxLength={limits.email}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="Phone"
                    value={data.phone}
                    onChange={(v: string) => set("phone", v)}
                    keyboardType="phone-pad"
                    colors={colors}
                    maxLength={limits.phone}
                  />
                </View>
              </View>
              <Field
                label="Location"
                value={data.location}
                onChange={(v: string) => set("location", v)}
                colors={colors}
                maxLength={limits.location}
              />
              <Field
                label="Website / Portfolio"
                value={data.website || ""}
                onChange={(v: string) => set("website", v)}
                colors={colors}
                maxLength={limits.website}
              />
              <Field
                label="Summary"
                value={data.summary}
                onChange={(v: string) => set("summary", v)}
                multiline
                colors={colors}
                onEnhance={() =>
                  handleEnhance(
                    data.summary,
                    "summary",
                    "professional summary",
                    (v) => set("summary", v),
                  )
                }
                isEnhancing={enhancingField === "summary"}
                maxLength={limits.summary}
              />
            </View>
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Work Experience
              </Text>
              <TouchableOpacity onPress={addExp} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {data.experience.map((exp, idx) => (
              <View
                key={exp.id}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardTop,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                >
                  <Text style={styles.cardIndex}>Experience #{idx + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeExp(exp.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field
                  label="Company"
                  value={exp.company}
                  onChange={(v: string) => setExp(exp.id, "company", v)}
                  colors={colors}
                  maxLength={limits.company}
                />
                <Field
                  label="Role"
                  value={exp.role}
                  onChange={(v: string) => setExp(exp.id, "role", v)}
                  colors={colors}
                  maxLength={limits.role}
                />
                <Field
                  label="Duration"
                  value={exp.period}
                  onChange={(v: string) => setExp(exp.id, "period", v)}
                  colors={colors}
                  maxLength={limits.period}
                />
                <Field
                  label="Description"
                  value={exp.description}
                  onChange={(v: string) => setExp(exp.id, "description", v)}
                  multiline
                  colors={colors}
                  onEnhance={() =>
                    handleEnhance(
                      exp.description,
                      `exp-${exp.id}`,
                      "job description",
                      (v) => setExp(exp.id, "description", v),
                    )
                  }
                  isEnhancing={enhancingField === `exp-${exp.id}`}
                  maxLength={limits.description}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Personal Projects
              </Text>
              <TouchableOpacity onPress={addProj} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add Project</Text>
              </TouchableOpacity>
            </View>

            {data.projects.map((proj, idx) => (
              <View
                key={proj.id}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardTop,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                >
                  <Text style={styles.cardIndex}>Project #{idx + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeProj(proj.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field
                  label="Project Name"
                  value={proj.name}
                  onChange={(v: string) => setProj(proj.id, "name", v)}
                  colors={colors}
                  maxLength={limits.projectName}
                />
                <Field
                  label="Link (GitHub/Live)"
                  value={proj.link}
                  onChange={(v: string) => setProj(proj.id, "link", v)}
                  colors={colors}
                  maxLength={limits.projectLink}
                />
                <Field
                  label="Description"
                  value={proj.description}
                  onChange={(v: string) => setProj(proj.id, "description", v)}
                  multiline
                  colors={colors}
                  onEnhance={() =>
                    handleEnhance(
                      proj.description,
                      `proj-${proj.id}`,
                      "project description",
                      (v) => setProj(proj.id, "description", v),
                    )
                  }
                  isEnhancing={enhancingField === `proj-${proj.id}`}
                  maxLength={limits.projectDesc}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Education
              </Text>
              <TouchableOpacity onPress={addEdu} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add Education</Text>
              </TouchableOpacity>
            </View>

            {data.education.map((edu, idx) => (
              <View
                key={edu.id || idx}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardTop,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                >
                  <Text style={styles.cardIndex}>Education #{idx + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeEdu(edu.id || idx.toString())}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field
                  label="School / University"
                  value={edu.school}
                  onChange={(v: string) => setEdu(edu.id || idx.toString(), "school", v)}
                  colors={colors}
                  maxLength={limits.school}
                />
                <Field
                  label="Degree / Course"
                  value={edu.degree}
                  onChange={(v: string) => setEdu(edu.id || idx.toString(), "degree", v)}
                  colors={colors}
                  maxLength={limits.degree}
                />
                <Field
                  label="Year / Period"
                  value={edu.year}
                  onChange={(v: string) => setEdu(edu.id || idx.toString(), "year", v)}
                  colors={colors}
                  maxLength={limits.year}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                References
              </Text>
              <TouchableOpacity onPress={addRef} style={styles.addSectionBtn}>
                <Plus size={16} color={Theme.colors.primary} />
                <Text style={styles.addSectionText}>Add Reference</Text>
              </TouchableOpacity>
            </View>

            {(data.references || []).map((ref, idx) => (
              <View
                key={ref.id}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardTop,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                >
                  <Text style={styles.cardIndex}>Reference #{idx + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeRef(ref.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Field
                  label="Name"
                  value={ref.name}
                  onChange={(v: string) => setRef(ref.id, "name", v)}
                  colors={colors}
                  maxLength={limits.refName}
                />
                <Field
                  label="Company / Relation"
                  value={ref.company}
                  onChange={(v: string) => setRef(ref.id, "company", v)}
                  colors={colors}
                  maxLength={limits.refCompany}
                />
                <Field
                  label="Phone"
                  value={ref.phone}
                  onChange={(v: string) => setRef(ref.id, "phone", v)}
                  colors={colors}
                  maxLength={limits.refPhone}
                />
                <Field
                  label="Email / Social"
                  value={ref.email}
                  onChange={(v: string) => setRef(ref.id, "email", v)}
                  colors={colors}
                  maxLength={limits.refEmail}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Skills & Languages
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Field
                label="Skills"
                value={data.skills}
                onChange={(v: string) => set("skills", v)}
                multiline
                colors={colors}
                maxLength={limits.skills}
              />
              <Field
                label="Languages"
                value={data.languages}
                onChange={(v: string) => set("languages", v)}
                colors={colors}
                maxLength={limits.languages}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : activeTab === "preview" ? (
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: isDark ? colors.background : "#fdf2f8" },
          ]}
        >
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={AVAILABLE_TEMPLATES}
            keyExtractor={(item) => item.id}
            initialScrollIndex={
              AVAILABLE_TEMPLATES.findIndex(
                (t) => t.id === selectedTemplate,
              ) !== -1
                ? AVAILABLE_TEMPLATES.findIndex(
                    (t) => t.id === selectedTemplate,
                  )
                : 0
            }
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              if (
                AVAILABLE_TEMPLATES[index] &&
                AVAILABLE_TEMPLATES[index].id !== selectedTemplate
              ) {
                setSelectedTemplate(AVAILABLE_TEMPLATES[index].id);
                Haptics.selectionAsync();
              }
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH }}>
                <View
                  style={[
                    styles.webviewWrapper,
                    { backgroundColor: isDark ? "#1e293b" : "#fff" },
                  ]}
                >
                  {selectedTemplate === item.id ? (
                    <WebView
                      originWhitelist={["*"]}
                      source={{
                        html: generateResumeHtml(
                          data,
                          item.id,
                          primaryColor,
                          "Inter",
                          false,
                        ),
                      }}
                      style={styles.webview}
                      scalesPageToFit={true}
                      scrollEnabled={true}
                      javaScriptEnabled={true}
                      onMessage={async (event) => {
                        try {
                          const payload = JSON.parse(event.nativeEvent.data);
                          if (payload.type === "edit:field" || payload.type === "edit:section") {
                            // 1. Fire medium haptic feedback
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            
                            // 2. Switch tab to editor panel
                            setActiveTab("edit");
                            
                            // 3. Inform user which field was targeted
                            const displayField = payload.field || payload.section || "selected section";
                            const cleanName = displayField.replace(/^(exp-|edu-|proj-)/, "").toUpperCase();
                            
                            Alert.alert(
                              "Focus Visual Area",
                              `Directly editing the "${cleanName}" section. Make your changes in the editor panel!`
                            );
                          }
                        } catch (err) {
                          console.warn("Error parsing WebView interaction message:", err);
                        }
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator
                        size="large"
                        color={Theme.colors.primary}
                      />
                      <Text
                        style={{
                          marginTop: 10,
                          color: colors.textMuted,
                          fontWeight: "600",
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {renderHistoryView()}
        </ScrollView>
      )}

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.glassBorder,
          },
        ]}
      >
        <View
          style={[
            styles.segmentedContainer,
            { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("edit")}
            style={[
              styles.segment,
              activeTab === "edit" && { backgroundColor: Theme.colors.primary },
            ]}
          >
            <Edit2
              size={16}
              color={activeTab === "edit" ? "#fff" : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "edit" ? "#fff" : colors.textMuted },
              ]}
            >
              Editor
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("preview")}
            style={[
              styles.segment,
              activeTab === "preview" && {
                backgroundColor: Theme.colors.primary,
              },
            ]}
          >
            <Eye
              size={16}
              color={activeTab === "preview" ? "#fff" : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "preview" ? "#fff" : colors.textMuted },
              ]}
            >
              Preview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            style={[
              styles.segment,
              activeTab === "history" && {
                backgroundColor: Theme.colors.primary,
              },
            ]}
          >
            <History
              size={16}
              color={activeTab === "history" ? "#fff" : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "history" ? "#fff" : colors.textMuted },
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[styles.bannerContainer, { backgroundColor: colors.background }]}
      >
        <BannerAd
          unitId={bannerId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>



      {/* Save Version Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.saveModal,
              {
                backgroundColor: colors.surface,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Save Current Version
              </Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter a name for this version (e.g. Google Tailored). Max 3
              versions allowed.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.glassBorder,
                },
              ]}
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
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmSaveBtnText}>Save Resume</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  keyboardType,
  colors,
  onEnhance,
  isEnhancing,
  maxLength,
}: any) {
  const charCount = (value || "").length;

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
            {label}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, opacity: 0.7 }}>
            ({charCount}
            {maxLength ? ` / ${maxLength}` : ""})
          </Text>
        </View>
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
                <Text
                  style={[
                    styles.enhanceBtnText,
                    { color: Theme.colors.primary },
                  ]}
                >
                  AI Enhance
                </Text>
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
            color: colors.text,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={maxLength}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
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
  quickSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  quickSaveBtnText: {
    fontWeight: "800",
    fontSize: 13,
  },
  actionFooter: {
    width: "100%",
  },
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
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  enhanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary + "10",
  },
  enhanceBtnText: { fontSize: 10, fontWeight: "800" },
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
    overflow: "hidden",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  bannerContainer: {
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeColorCircle: {
    borderColor: "#fff",
    borderWidth: 3,
  },
  versionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  versionActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownBtnText: { fontSize: 13, fontWeight: "700" },
  saveVersionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownMenu: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  versionName: { fontSize: 14, fontWeight: "700" },
  versionDate: { fontSize: 10, marginTop: 2 },
  emptyVersions: { textAlign: "center", padding: 20, fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  saveModal: { width: "100%", borderRadius: 24, padding: 24, borderWidth: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  confirmSaveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmSaveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  counter: {
    fontSize: 10,
    textAlign: "right",
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 8,
  },
});
