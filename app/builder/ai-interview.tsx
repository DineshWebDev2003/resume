import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  FolderGit2,
  GraduationCap,
  History,
  Layout as LayoutIcon,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { useRewardedAd } from "@/hooks/use-rewarded-ad";
import { callAI } from "@/services/ai";
import { db } from "@/services/firebase";
import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { doc, getDoc } from "firebase/firestore";
import { Alert } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const STEPS = [
  { id: "basic", icon: User, label: "Basic Details" },
  { id: "education", icon: GraduationCap, label: "Education" },
  { id: "skills", icon: Wrench, label: "Skills" },
  { id: "experience", icon: Briefcase, label: "Experience" },
  { id: "projects", icon: FolderGit2, label: "Projects" },
  { id: "final", icon: FileText, label: "Final Details" },
];

const TECH_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI UX Designer",
  "Mobile Developer",
  "Data Analyst",
  "Other",
];
const NON_TECH_ROLES = [
  "Marketing Manager",
  "Sales Executive",
  "HR Manager",
  "Business Analyst",
  "Project Manager",
  "Customer Support",
  "Finance Analyst",
  "Other",
];
const TECH_SKILLS = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "AWS",
  "Git",
  "Other",
];
const NON_TECH_SKILLS = [
  "Communication",
  "Leadership",
  "Marketing",
  "Sales",
  "Management",
  "Customer Support",
  "Finance",
  "Other",
];
const TECH_TOOLS = [
  "VS Code",
  "Git",
  "Docker",
  "Figma",
  "Postman",
  "Jira",
  "Linux",
  "Webpack",
  "Jenkins",
  "Other",
];
const NON_TECH_TOOLS = [
  "Excel",
  "PowerPoint",
  "Word",
  "Salesforce",
  "HubSpot",
  "Trello",
  "Asana",
  "Google Analytics",
  "Tableau",
  "Other",
];
const CERTIFICATIONS_LIST = [
  "AWS Certified",
  "Google Cloud",
  "Azure",
  "PMP",
  "Scrum Master",
  "CPA",
  "CFA",
  "Other",
];

interface InterviewDraft {
  id: string;
  title: string;
  date: number;
  data: any;
}

export default function AIInterviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalData, setFinalData] = useState<any>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [drafts, setDrafts] = useState<InterviewDraft[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showRoleInput, setShowRoleInput] = useState(false);
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [showCustomToolInput, setShowCustomToolInput] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [customTool, setCustomTool] = useState("");
  const videoRef = useRef<Video>(null);

  const YEARS_LIST = [
    "Fresher",
    "0-1 years",
    "1-2 years",
    "2-3 years",
    "3-5 years",
    "5-10 years",
    "10+ years",
  ];

  const [form, setForm] = useState<any>({
    name: "",
    mobile: "",
    email: "",
    portfolio: "",
    profileType: "",
    role: "",
    roleManual: "",
    experienceLevel: "",
    highestQualification: "",
    college: "",
    gradYear: "",
    certification: "",
    skills: [] as string[],
    tools: [] as string[],
    certifications: [] as string[],
    experiences: [] as any[],
    projects: [] as any[],
    summary: "",
    achievementsFinal: "",
    languages: "",
    location: "",
  });

  const { user, userProfile } = useAuth();
  const { showAd } = useRewardedAd();
  const navigation = useNavigation();

  const FORM_DRAFT_KEY = "interview_form_draft";

  useEffect(() => {
    const p = userProfile;
    if (user) {
      setForm((f: any) => ({
        ...f,
        name: p?.name || user.displayName || f.name,
        email: p?.email || user.email || f.email,
        mobile: p?.phone || user.phoneNumber || f.mobile,
        portfolio: p?.portfolio || f.portfolio,
        profileType:
          p?.isIT === true
            ? "Technical"
            : p?.isIT === false
              ? "Non Technical"
              : f.profileType,
        role: p?.primaryRole || f.role,
        location: p?.location || f.location,
        highestQualification: p?.education || f.highestQualification,
      }));
    }
  }, [user, userProfile]);

  // Check for saved draft on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FORM_DRAFT_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.form && saved.currentStep !== undefined) {
            setShowResumePrompt(true);
          }
        }
      } catch {}
    })();
  }, []);

  // Auto-save form on changes (debounced)
  const saveTimerRef = useRef<any>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(
        FORM_DRAFT_KEY,
        JSON.stringify({ form, currentStep }),
      ).catch(() => {});
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form, currentStep]);

  // Save on leave
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", () => {
      AsyncStorage.setItem(
        FORM_DRAFT_KEY,
        JSON.stringify({ form, currentStep }),
      ).catch(() => {});
    });
    return unsub;
  }, [navigation, form, currentStep]);

  const clearSavedDraft = async () => {
    await AsyncStorage.removeItem(FORM_DRAFT_KEY).catch(() => {});
  };

  const resumeSavedDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(FORM_DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.form) setForm(saved.form);
        if (saved.currentStep !== undefined) setCurrentStep(saved.currentStep);
      }
    } catch {}
    setShowResumePrompt(false);
  };

  const dismissResumePrompt = () => {
    clearSavedDraft();
    setShowResumePrompt(false);
  };

  useEffect(() => {
    const checkPro = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setIsPro(docSnap.data().isPro || false);
      }
    };
    checkPro();
  }, [user]);

  useEffect(() => {
    setVideoFinished(false);
    setVideoProgress(0);
    setVideoDuration(0);
  }, [currentStep]);

  const updateField = (field: string, value: any) =>
    setForm((p: any) => ({ ...p, [field]: value }));
  const toggleSkill = (skill: string) => {
    const skills = form.skills.includes(skill)
      ? form.skills.filter((s: string) => s !== skill)
      : [...form.skills, skill];
    updateField("skills", skills);
  };
  const toggleTool = (tool: string) => {
    const tools = form.tools.includes(tool)
      ? form.tools.filter((t: string) => t !== tool)
      : [...form.tools, tool];
    updateField("tools", tools);
  };
  const toggleCertification = (cert: string) => {
    const certs = form.certifications.includes(cert)
      ? form.certifications.filter((c: string) => c !== cert)
      : [...form.certifications, cert];
    updateField("certifications", certs);
  };
  const addCustomSkill = () => {
    const v = customSkill.trim();
    if (v && !form.skills.includes(v)) {
      updateField("skills", [...form.skills, v]);
      setCustomSkill("");
      setShowCustomSkillInput(false);
    }
  };
  const addCustomTool = () => {
    const v = customTool.trim();
    if (v && !form.tools.includes(v)) {
      updateField("tools", [...form.tools, v]);
      setCustomTool("");
      setShowCustomToolInput(false);
    }
  };
  const handlePrev = async () => {
    if (videoRef.current) await videoRef.current.stopAsync();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setVideoFinished(false);
      setVideoProgress(0);
    }
  };
  const handleSkip = async () => {
    if (videoRef.current) await videoRef.current.stopAsync();
    setVideoFinished(true);
  };
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else generateFinalStructure(form);
  };

  const DRAFTS_KEY = "interview_drafts";

  const loadDrafts = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      if (raw) setDrafts(JSON.parse(raw));
    } catch {}
  };

  const saveDraft = async (data: any) => {
    const newDraft: InterviewDraft = {
      id: Date.now().toString(),
      title: `${data.role || "Resume"} - ${data.name || "Untitled"}`,
      date: Date.now(),
      data,
    };
    let updated = [newDraft, ...drafts];
    if (updated.length > 3) updated = updated.slice(0, 3);
    setDrafts(updated);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  };

  const deleteDraft = async (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  };

  const loadDraftToForm = (draft: InterviewDraft) => {
    const { synthesizedData, ...cleanData } = draft.data;
    setForm(cleanData);
    setShowHistory(false);
    deleteDraft(draft.id);
    startSynthesis(cleanData);
  };

  const generateFinalStructure = async (allAnswers: any) => {
    if (!isPro) {
      Alert.alert(
        "Premium AI Feature",
        "AI Interview Synthesis is a pro feature. Watch one short ad to unlock it for this resume?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Watch Ad",
            onPress: () => showAd(() => startSynthesis(allAnswers)),
          },
        ],
      );
      return;
    }
    startSynthesis(allAnswers);
  };

  const startSynthesis = async (allAnswers: any) => {
    setIsProcessing(true);
    try {
      const payload = {
        ...allAnswers,
        role:
          allAnswers.role === "Other" ? allAnswers.roleManual : allAnswers.role,
        experiences: allAnswers.experiences || [],
        projects: allAnswers.projects || [],
      };
      const messages = [
        {
          role: "system" as const,
          content:
            "You are an elite ATS resume architect. Generate a high-end JSON resume optimized for Applicant Tracking Systems. Use strong action verbs, quantify achievements, include relevant keywords from the role, and write compelling bullet points. Return ONLY valid JSON.",
        },
        {
          role: "user" as const,
          content: `Generate a professional ATS-optimized JSON resume from this candidate data:\n${JSON.stringify(payload)}\n\nRules:\n- Summary: 2-3 punchy lines with keywords, metrics, and role-specific terms\n- Experience: Rewrite each entry with action verbs (Led, Built, Increased, Optimized), quantify results (%, $, time saved), and include relevant keywords\n- Skills: Merge tools + certifications into the skills array, categorize as Technical/Professional\n- Projects: Write concise descriptions highlighting impact and technologies\n- Education: Include degree, school, year\n\nJSON Format:\n{\n  "name": "string",\n  "role": "string",\n  "phone": "string",\n  "email": "string",\n  "location": "string",\n  "website": "string",\n  "summary": "string (ATS-optimized, 2-3 lines)",\n  "experience": [{"title":"string","company":"string","period":"string","description":"string (action-oriented with metrics)"}],\n  "skills": ["string"],\n  "education": [{"school":"string","degree":"string","year":"string"}],\n  "projects": [{"name":"string","description":"string (impact-focused)","link":"string"}],\n  "certifications": ["string"],\n  "languages": ["string"]\n}`,
        },
      ];
      const resultText = await callAI(messages, { jsonMode: true });
      const parsed = JSON.parse(resultText);
      setFinalData(parsed);
      await saveDraft({ ...allAnswers, synthesizedData: parsed });
      await clearSavedDraft();
      router.replace({
        pathname: "/builder/manual",
        params: { theme: "Modern", initialData: JSON.stringify(parsed) },
      });
    } catch {
      Alert.alert("Error", "Could not connect to AI. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setShowTemplatePicker(false);
    router.push({
      pathname: "/builder/manual",
      params: { theme: template, initialData: JSON.stringify(finalData) },
    });
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const renderInput = (
    field: string,
    placeholder: string,
    multiline = false,
  ) => (
    <TextInput
      style={[
        s.input,
        {
          color: "#fff",
          borderColor: "rgba(255,255,255,0.2)",
          backgroundColor: "rgba(255,255,255,0.07)",
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.5)"
      value={form[field]}
      onChangeText={(v) => updateField(field, v)}
      multiline={multiline}
    />
  );

  const roleOptions =
    form.profileType === "Technical"
      ? TECH_ROLES
      : form.profileType === "Non Technical"
        ? NON_TECH_ROLES
        : [];

  const renderForm = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <User size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Full Name</Text>
                {renderInput("name", "Your full name")}
                <Text style={[s.fl, { marginTop: 14 }]}>Mobile Number</Text>
                {renderInput("mobile", "+91 98765 43210")}
                <Text style={[s.fl, { marginTop: 14 }]}>Email</Text>
                {renderInput("email", "your@email.com")}
                <Text style={[s.fl, { marginTop: 14 }]}>
                  Portfolio / Website
                </Text>
                {renderInput("portfolio", "https://yourportfolio.com")}
              </View>
            </View>
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Wrench size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Profile Type</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      s.ptBtn,
                      {
                        borderColor:
                          form.profileType === "Technical"
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.15)",
                        backgroundColor:
                          form.profileType === "Technical"
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.05)",
                      },
                    ]}
                    onPress={() => {
                      updateField("profileType", "Technical");
                      updateField("role", "");
                      setShowRoleInput(false);
                    }}
                  >
                    <Text
                      style={{
                        color:
                          form.profileType === "Technical"
                            ? "#fff"
                            : "rgba(255,255,255,0.7)",
                        fontWeight: "800",
                        fontSize: 14,
                      }}
                    >
                      Technical
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.ptBtn,
                      {
                        borderColor:
                          form.profileType === "Non Technical"
                            ? Theme.colors.secondary
                            : "rgba(255,255,255,0.15)",
                        backgroundColor:
                          form.profileType === "Non Technical"
                            ? Theme.colors.secondary
                            : "rgba(255,255,255,0.05)",
                      },
                    ]}
                    onPress={() => {
                      updateField("profileType", "Non Technical");
                      updateField("role", "");
                      setShowRoleInput(false);
                    }}
                  >
                    <Text
                      style={{
                        color:
                          form.profileType === "Non Technical"
                            ? "#fff"
                            : "rgba(255,255,255,0.7)",
                        fontWeight: "800",
                        fontSize: 14,
                      }}
                    >
                      Non Technical
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {form.profileType && (
              <View style={s.sbRow}>
                <View
                  style={[
                    s.sbBox,
                    {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                  ]}
                >
                  <Briefcase size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fl}>Target Role</Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    {roleOptions.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          s.chip,
                          {
                            borderColor:
                              form.role === r
                                ? Theme.colors.primary
                                : "rgba(255,255,255,0.15)",
                            backgroundColor:
                              form.role === r
                                ? Theme.colors.primary
                                : "rgba(255,255,255,0.06)",
                          },
                        ]}
                        onPress={() => {
                          updateField("role", r);
                          setShowRoleInput(r === "Other");
                        }}
                      >
                        <Text
                          style={{
                            color:
                              form.role === r
                                ? "#fff"
                                : "rgba(255,255,255,0.8)",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {showRoleInput && (
                    <TextInput
                      style={[s.input, { marginTop: 8 }]}
                      placeholder="Enter your role manually"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={form.roleManual}
                      onChangeText={(v) => updateField("roleManual", v)}
                    />
                  )}
                </View>
              </View>
            )}
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <User size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Experience</Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {YEARS_LIST.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        s.chip,
                        {
                          borderColor:
                            form.experienceLevel === y
                              ? Theme.colors.primary
                              : "rgba(255,255,255,0.15)",
                          backgroundColor:
                            form.experienceLevel === y
                              ? Theme.colors.primary
                              : "rgba(255,255,255,0.06)",
                        },
                      ]}
                      onPress={() => updateField("experienceLevel", y)}
                    >
                      <Text
                        style={{
                          color:
                            form.experienceLevel === y
                              ? "#fff"
                              : "rgba(255,255,255,0.8)",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>Next Step</Text>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </>
        );

      case 1:
        return (
          <>
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <GraduationCap size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Highest Qualification</Text>
                {renderInput("highestQualification", "e.g. Bachelor Degree")}
                <Text style={[s.fl, { marginTop: 14 }]}>
                  College / University
                </Text>
                {renderInput("college", "Enter college name")}
                <Text style={[s.fl, { marginTop: 14 }]}>Graduation Year</Text>
                {renderInput("gradYear", "e.g. 2024")}
                <Text style={[s.fl, { marginTop: 14 }]}>
                  Certification (Optional)
                </Text>
                {renderInput("certification", "e.g. AWS Certified")}
              </View>
            </View>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>Next Step</Text>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </>
        );

      case 2:
        const isTech = form.profileType === "Technical";
        const skillPool = isTech ? TECH_SKILLS : NON_TECH_SKILLS;
        const toolPool = isTech ? TECH_TOOLS : NON_TECH_TOOLS;
        const customSkills = form.skills.filter(
          (s: string) => !skillPool.includes(s),
        );
        const customTools = form.tools.filter(
          (t: string) => !toolPool.includes(t),
        );
        const customCerts = form.certifications.filter(
          (c: string) => !CERTIFICATIONS_LIST.includes(c),
        );
        return (
          <>
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Wrench size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>
                  {isTech ? "Technical Skills" : "Professional Skills"}
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {skillPool.map((sk) => (
                    <TouchableOpacity
                      key={sk}
                      style={[
                        s.chip,
                        {
                          borderColor: form.skills.includes(sk)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.15)",
                          backgroundColor: form.skills.includes(sk)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.06)",
                        },
                      ]}
                      onPress={() => toggleSkill(sk)}
                    >
                      <Text
                        style={{
                          color: form.skills.includes(sk)
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {sk}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {customSkills.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    {customSkills.map((sk: string) => (
                      <TouchableOpacity
                        key={sk}
                        style={[
                          s.chip,
                          {
                            borderColor: Theme.colors.primary,
                            backgroundColor: Theme.colors.primary,
                          },
                        ]}
                        onPress={() => toggleSkill(sk)}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {sk}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {showCustomSkillInput ? (
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="Type a skill"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={customSkill}
                      onChangeText={setCustomSkill}
                      onSubmitEditing={addCustomSkill}
                    />
                    <TouchableOpacity
                      onPress={addCustomSkill}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: Theme.colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowCustomSkillInput(true)}
                    style={{ marginTop: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={14} color={Theme.colors.primary} />
                      <Text
                        style={{
                          color: Theme.colors.primary,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Add custom skill
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[s.sbRow, { marginTop: 14 }]}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Wrench size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Tools</Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {toolPool.map((tl) => (
                    <TouchableOpacity
                      key={tl}
                      style={[
                        s.chip,
                        {
                          borderColor: form.tools.includes(tl)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.15)",
                          backgroundColor: form.tools.includes(tl)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.06)",
                        },
                      ]}
                      onPress={() => toggleTool(tl)}
                    >
                      <Text
                        style={{
                          color: form.tools.includes(tl)
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {tl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {customTools.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    {customTools.map((tl: string) => (
                      <TouchableOpacity
                        key={tl}
                        style={[
                          s.chip,
                          {
                            borderColor: Theme.colors.primary,
                            backgroundColor: Theme.colors.primary,
                          },
                        ]}
                        onPress={() => toggleTool(tl)}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {tl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {showCustomToolInput ? (
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="Type a tool"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={customTool}
                      onChangeText={setCustomTool}
                      onSubmitEditing={addCustomTool}
                    />
                    <TouchableOpacity
                      onPress={addCustomTool}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: Theme.colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowCustomToolInput(true)}
                    style={{ marginTop: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={14} color={Theme.colors.primary} />
                      <Text
                        style={{
                          color: Theme.colors.primary,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Add custom tool
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[s.sbRow, { marginTop: 14 }]}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Award size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Certifications</Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {CERTIFICATIONS_LIST.map((cert) => (
                    <TouchableOpacity
                      key={cert}
                      style={[
                        s.chip,
                        {
                          borderColor: form.certifications.includes(cert)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.15)",
                          backgroundColor: form.certifications.includes(cert)
                            ? Theme.colors.primary
                            : "rgba(255,255,255,0.06)",
                        },
                      ]}
                      onPress={() => toggleCertification(cert)}
                    >
                      <Text
                        style={{
                          color: form.certifications.includes(cert)
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {cert}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {customCerts.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    {customCerts.map((cert: string) => (
                      <TouchableOpacity
                        key={cert}
                        style={[
                          s.chip,
                          {
                            borderColor: Theme.colors.primary,
                            backgroundColor: Theme.colors.primary,
                          },
                        ]}
                        onPress={() => toggleCertification(cert)}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {cert}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>Next Step</Text>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </>
        );

      case 3:
        if (form.experienceLevel === "Fresher") {
          return (
            <View
              style={{ alignItems: "center", gap: 16, paddingVertical: 30 }}
            >
              <CheckCircle2 size={48} color={Theme.colors.primary} />
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Skipped — Fresher
              </Text>
              <TouchableOpacity
                style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
                onPress={handleNext}
              >
                <View style={s.nbI}>
                  <Text style={s.nbT}>Next Step</Text>
                  <ArrowRight size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          );
        }
        const addExperience = () => {
          setForm((p: any) => ({
            ...p,
            experiences: [
              ...p.experiences,
              { company: "", jobTitle: "", duration: "", responsibilities: "" },
            ],
          }));
        };
        const updateExp = (idx: number, field: string, value: string) => {
          setForm((p: any) => {
            const exps = [...p.experiences];
            exps[idx] = { ...exps[idx], [field]: value };
            return { ...p, experiences: exps };
          });
        };
        const removeExp = (idx: number) => {
          setForm((p: any) => ({
            ...p,
            experiences: p.experiences.filter((_: any, i: number) => i !== idx),
          }));
        };
        return (
          <>
            <View style={{ gap: 16, paddingBottom: 8 }}>
              {form.experiences.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <Text
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}
                  >
                    No experience added yet
                  </Text>
                </View>
              )}
              {form.experiences.map((exp: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    s.sbRow,
                    {
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      padding: 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.sbBox,
                      {
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.2)",
                      },
                    ]}
                  >
                    <Briefcase size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={s.fl}>Experience {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeExp(idx)}>
                        <X size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[s.fl, { marginTop: 8 }]}>Company Name</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="Enter company name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={exp.company}
                      onChangeText={(v) => updateExp(idx, "company", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>Job Title</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="Enter your job title"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={exp.jobTitle}
                      onChangeText={(v) => updateExp(idx, "jobTitle", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>Duration</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="e.g. 2 years"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={exp.duration}
                      onChangeText={(v) => updateExp(idx, "duration", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>
                      Responsibilities
                    </Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                          minHeight: 100,
                          textAlignVertical: "top",
                        },
                      ]}
                      placeholder="Describe your responsibilities"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={exp.responsibilities}
                      onChangeText={(v) =>
                        updateExp(idx, "responsibilities", v)
                      }
                      multiline
                    />
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={addExperience}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: Theme.colors.primary,
                marginBottom: 8,
              }}
            >
              <Plus size={18} color={Theme.colors.primary} />
              <Text
                style={{
                  color: Theme.colors.primary,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Add Experience
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>Next Step</Text>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </>
        );

      case 4:
        const addProject = () => {
          setForm((p: any) => ({
            ...p,
            projects: [
              ...p.projects,
              { name: "", description: "", tech: "", role: "", link: "" },
            ],
          }));
        };
        const updateProject = (idx: number, field: string, value: string) => {
          setForm((p: any) => {
            const projs = [...p.projects];
            projs[idx] = { ...projs[idx], [field]: value };
            return { ...p, projects: projs };
          });
        };
        const removeProject = (idx: number) => {
          setForm((p: any) => ({
            ...p,
            projects: p.projects.filter((_: any, i: number) => i !== idx),
          }));
        };
        return (
          <>
            <View style={{ gap: 16, paddingBottom: 8 }}>
              {form.projects.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 12 }}>
                  <Text
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}
                  >
                    No projects added yet
                  </Text>
                </View>
              )}
              {form.projects.map((proj: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    s.sbRow,
                    {
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      padding: 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.sbBox,
                      {
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.2)",
                      },
                    ]}
                  >
                    <FolderGit2 size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={s.fl}>Project {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeProject(idx)}>
                        <X size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[s.fl, { marginTop: 8 }]}>Project Name</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="Enter project name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={proj.name}
                      onChangeText={(v) => updateProject(idx, "name", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>Description</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                          minHeight: 80,
                          textAlignVertical: "top",
                        },
                      ]}
                      placeholder="Describe the project"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={proj.description}
                      onChangeText={(v) => updateProject(idx, "description", v)}
                      multiline
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>
                      Technologies Used
                    </Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="e.g. React, Node.js"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={proj.tech}
                      onChangeText={(v) => updateProject(idx, "tech", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>Your Role</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="e.g. Lead Developer"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={proj.role}
                      onChangeText={(v) => updateProject(idx, "role", v)}
                    />
                    <Text style={[s.fl, { marginTop: 10 }]}>
                      Project Link (Optional)
                    </Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          color: "#fff",
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.07)",
                        },
                      ]}
                      placeholder="https://..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={proj.link}
                      onChangeText={(v) => updateProject(idx, "link", v)}
                    />
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={addProject}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: Theme.colors.primary,
                marginBottom: 8,
              }}
            >
              <Plus size={18} color={Theme.colors.primary} />
              <Text
                style={{
                  color: Theme.colors.primary,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Add Project
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>Next Step</Text>
                <ArrowRight size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </>
        );

      case 5:
        return (
          <>
            <View style={s.sbRow}>
              <View
                style={[
                  s.sbBox,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <FileText size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fl}>Professional Summary</Text>
                {renderInput("summary", "Brief summary", true)}
                <Text style={[s.fl, { marginTop: 14 }]}>Achievements</Text>
                {renderInput("achievementsFinal", "Key achievements", true)}
                <Text style={[s.fl, { marginTop: 14 }]}>Languages Known</Text>
                {renderInput("languages", "e.g. English, Tamil")}
                <Text style={[s.fl, { marginTop: 14 }]}>Location</Text>
                {renderInput("location", "City, Country")}
              </View>
            </View>
            <TouchableOpacity
              style={[s.nbG, { backgroundColor: Theme.colors.primary }]}
              onPress={handleNext}
            >
              <View style={s.nbI}>
                <Text style={s.nbT}>
                  {isProcessing ? "Generating..." : "Generate Resume"}
                </Text>
                {!isProcessing && <ArrowRight size={20} color="#fff" />}
              </View>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  // Interview clips removed with the Video Interview entry point.
  // Keeping the player guarded so the route never crashes if deep-linked.
  const videoSource = (() => {
    const sources: Record<number, any> = {};
    return sources[currentStep];
  })();

  const VIDEO_BOX_H = (SCREEN_W - 32) * (16 / 9);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* TOP: header with Resume Creator + history */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          zIndex: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Cancel Interview",
                  "Do you want to discard this interview draft? Your progress will be lost.",
                  [
                    { text: "Keep Editing", style: "cancel" },
                    {
                      text: "Discard Draft",
                      style: "destructive",
                      onPress: async () => {
                        await clearSavedDraft();
                        router.back();
                      },
                    },
                  ],
                );
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}
            >
              Resume Creator
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={async () => {
                await loadDrafts();
                setShowHistory(true);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <History color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* VIDEO BOX with sketch outline */}
      <View
        style={{ flex: 1, paddingHorizontal: 12, justifyContent: "center" }}
      >
        <View
          style={{
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: colors.surface,
            height: VIDEO_BOX_H,
            position: "relative",
            borderWidth: 3,
            borderColor: Theme.border.color,
            shadowColor: Theme.border.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {videoSource ? (
          <Video
            ref={videoRef}
            source={videoSource}
            style={{ width: "105%", height: "105%", alignSelf: "center" }}
            shouldPlay
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={(s) => {
              if (s.isLoaded) {
                if (s.durationMillis) setVideoDuration(s.durationMillis);
                if (s.positionMillis) setVideoProgress(s.positionMillis);
                if (s.didJustFinish) setVideoFinished(true);
              }
            }}
          />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textMuted, fontWeight: "700" }}>
                Video interview is unavailable
              </Text>
            </View>
          )}

          {/* During play overlay */}
          {!videoFinished && (
            <>
              <View style={{ position: "absolute", top: 12, left: 12 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                  onPress={() => {
                    if (currentStep > 0) handlePrev();
                  }}
                >
                  <ChevronLeft size={12} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ position: "absolute", top: 12, right: 12 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                  onPress={handleSkip}
                >
                  <SkipForward size={12} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}
                  >
                    Skip
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 12,
                  right: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => videoRef.current?.replayAsync()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Play size={10} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}
                  >
                    Interviewer
                  </Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Clock size={10} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}
                  >
                    {fmt(videoProgress)} / {fmt(videoDuration)}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width:
                      videoDuration > 0
                        ? `${(videoProgress / videoDuration) * 100}%`
                        : "0%",
                    backgroundColor: Theme.colors.primary,
                  }}
                />
              </View>
            </>
          )}

          {/* Form overlay on video after finish */}
          {videoFinished && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
                  <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {renderForm()}
                  </ScrollView>
                </View>
              </BlurView>
            </View>
          )}
        </View>
        {/* Step name below video */}
        <View
          style={{ paddingHorizontal: 4, paddingTop: 8, alignItems: "center" }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
            Step {currentStep + 1}: {STEPS[currentStep].label}
          </Text>
        </View>
        {/* Progress dots at bottom */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 16,
          }}
        >
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === currentStep
                    ? Theme.colors.primary
                    : i < currentStep
                      ? Theme.colors.primary
                      : colors.text,
              }}
            />
          ))}
        </View>
      </View>

      {/* RESUME PROMPT */}
      <Modal
        visible={showResumePrompt}
        transparent
        animationType="fade"
        onRequestClose={dismissResumePrompt}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 28,
              padding: 28,
              borderWidth: 2.5,
              borderColor: Theme.border.color,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 22,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Resume Draft Found
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 14,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 20,
                opacity: 0.6,
              }}
            >
              You have an unfinished interview. Would you like to continue where
              you left off?
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={dismissResumePrompt}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: colors.text,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resumeSavedDraft}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: Theme.colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOADING STATE */}
      {isProcessing && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            AI is drafting your resume...
          </Text>
        </View>
      )}

      {/* TEMPLATE PICKER */}
      <Modal visible={showTemplatePicker} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "flex-end",
          }}
        >
          <Animated.View
            entering={FadeInUp}
            style={{
              backgroundColor: colors.surface,
              padding: 30,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Sparkles size={24} color={Theme.colors.primary} />
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
                Choose Your Design
              </Text>
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 30,
              }}
            >
              We've synthesized your story. Select a template to finish.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
            >
              {["Executive", "Modern", "Professional", "Creative"].map(
                (temp) => (
                  <TouchableOpacity
                    key={temp}
                    style={{ width: 120, alignItems: "center", gap: 12 }}
                    onPress={() => handleTemplateSelect(temp)}
                  >
                    <View
                      style={{
                        width: 100,
                        height: 140,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.15)",
                        backgroundColor: "#222",
                      }}
                    >
                      <LayoutIcon size={32} color={Theme.colors.primary} />
                    </View>
                    <Text
                      style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                    >
                      {temp}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* HISTORY POPUP */}
      <Modal
        visible={showHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistory(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowHistory(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 28,
              padding: 24,
              borderWidth: 2.5,
              borderColor: Theme.border.color,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <History size={20} color={colors.text} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "900",
                  }}
                >
                  Interview History
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Theme.colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {drafts.length === 0 ? (
              <View
                style={{ paddingVertical: 30, alignItems: "center", gap: 12 }}
              >
                <Text style={{ fontSize: 56 }}>😶</Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  No interviews yet
                </Text>
                <Text
                  style={{ color: colors.text, fontSize: 13, opacity: 0.5 }}
                >
                  Complete an interview to see it here
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {drafts.map((d) => (
                  <View
                    key={d.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                        numberOfLines={1}
                      >
                        {d.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 12,
                          marginTop: 2,
                          opacity: 0.5,
                        }}
                      >
                        {new Date(d.date).toLocaleDateString()}{" "}
                        {new Date(d.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => loadDraftToForm(d)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: Theme.colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <RotateCcw size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteDraft(d.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    borderWidth: 2.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    borderStyle: "dashed",
    borderColor: Theme.border.color,
    color: Colors.dark.text,
    backgroundColor: "transparent",
  },
  fl: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  sbRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  sbBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    marginTop: 4,
    borderStyle: "dashed",
    borderColor: Theme.border.color,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: Theme.border.color,
  },
  ptBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: "center",
    borderColor: Theme.border.color,
  },
  nbG: {
    marginTop: 6,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: Theme.border.color,
  },
  nbI: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  nbT: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
