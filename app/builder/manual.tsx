/**
 * manual.tsx
 *
 * 1. WebView preview — pass isPrint=false so the HTML's JS scaler runs inside WebView.
 * 2. PDF — pass isPrint=true so the scaling script is omitted and @page CSS fires.
 * 3. Add/Remove experience entries with the Plus / Trash2 buttons.
 * 4. Education and Contact fields added to the Edit tab.
 * 5. Full Dark Theme support with dynamic colors and Status Bar integration.
 */

import { GlassCard } from "@/components/glass-card";
import { generateResumeHtml } from "@/components/resume-html-generator";
import { getLimits } from "@/constants/limits";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { callAI } from "@/services/ai";
import { auth, db } from "@/services/firebase";
import { UserStorage } from "@/services/storage";
import { getResumes, saveResume } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as IntentLauncher from "expo-intent-launcher";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  Download,
  Edit2,
  Eye,
  FolderOpen,
  GraduationCap,
  Handshake,
  History,
  MessageSquare,
  MoreVertical,
  Palette,
  Plus,
  Redo2,
  Rocket,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  User,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

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
  { id: "Fresher-1", name: "Fresher 1: Bloom" },
  { id: "Fresher-2", name: "Fresher 2: Spark" },
  { id: "Fresher-3", name: "Fresher 3: Rise" },
  { id: "Fresher-4", name: "Fresher 4: Pro" },
  { id: "Fresher-5", name: "Fresher 5: Build" },
  { id: "Rich-1", name: "Rich 1: Classic" },
  { id: "Rich-2", name: "Rich 2: Compact" },
  { id: "Rich-3", name: "Rich 3: Modern" },
  { id: "Rich-4", name: "Rich 4: Grid" },
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
  id?: string;
  school: string;
  degree: string;
  year: string;
  honors: string;
}

interface Project {
  id: string;
  name: string;
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
  id?: string;
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
  tools?: string;
  interests?: string;
  certifications?: any[];
  links?: any[];
}

// We now use getLimits(selectedTemplate) instead of static FIELD_LIMITS

// ─── default data ────────────────────────────────────────────────────────────
const INITIAL_DATA: ResumeData = {
  name: "Jane Doe",
  title: "Professional Title",
  email: "jane.doe@example.com",
  phone: "+1 234 567 8900",
  location: "New York, USA",
  summary:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  experience: [
    {
      id: "1",
      company: "Company Name",
      role: "Job Title",
      period: "2022 – Present",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      id: "2",
      company: "Previous Company",
      role: "Previous Title",
      period: "2019 – 2022",
      description:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ],
  education: [
    {
      id: "1",
      school: "University Name",
      degree: "Degree Name",
      year: "2015 – 2019",
      honors: "Honors/Awards (Optional)",
    },
  ],
  projects: [
    {
      id: "1",
      name: "Project Name",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      id: "2",
      name: "Another Project",
      description:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
  ],
  skills: "Skill 1, Skill 2, Skill 3, Skill 4, Skill 5, Skill 6",
  tools: "Tool 1, Tool 2, Tool 3",
  languages: "English, Spanish",
  links: [
    { label: "LinkedIn", url: "linkedin.com/in/janedoe" },
    { label: "Portfolio", url: "janedoe.com" },
  ],
  certifications: [
    {
      title: "Certification Name",
      issuer: "Issuing Organization",
      year: "2023",
    },
    { title: "Another Certification", issuer: "Organization", year: "2022" },
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
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = React.useState<
    "edit" | "preview" | "history"
  >("preview");
  const [data, setData] = React.useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState("#f59e0b");
  const [loadedResumeId, setLoadedResumeId] = React.useState<string | null>(
    null,
  );

  // Version States
  const [versions, setVersions] = React.useState<any[]>([]);
  const [historyList, setHistoryList] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [showVersionDropdown, setShowVersionDropdown] = React.useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = React.useState(false);

  // Rename States
  const [showRenameModal, setShowRenameModal] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<{ type: 'version'; oldName: string } | { type: 'history'; id: string; oldName: string } | null>(null);
  const [renameText, setRenameText] = React.useState("");

  // Draggable Text States
  const [customTexts, setCustomTexts] = React.useState<
    Array<{ id: string; text: string; x: number; y: number }>
  >([]);
  const [showAddTextModal, setShowAddTextModal] = React.useState(false);
  const [newCustomText, setNewCustomText] = React.useState("");

  const formatVersionDate = (v: any) => {
    if (v.date) return v.date;
    if (v.updatedAt) {
      try {
        const d = new Date(v.updatedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return "Saved version";
  };

  // Editor and History States
  const EDITOR_TABS = [
    { name: "Theme", icon: Palette },
    { name: "Personal", icon: User },
    { name: "Experience", icon: Briefcase },
    { name: "Projects", icon: Rocket },
    { name: "Education", icon: GraduationCap },
    { name: "References", icon: Handshake },
    { name: "Skills", icon: Zap },
    { name: "Tools", icon: Zap },
    { name: "Certificates", icon: Sparkles },
  ];
  const [activeEditorSection, setActiveEditorSection] =
    React.useState("Personal");

  // Per-character undo/redo
  const dataRef = React.useRef(data);
  dataRef.current = data;
  const textUndoStack = React.useRef<Array<{ apply: (v: string) => void; prev: string; next: string }>>([]);
  const textRedoStack = React.useRef<Array<{ apply: (v: string) => void; prev: string; next: string }>>([]);

  const pushTextEdit = React.useCallback((apply: (v: string) => void, prev: string, next: string) => {
    textUndoStack.current.push({ apply, prev, next });
    textRedoStack.current = [];
    if (textUndoStack.current.length > 500) textUndoStack.current.splice(0, 100);
  }, []);

  const applyEdit = (edit: { apply: (v: string) => void; prev: string; next: string }) => {
    edit.apply(edit.prev);
    Haptics.selectionAsync();
  };

  const handleUndo = () => {
    const edit = textUndoStack.current.pop();
    if (edit) {
      textRedoStack.current.push({ apply: edit.apply, prev: edit.next, next: edit.prev });
      applyEdit(edit);
    }
  };

  const handleRedo = () => {
    const edit = textRedoStack.current.pop();
    if (edit) {
      textUndoStack.current.push({ apply: edit.apply, prev: edit.next, next: edit.prev });
      applyEdit(edit);
    }
  };

  React.useEffect(() => {
    if (params?.importData && typeof params.importData === "string") {
      try {
        const parsed = JSON.parse(params.importData);
        setData((prev) => ({
          ...prev,
          ...parsed,
          id: prev.id,
        }));
        router.setParams({ importData: undefined });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.error("Failed to parse importData:", e);
      }
    }
  }, [params?.importData]);

  const handleReset = () => {
    Alert.alert(
      "Reset Layout",
      "Are you sure you want to clear all data and start fresh?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setData(INITIAL_DATA);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  };

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

      const result = await saveResume(
        savePayload as any,
        loadedResumeId || undefined,
      );

      if (result.success) {
        // If it was a new resume created, find it and set loadedResumeId
        const list = await getResumes();
        const match = list.find((r) => r.name === newVersionName.trim());
        if (match) {
          setLoadedResumeId(match.id);
        }

        setShowSaveModal(false);
        setNewVersionName("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Saved Successfully",
          "Your resume has been saved to My Resumes and is accessible on the dashboard.",
        );
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
      const result = await saveResume(
        {
          name: nameOfDraft,
          role: data.title || "Resume",
          template: selectedTemplate,
          color: primaryColor,
          data: data,
        } as any,
        loadedResumeId,
      );

      if (result.success) {
        // Also save to version tracking in the background
        try {
          await UserStorage.saveResumeVersion(nameOfDraft, data);
          await fetchVersions();
        } catch (vErr) {
          console.warn("Version save background error:", vErr);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Draft Saved",
          "Successfully saved changes to My Resumes draft!",
        );
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setData((prev) => ({
          ...prev,
          name:
            prev.name === "Jane Doe"
              ? user.displayName || prev.name
              : prev.name,
          email:
            prev.email === "jane.doe@example.com" ||
            prev.email === "jane.doe@gmail.com"
              ? user.email || prev.email
              : prev.email,
          photo: user.photoURL || prev.photo,
        }));

        const loadProfile = async () => {
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const profile = docSnap.data();
              setData((prev) => ({
                ...prev,
                name:
                  prev.name === "Jane Doe"
                    ? profile.name || prev.name
                    : prev.name,
                email:
                  prev.email === "jane.doe@example.com" ||
                  prev.email === "jane.doe@gmail.com"
                    ? user.email || profile.email || prev.email
                    : prev.email,
                phone:
                  prev.phone === "+1 234 567 8900"
                    ? profile.phone || prev.phone
                    : prev.phone,
                location:
                  prev.location === "New York, USA"
                    ? profile.location || prev.location
                    : prev.location,
                website: !prev.website
                  ? profile.portfolio || prev.website
                  : prev.website,
                title:
                  prev.title === "Professional Title"
                    ? profile.primaryRole ||
                      (profile.jobRoles && profile.jobRoles.length > 0
                        ? profile.jobRoles[0]
                        : prev.title)
                    : prev.title,
                photo: profile.profilePic || prev.photo,
              }));
            }
          } catch (error) {
            console.warn("Error loading user profile in manual.tsx:", error);
          }
        };
        loadProfile();
      }
    });
    return unsubscribe;
  }, []);

  const {
    importData,
    initialData,
    templateId: initialTemplateId,
    resumeId,
  } = useLocalSearchParams<{
    importData?: string;
    initialData?: string;
    templateId?: string;
    resumeId?: string;
  }>();
  const [selectedTemplate, setSelectedTemplate] = React.useState(
    initialTemplateId || "Elder-1",
  );
  const skipDraftLoad = React.useRef(false);
  if (importData || initialData) {
    skipDraftLoad.current = true;
  }

  const limits = React.useMemo(
    () => getLimits(selectedTemplate),
    [selectedTemplate],
  );

  // Unified initial load effect (Resume ID, search params or draft fallback)
  React.useEffect(() => {
    const initializeData = async () => {
      try {
        // Case 1: Active resumeId passed (Dashboard card click)
        if (resumeId) {
          const list = await getResumes();
          const found = list.find((r) => r.id === resumeId);
          if (found) {
            const resumeData = found.data as any;
            setData({
              ...resumeData,
              location: resumeData.location || "",
              languages: resumeData.languages || "",
            });
            if (found.color) setPrimaryColor(found.color);
            if (found.template)
              setSelectedTemplate(initialTemplateId || found.template);
            setLoadedResumeId(found.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
        }

        // Case 2: Import data or Initial data passed (AI or JSON import)
        if (importData || initialData || skipDraftLoad.current) {
          if (initialTemplateId) {
            setSelectedTemplate(initialTemplateId);
          }
          return;
        }

        // Case 3: No active override parameters -> Load local builder draft!
        const user = auth.currentUser;
        const draftKey = user
          ? `manual_resume_draft_${user.uid}`
          : "manual_resume_draft";
        const rawDraft = await AsyncStorage.getItem(draftKey);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.data) setData(draft.data);
          if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
          setSelectedTemplate(
            initialTemplateId || draft.selectedTemplate || "Elder-1",
          );
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
        const user = auth.currentUser;
        const draftKey = user
          ? `manual_resume_draft_${user.uid}`
          : "manual_resume_draft";
        await AsyncStorage.setItem(draftKey, JSON.stringify(draftObj));
      } catch (err) {
        console.error("Error autosaving draft:", err);
      }
    };

    // Only save if data exists and is modified beyond empty initial data
    if (
      data &&
      (data.name || data.experience?.length > 0 || data.education?.length > 0)
    ) {
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

          // Map tools safely (convert array to comma separated string)
          let tools = prev.tools;
          if (parsed.tools) {
            tools = Array.isArray(parsed.tools)
              ? parsed.tools.join(", ")
              : parsed.tools;
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
            }));
          }

          // Map certifications safely
          let certifications = prev.certifications;
          if (parsed.certifications) {
            const certArray = Array.isArray(parsed.certifications)
              ? parsed.certifications
              : [parsed.certifications];
            certifications = certArray.map((c: any) => {
              if (typeof c === "string") {
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
            tools,
            languages: parsed.languages || prev.languages,
            interests: parsed.interests || prev.interests,
          };
        });

        // Save entry to import history
        const label = initialData ? "Video AI Sync" : "Smart JSON Import";
        const entryName = `${label} (${parsed.role || parsed.title || "Resume"})`;
        UserStorage.saveImportHistory(entryName, parsed)
          .then(() => {
            fetchHistory();
          })
          .catch((err) => console.warn("Save history error:", err));

        // Switch to editor tab to show the imported data
        setActiveTab("edit");

        // Clear params to avoid re-importing on refresh
        router.setParams({ importData: undefined, initialData: undefined });
        Alert.alert(
          "Import Successful",
          "Video AI generated details have been successfully synced into your Canva editor!",
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
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
      if (typeof value === 'string') {
        const prev = (dataRef.current[key] as string) ?? '';
        if (prev !== value) {
          pushTextEdit(
            (v: string) => setData((prev) => ({ ...prev, [key]: v })),
            prev,
            value,
          );
        }
      }
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [pushTextEdit],
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
    Alert.alert(
      "Content Optimized",
      `All fields have been matched to the optimal character limits for ${selectedTemplate}.`,
    );
  }, [limits, selectedTemplate]);

  const setEdu = React.useCallback(
    (id: string, key: keyof Education, value: string) => {
      const prev = dataRef.current.education.find(
        (e, index) => e.id === id || (!e.id && index.toString() === id),
      )?.[key] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => ({
            ...prev,
            education: prev.education.map((e, index) =>
              e.id === id || (!e.id && index.toString() === id)
                ? { ...e, [key]: v }
                : e,
            ),
          })),
          prev,
          value,
        );
      }
      setData((prev) => ({
        ...prev,
        education: prev.education.map((e, index) =>
          e.id === id || (!e.id && index.toString() === id)
            ? { ...e, [key]: value }
            : e,
        ),
      }));
    },
    [pushTextEdit],
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
        education: prev.education.filter(
          (e, index) => e.id !== id && (!e.id ? index.toString() !== id : true),
        ),
      })),
    [],
  );

  const setExp = React.useCallback(
    (id: string, key: keyof Experience, value: string) => {
      const prev = dataRef.current.experience.find((e) => e.id === id)?.[key] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => ({
            ...prev,
            experience: prev.experience.map((e) =>
              e.id === id ? { ...e, [key]: v } : e,
            ),
          })),
          prev,
          value,
        );
      }
      setData((prev) => ({
        ...prev,
        experience: prev.experience.map((e) =>
          e.id === id ? { ...e, [key]: value } : e,
        ),
      }));
    },
    [pushTextEdit],
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
    (id: string, key: keyof Project, value: string) => {
      const prev = dataRef.current.projects.find((p) => p.id === id)?.[key] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => ({
            ...prev,
            projects: prev.projects.map((p) =>
              p.id === id ? { ...p, [key]: v } : p,
            ),
          })),
          prev,
          value,
        );
      }
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === id ? { ...p, [key]: value } : p,
        ),
      }));
    },
    [pushTextEdit],
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
    (id: string, key: keyof Reference, value: string) => {
      const prev = (dataRef.current.references || []).find((r) => r.id === id)?.[key] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => ({
            ...prev,
            references: (prev.references || []).map((r) =>
              r.id === id ? { ...r, [key]: v } : r,
            ),
          })),
          prev,
          value,
        );
      }
      setData((prev) => ({
        ...prev,
        references: (prev.references || []).map((r) =>
          r.id === id ? { ...r, [key]: value } : r,
        ),
      }));
    },
    [pushTextEdit],
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

  const setCert = React.useCallback(
    (idx: number, key: string, value: string) => {
      const certs = dataRef.current.certifications || [];
      const prev = certs[idx]?.[key as keyof typeof certs[0]] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => {
            const certs = [...(prev.certifications || [])];
            if (certs[idx]) certs[idx] = { ...certs[idx], [key]: v };
            return { ...prev, certifications: certs };
          }),
          prev,
          value,
        );
      }
      setData((prev) => {
        const certs = [...(prev.certifications || [])];
        if (certs[idx]) certs[idx] = { ...certs[idx], [key]: value };
        return { ...prev, certifications: certs };
      });
    },
    [pushTextEdit],
  );

  const addCert = React.useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        certifications: [
          ...(prev.certifications || []),
          { title: "", issuer: "", year: "" },
        ],
      })),
    [],
  );

  const removeCert = React.useCallback(
    (idx: number) =>
      setData((prev) => ({
        ...prev,
        certifications: (prev.certifications || []).filter((_, i) => i !== idx),
      })),
    [],
  );

  const setLinkVal = React.useCallback(
    (idx: number, key: string, value: string) => {
      const links = dataRef.current.links || [];
      const prev = links[idx]?.[key as keyof typeof links[0]] ?? '';
      if (prev !== value) {
        pushTextEdit(
          (v: string) => setData((prev) => {
            const links = [...(prev.links || [])];
            if (links[idx]) links[idx] = { ...links[idx], [key]: v };
            return { ...prev, links };
          }),
          prev,
          value,
        );
      }
      setData((prev) => {
        const links = [...(prev.links || [])];
        if (links[idx]) links[idx] = { ...links[idx], [key]: value };
        return { ...prev, links };
      });
    },
    [pushTextEdit],
  );

  const addLinkVal = React.useCallback(
    () =>
      setData((prev) => ({
        ...prev,
        links: [
          ...(prev.links || []),
          { label: "", url: "" },
        ],
      })),
    [],
  );

  const removeLinkVal = React.useCallback(
    (idx: number) =>
      setData((prev) => ({
        ...prev,
        links: (prev.links || []).filter((_, i) => i !== idx),
      })),
    [],
  );

  // Section Visibility State
  const [hiddenSections, setHiddenSections] = React.useState<
    Record<string, boolean>
  >({});

  const toggleSectionVisibility = (sectionKey: string) => {
    setHiddenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getRenderData = React.useCallback((): ResumeData => {
    return {
      ...data,
      experience:
        hiddenSections.experience ||
        !data.experience ||
        data.experience.length === 0
          ? []
          : data.experience,
      projects:
        hiddenSections.projects || !data.projects || data.projects.length === 0
          ? []
          : data.projects,
      education:
        hiddenSections.education ||
        !data.education ||
        data.education.length === 0
          ? []
          : data.education,
      references:
        hiddenSections.references ||
        !data.references ||
        data.references.length === 0
          ? []
          : data.references,
      skills:
        hiddenSections.skills || !data.skills || data.skills.trim() === ""
          ? ""
          : data.skills,
      languages:
        hiddenSections.languages ||
        !data.languages ||
        data.languages.trim() === ""
          ? ""
          : data.languages,
      tools:
        hiddenSections.tools || !data.tools || data.tools.trim() === ""
          ? ""
          : data.tools,
      certifications:
        hiddenSections.certifications ||
        !data.certifications ||
        data.certifications.length === 0
          ? []
          : data.certifications,
      links:
        hiddenSections.links ||
        !data.links ||
        data.links.length === 0
          ? []
          : data.links,
    };
  }, [data, hiddenSections]);

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      const html = generateResumeHtml(
        getRenderData(),
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
                }));
              }

              // Map certifications safely
              let certifications = prev.certifications;
              if (parsed.certifications) {
                const certArray = Array.isArray(parsed.certifications)
                  ? parsed.certifications
                  : [parsed.certifications];
                certifications = certArray.map((c: any) => {
                  if (typeof c === "string") {
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

  const handleDeleteHistory = async (id: string, name: string) => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete "${name}" from your import history?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await UserStorage.deleteImportHistory(id);
            await fetchHistory();
          },
        },
      ],
    );
  };

  const handleRenameVersion = (oldName: string) => {
    setRenameTarget({ type: 'version', oldName });
    setRenameText(oldName);
    setShowRenameModal(true);
  };

  const handleRenameHistory = (id: string, oldName: string) => {
    setRenameTarget({ type: 'history', id, oldName });
    setRenameText(oldName);
    setShowRenameModal(true);
  };

  const handleConfirmRename = async () => {
    if (!renameTarget || !renameText.trim()) return;
    try {
      if (renameTarget.type === 'version') {
        await UserStorage.renameResumeVersion(renameTarget.oldName, renameText.trim());
        await fetchVersions();
      } else {
        await UserStorage.renameImportHistory(renameTarget.id, renameText.trim());
        await fetchHistory();
      }
      setShowRenameModal(false);
      setRenameTarget(null);
      setRenameText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Rename Error", "Could not rename the entry.");
    }
  };

  const renderHistoryView = () => {
    return (
      <View
        style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* ── Page Header ─────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            paddingHorizontal: 4,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: Theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <History size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: colors.text,
                letterSpacing: -0.3,
              }}
            >
              History & Versions
            </Text>
            <Text
              style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}
            >
              Restore imports or load saved versions
            </Text>
          </View>
        </View>

        {/* ── Saved Versions Section ─────────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 2,
                  backgroundColor: Theme.colors.primary,
                }}
              />
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: colors.text }}
              >
                Saved Versions
              </Text>
              <View
                style={{
                  backgroundColor: Theme.colors.primary + "20",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: Theme.colors.primary,
                  }}
                >
                  {versions.length}/3
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowSaveModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: Theme.colors.primary + "15",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
              }}
            >
              <Save size={14} color={Theme.colors.primary} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: Theme.colors.primary,
                }}
              >
                Save New
              </Text>
            </TouchableOpacity>
          </View>

          {versions.length === 0 ? (
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                borderStyle: "dashed",
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                paddingVertical: 28,
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={28} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.textMuted,
                }}
              >
                No saved versions yet
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                Tap "Save New" to create up to 3 named snapshots
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {versions.map((v, idx) => (
                <View
                  key={v.name}
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.surface,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: Theme.colors.primary + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: Theme.colors.primary,
                        }}
                      >
                        V{idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {v.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {formatVersionDate(v)}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      borderTopWidth: 1,
                      borderTopColor: colors.glassBorder,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleLoadVersion(v)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 11,
                        borderRightWidth: 1,
                        borderRightColor: colors.glassBorder,
                      }}
                    >
                      <FolderOpen size={14} color={Theme.colors.primary} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: Theme.colors.primary,
                        }}
                      >
                        Load
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRenameVersion(v.name)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 11,
                        borderRightWidth: 1,
                        borderRightColor: colors.glassBorder,
                      }}
                    >
                      <Edit2 size={14} color="#8b5cf6" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#8b5cf6",
                        }}
                      >
                        Rename
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteVersion(v.name)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 11,
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#ef4444",
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Import History Section ─────────────────────────── */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 2,
                  backgroundColor: "#8b5cf6",
                }}
              />
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: colors.text }}
              >
                Import History
              </Text>
              <View
                style={{
                  backgroundColor: "#8b5cf620",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "800", color: "#8b5cf6" }}
                >
                  {historyList.length}
                </Text>
              </View>
            </View>
            {historyList.length > 0 && (
              <TouchableOpacity
                onPress={handleClearHistory}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#ef444430",
                  backgroundColor: "#ef444410",
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "800", color: "#ef4444" }}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {historyList.length === 0 ? (
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                borderStyle: "dashed",
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                paddingVertical: 28,
                alignItems: "center",
                gap: 8,
              }}
            >
              <History size={28} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.textMuted,
                }}
              >
                No import history yet
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                Sync a Video AI session or paste a JSON payload to create
                entries here
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {historyList.map((item, index) => (
                <View
                  key={item.id || index}
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.surface,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: "#8b5cf620",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <History size={17} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {item.date}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#8b5cf615",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: "#8b5cf6",
                        }}
                      >
                        #{index + 1}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      borderTopWidth: 1,
                      borderTopColor: colors.glassBorder,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleLoadHistory(item)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 11,
                        borderRightWidth: 1,
                        borderRightColor: colors.glassBorder,
                        backgroundColor: "#8b5cf608",
                      }}
                    >
                      <History size={14} color="#8b5cf6" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#8b5cf6",
                        }}
                      >
                        Restore
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRenameHistory(item.id, item.name)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 11,
                        borderRightWidth: 1,
                        borderRightColor: colors.glassBorder,
                      }}
                    >
                      <Edit2 size={14} color="#8b5cf6" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#8b5cf6",
                        }}
                      >
                        Rename
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteHistory(item.id, item.name)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 11,
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#ef4444",
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <ArrowLeft size={22} color="#8b5cf6" />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Elite Studio</Text>
            <View style={styles.headerStatusRow}>
              <Text style={styles.headerSub}>
                {AVAILABLE_TEMPLATES.find((t) => t.id === selectedTemplate)
                  ?.name || selectedTemplate}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/builder/voice')}
            style={styles.headerBtn}
          >
            <MessageSquare size={20} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSaveModal(true)}
            style={styles.headerBtn}
          >
            <Save size={18} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownloadPDF}
            disabled={isGenerating}
            style={styles.headerBtn}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Download size={18} color="#8b5cf6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "edit" ? (
        <View style={{ flex: 1 }}>
          {/* Sub-Tabs Header */}
          <View
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.glassBorder,
              backgroundColor: colors.background,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 4, paddingHorizontal: 16 }}
            >
              {EDITOR_TABS.map((tab) => {
                const isActive = activeEditorSection === tab.name;
                return (
                  <TouchableOpacity
                    key={tab.name}
                    onPress={() => setActiveEditorSection(tab.name)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isActive
                        ? Theme.colors.primary + "15"
                        : "transparent",
                    }}
                  >
                    <tab.icon
                      size={15}
                      color={isActive ? Theme.colors.primary : colors.textMuted}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? "800" : "600",
                        color: isActive ? Theme.colors.primary : colors.textMuted,
                      }}
                    >
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── THEME SECTION ── */}
            {activeEditorSection === "Theme" && (
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
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
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: colors.text,
                        }}
                      >
                        Smart Content Optimizer
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Auto-fit all content to template limits
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Version Management Section */}
                <View style={{ marginTop: 20 }}>
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
                        onPress={() =>
                          setShowVersionDropdown(!showVersionDropdown)
                        }
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
                          style={[
                            styles.dropdownBtnText,
                            { color: colors.text },
                          ]}
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
                          style={[
                            styles.emptyVersions,
                            { color: colors.textMuted },
                          ]}
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
                                style={[
                                  styles.versionName,
                                  { color: colors.text },
                                ]}
                              >
                                {v.name}
                              </Text>
                              <Text
                                style={[
                                  styles.versionDate,
                                  { color: colors.textMuted },
                                ]}
                              >
                                Saved {formatVersionDate(v)}
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

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Elite Theme
                </Text>
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.surface,
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

                {/* Section Visibility Controls */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Manage Layout Sections
                </Text>
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.surface,
                      gap: 12,
                    },
                  ]}
                >
                  {[
                    { key: "experience", label: "Work Experience" },
                    { key: "projects", label: "Projects" },
                    { key: "education", label: "Education" },
                    { key: "references", label: "References" },
                    { key: "skills", label: "Skills" },
                    { key: "languages", label: "Languages" },
                    { key: "tools", label: "Tools" },
                    { key: "links", label: "Links" },
                  ].map((sec) => {
                    const isHidden = !!hiddenSections[sec.key];
                    return (
                      <View
                        key={sec.key}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.glassBorder,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: colors.text,
                          }}
                        >
                          {sec.label}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleSectionVisibility(sec.key)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 14,
                            backgroundColor: isHidden
                              ? "#ef444415"
                              : "#10b98115",
                            borderWidth: 1,
                            borderColor: isHidden ? "#ef444450" : "#10b98150",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "800",
                              color: isHidden ? "#ef4444" : "#10b981",
                            }}
                          >
                            {isHidden ? "Hidden" : "Visible"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── PERSONAL SECTION ── */}
            {activeEditorSection === "Personal" && (
              <View style={styles.editorSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Personal Details
                </Text>
                <GlassCard
                  style={[
                    styles.sectionCard,
                    { backgroundColor: colors.surface },
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
                </GlassCard>
              </View>
            )}

            {/* ── EXPERIENCE SECTION ── */}
            {activeEditorSection === "Experience" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Work Experience
                  </Text>
                  <TouchableOpacity
                    onPress={addExp}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add New</Text>
                  </TouchableOpacity>
                </View>

                {data.experience.map((exp, idx) => (
                  <GlassCard
                    key={exp.id}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Experience #{idx + 1}
                      </Text>
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
                  </GlassCard>
                ))}
              </View>
            )}

            {/* ── PROJECTS SECTION ── */}
            {activeEditorSection === "Projects" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Personal Projects
                  </Text>
                  <TouchableOpacity
                    onPress={addProj}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add Project</Text>
                  </TouchableOpacity>
                </View>

                {data.projects.map((proj, idx) => (
                  <GlassCard
                    key={proj.id}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Project #{idx + 1}
                      </Text>
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
                      label="Description"
                      value={proj.description}
                      onChange={(v: string) =>
                        setProj(proj.id, "description", v)
                      }
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
                  </GlassCard>
                ))}
              </View>
            )}

            {/* ── EDUCATION SECTION ── */}
            {activeEditorSection === "Education" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Education
                  </Text>
                  <TouchableOpacity
                    onPress={addEdu}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add Education</Text>
                  </TouchableOpacity>
                </View>

                {data.education.map((edu, idx) => (
                  <GlassCard
                    key={edu.id || idx}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Education #{idx + 1}
                      </Text>
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
                      onChange={(v: string) =>
                        setEdu(edu.id || idx.toString(), "school", v)
                      }
                      colors={colors}
                      maxLength={limits.school}
                    />
                    <Field
                      label="Degree / Course"
                      value={edu.degree}
                      onChange={(v: string) =>
                        setEdu(edu.id || idx.toString(), "degree", v)
                      }
                      colors={colors}
                      maxLength={limits.degree}
                    />
                    <Field
                      label="Year / Period"
                      value={edu.year}
                      onChange={(v: string) =>
                        setEdu(edu.id || idx.toString(), "year", v)
                      }
                      colors={colors}
                      maxLength={limits.year}
                    />
                  </GlassCard>
                ))}
              </View>
            )}

            {/* ── REFERENCES SECTION ── */}
            {activeEditorSection === "References" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    References
                  </Text>
                  <TouchableOpacity
                    onPress={addRef}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add Reference</Text>
                  </TouchableOpacity>
                </View>

                {(data.references || []).map((ref, idx) => (
                  <GlassCard
                    key={ref.id}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Reference #{idx + 1}
                      </Text>
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
                  </GlassCard>
                ))}
              </View>
            )}

            {/* ── SKILLS SECTION ── */}
            {activeEditorSection === "Skills" && (
              <View style={styles.editorSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Skills & Languages
                </Text>
                <GlassCard
                  style={[
                    styles.sectionCard,
                    { backgroundColor: colors.surface },
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
                </GlassCard>
              </View>
            )}

            {/* ── TOOLS SECTION ── */}
            {activeEditorSection === "Tools" && (
              <View style={styles.editorSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Tools & Software
                </Text>
                <GlassCard
                  style={[
                    styles.sectionCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Field
                    label="Tools / Software"
                    value={data.tools || ""}
                    onChange={(v: string) => set("tools", v)}
                    colors={colors}
                    maxLength={limits.tools || 300}
                  />
                </GlassCard>
              </View>
            )}

            {/* ── CERTIFICATES SECTION ── */}
            {activeEditorSection === "Certificates" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Certificates
                  </Text>
                  <TouchableOpacity
                    onPress={addCert}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add Certificate</Text>
                  </TouchableOpacity>
                </View>

                {(data.certifications || []).map((cert, idx) => (
                  <GlassCard
                    key={idx}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Certificate #{idx + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeCert(idx)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Field
                      label="Certificate Title"
                      value={cert.title}
                      onChange={(v: string) => setCert(idx, "title", v)}
                      colors={colors}
                      maxLength={150}
                    />
                    <Field
                      label="Issuing Organization"
                      value={cert.issuer}
                      onChange={(v: string) => setCert(idx, "issuer", v)}
                      colors={colors}
                      maxLength={150}
                    />
                    <Field
                      label="Year"
                      value={cert.year}
                      onChange={(v: string) => setCert(idx, "year", v)}
                      colors={colors}
                      maxLength={10}
                    />
                  </GlassCard>
                ))}
              </View>
            )}

            {/* ── LINKS SECTION ── */}
            {activeEditorSection === "Links" && (
              <View style={styles.editorSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Links & Portfolio
                  </Text>
                  <TouchableOpacity
                    onPress={addLinkVal}
                    style={styles.addSectionBtn}
                  >
                    <Plus size={16} color={Theme.colors.primary} />
                    <Text style={styles.addSectionText}>Add Link</Text>
                  </TouchableOpacity>
                </View>

                {(data.links || []).map((link, idx) => (
                  <GlassCard
                    key={idx}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardTop,
                        { borderBottomColor: Theme.border.color },
                      ]}
                    >
                      <Text style={[styles.cardIndex, { color: colors.text }]}>
                        Link #{idx + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeLinkVal(idx)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Field
                      label="Link Label / Title (e.g. LinkedIn)"
                      value={link.label}
                      onChange={(v: string) => setLinkVal(idx, "label", v)}
                      colors={colors}
                      maxLength={100}
                    />
                    <Field
                      label="URL (e.g. linkedin.com/in/username)"
                      value={link.url}
                      onChange={(v: string) => setLinkVal(idx, "url", v)}
                      colors={colors}
                      maxLength={300}
                      autoCapitalize="none"
                    />
                  </GlassCard>
                ))}
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      ) : activeTab === "preview" ? (
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {customTexts.map((item) => (
            <DraggableText
              key={item.id}
              item={item}
              onDelete={(id: string) => {
                setCustomTexts((prev) => prev.filter((t) => t.id !== id));
              }}
              onUpdatePosition={(id: string, x: number, y: number) => {
                setCustomTexts((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, x, y } : t)),
                );
              }}
            />
          ))}

          {/* Floating Action Bar for Preview Tools */}
          <View
            style={{
              position: "absolute",
              top: 6,
              left: 16,
              right: 16,
              zIndex: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={handleUndo}
                disabled={textUndoStack.current.length === 0}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  opacity: textUndoStack.current.length === 0 ? 0.3 : 1,
                }}
              >
                <Undo2 size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRedo}
                disabled={textRedoStack.current.length === 0}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  opacity: textRedoStack.current.length === 0 ? 0.3 : 1,
                }}
              >
                <Redo2 size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  shadowColor: "#000",
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 2,
                }}
              >
                <RotateCcw size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowOptionsMenu(!showOptionsMenu)}
                style={{
                  backgroundColor: colors.surface,
                  padding: 8,
                  borderRadius: 16,
                  borderWidth: Theme.border.width,
                  borderColor: Theme.border.color,
                  ...Theme.shadow,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MoreVertical size={18} color={colors.text} />
              </TouchableOpacity>

              {showOptionsMenu && (
                <View
                  style={{
                    position: "absolute",
                    top: 45,
                    right: 0,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: Theme.border.width,
                    borderColor: Theme.border.color,
                    ...Theme.shadow,
                    width: 160,
                    overflow: "hidden",
                    zIndex: 50,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setShowOptionsMenu(false);
                      handleQuickSave();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.glassBorder,
                    }}
                  >
                    <Save size={16} color={colors.text} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      Save Draft
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowOptionsMenu(false);
                      handleOptimize();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.glassBorder,
                    }}
                  >
                    <Zap size={16} color={Theme.colors.primary} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      Optimize
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowOptionsMenu(false);
                      handleReset();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                    }}
                  >
                    <RotateCcw size={16} color="#ef4444" />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#ef4444",
                      }}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
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
                    {
                      backgroundColor: colors.background,
                      margin: 0,
                      marginTop: 0,
                      borderRadius: 0,
                      paddingBottom: 120,
                    },
                  ]}
                >
                  <WebView
                    originWhitelist={["*"]}
                    source={{
                      html: generateResumeHtml(
                        getRenderData(),
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
                        if (
                          payload.type === "edit:field" ||
                          payload.type === "edit:section"
                        ) {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Medium,
                          );
                          setActiveTab("edit");
                          const displayField =
                            payload.field ||
                            payload.section ||
                            "selected section";
                          const cleanName = displayField
                            .replace(/^(exp-|edu-|proj-)/, "")
                            .toUpperCase();
                          Alert.alert(
                            "Focus Visual Area",
                            `Directly editing the "${cleanName}" section. Make your changes in the editor panel!`,
                          );
                        }
                      } catch (err) {
                        console.warn(
                          "Error parsing WebView interaction message:",
                          err,
                        );
                      }
                    }}
                  />
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          {renderHistoryView()}
        </ScrollView>
      )}

      {/* Floating Bottom Tab Bar */}
      <View
        style={{
          position: "absolute",
          bottom: Math.max(insets.bottom, 15) + 10,
          left: 30,
          right: 30,
        }}
      >
        <GlassCard style={{ padding: 6, borderRadius: 30 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("edit")}
              style={{
                flex: activeTab === "edit" ? 1.5 : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 24,
                backgroundColor:
                  activeTab === "edit" ? Theme.colors.primary : "transparent",
              }}
            >
              <Edit2
                size={18}
                color={activeTab === "edit" ? "#fff" : colors.textMuted}
              />
              {activeTab === "edit" && (
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}
                >
                  Editor
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("preview")}
              style={{
                flex: activeTab === "preview" ? 1.5 : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 24,
                backgroundColor:
                  activeTab === "preview"
                    ? Theme.colors.primary
                    : "transparent",
              }}
            >
              <Eye
                size={18}
                color={activeTab === "preview" ? "#fff" : colors.textMuted}
              />
              {activeTab === "preview" && (
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}
                >
                  Preview
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("history")}
              style={{
                flex: activeTab === "history" ? 1.5 : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 24,
                backgroundColor:
                  activeTab === "history"
                    ? Theme.colors.primary
                    : "transparent",
              }}
            >
              <History
                size={18}
                color={activeTab === "history" ? "#fff" : colors.textMuted}
              />
              {activeTab === "history" && (
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}
                >
                  History
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>
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

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
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
                Rename Entry
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRenameModal(false);
                  setRenameTarget(null);
                  setRenameText("");
                }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter a new name for this entry.
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
              value={renameText}
              onChangeText={setRenameText}
              placeholder="New name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.confirmSaveBtn, !renameText.trim() && { opacity: 0.5 }]}
              onPress={handleConfirmRename}
              disabled={!renameText.trim()}
            >
              <Text style={styles.confirmSaveBtnText}>Rename</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Draggable Text Modal */}
      <Modal visible={showAddTextModal} transparent animationType="fade">
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
                Add Draggable Text
              </Text>
              <TouchableOpacity onPress={() => setShowAddTextModal(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter custom text to overlay on top of the resume. You can drag it
              anywhere and delete it later.
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
              value={newCustomText}
              onChangeText={setNewCustomText}
              placeholder="E.g., Top Candidate! or Certified Scrum Master"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.confirmSaveBtn]}
              onPress={() => {
                if (newCustomText.trim()) {
                  setCustomTexts((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      text: newCustomText.trim(),
                      x: 80,
                      y: 180 + prev.length * 50,
                    },
                  ]);
                  setNewCustomText("");
                  setShowAddTextModal(false);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }
              }}
            >
              <Text style={styles.confirmSaveBtnText}>Add Text</Text>
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
          {value ? (
            <TouchableOpacity
              onPress={() => onChange("")}
              style={{ padding: 4 }}
            >
              <Trash2 size={12} color="#ef4444" />
            </TouchableOpacity>
          ) : null}
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

function DraggableText({ item, onDelete, onUpdatePosition }: any) {
  const [pos, setPos] = React.useState({ x: item.x, y: item.y });
  const offset = React.useRef({ x: 0, y: 0 });
  const [showRemoveMenu, setShowRemoveMenu] = React.useState(false);

  return (
    <View
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        backgroundColor: "#fef08a", // vibrant post-it yellow
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#000",
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
      }}
      onTouchStart={(e) => {
        offset.current = {
          x: e.nativeEvent.pageX - pos.x,
          y: e.nativeEvent.pageY - pos.y,
        };
      }}
      onTouchMove={(e) => {
        const newX = e.nativeEvent.pageX - offset.current.x;
        const newY = e.nativeEvent.pageY - offset.current.y;
        setPos({ x: newX, y: newY });
      }}
      onTouchEnd={() => {
        onUpdatePosition(item.id, pos.x, pos.y);
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowRemoveMenu(!showRemoveMenu)}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ fontSize: 12, fontWeight: "900", color: "#000" }}>
          {item.text}
        </Text>
      </TouchableOpacity>

      {showRemoveMenu && (
        <View
          style={{
            position: "absolute",
            bottom: -36,
            left: 0,
            backgroundColor: "#000",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            zIndex: 1001,
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8b5cf615',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: '#4a3f6b' },
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
  headerSub: { fontSize: 11, fontWeight: "600", color: '#9a8aaa' },
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
  editorContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 180 },
  editorSection: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 16 },
  addSectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary + "15",
  },
  addSectionText: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.colors.primary,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Theme.border.color,
    marginBottom: 16,
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
  fieldContainer: { marginBottom: 20 },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: "800" },
  enhanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary + "10",
  },
  enhanceBtnText: { fontSize: 11, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: Theme.border.color,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: "500",
  },
  inputMultiline: { height: 120, paddingTop: 16 },
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
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
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
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
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
  saveModal: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  modalInput: {
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
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
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
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
