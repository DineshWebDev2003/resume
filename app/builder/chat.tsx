import { GlassCard } from "@/components/glass-card";
import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRewardedAd } from "@/hooks/use-rewarded-ad";
import { callAI, transcribeAudio } from "@/services/ai";
import { AudioService } from "@/services/audio";
import { db } from "@/services/firebase";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import {
    Bot,
    BrainCircuit,
    ChevronLeft,
    Mic,
    Plus,
    Send,
    Sparkles,
    User,
    X,
    History,
} from "lucide-react-native";
import { saveChatSession, getChatSessions } from "@/services/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from "react-native";
import Animated, {
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    Layout
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

// Project-wide AudioService handles the recording singleton
interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  videoUri?: any;
}

const QUESTIONS = [
  {
    id: "experience_level",
    question:
      "Welcome! First, what is your full name and target job role? And are you a fresher or experienced?",
    key: "experience_level",
  },
  {
    id: "education",
    question:
      "Got it. Now, tell me about your education: What is your college name, degree, and year of completion?",
    key: "education",
  },
  {
    id: "skills",
    question:
      "Excellent. Now, tell me about your technical and soft skills (e.g., Java, Python, Teamwork)?",
    key: "skills",
  },
  {
    id: "experience",
    question:
      "Now, tell me about your work experience: What is your company name, job title, and duration?",
    key: "experience",
  },
  {
    id: "projects_certs",
    question:
      "Almost there! Tell me about your key projects and any certifications you've earned.",
    key: "projects_certs",
  },
  {
    id: "generate",
    question:
      "All set! I have everything I need. Ready to see your elite resume?",
    key: "generate",
  },
];

export default function AIChatBuilder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const videoRef = useRef<Video>(null);
  // Rehydrate step data when going back/forth
  useEffect(() => {
    const stepId = QUESTIONS[currentStep]?.id;
    if (stepId && stepHistory[stepId]) {
      const data = stepHistory[stepId];
      if (data.inputText !== undefined) setInputText(data.inputText);
      if (data.userName !== undefined) setUserName(data.userName);
      if (data.localEdu) setLocalEdu(data.localEdu);
      if (data.expForm) setExpForm(data.expForm);
      if (data.localSkills) setLocalSkills(data.localSkills);
      if (data.localTools) setLocalTools(data.localTools);
      if (data.localExperience) setLocalExperience(data.localExperience);
      if (data.localProjects) setLocalProjects(data.localProjects);
      if (data.localCerts) setLocalCerts(data.localCerts);
      setVideoEnded(true); // Show inputs immediately if we have history
    } else {
      setInputText("");
      setLocalTools([]);
      setVideoEnded(false); // New step, wait for video
    }
  }, [currentStep]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<any>({});
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);

  useEffect(() => {
    if (showHistory) {
      getChatSessions().then(setChatSessions).catch(console.error);
    }
  }, [showHistory]);
  const { user } = useAuth();
  const { jobUrl: incomingUrl } = useLocalSearchParams<{ jobUrl?: string }>();
  const { loaded: adLoaded, showAd } = useRewardedAd();
  const flatListRef = useRef<FlatList>(null);

  // UI State
  const [isRecording, setIsRecording] = useState(false);
  const [userName, setUserName] = useState("");
  const [localEdu, setLocalEdu] = useState({
    college: "",
    degree: "",
    year: "",
  });
  const [localSkills, setLocalSkills] = useState<string[]>([]);
  const [localExperience, setLocalExperience] = useState<any[]>([]);
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [localCerts, setLocalCerts] = useState<string[]>([]);
  const [expForm, setExpForm] = useState({
    company: "",
    role: "",
    duration: "",
    description: "",
  });
  const [stepHistory, setStepHistory] = useState<Record<string, any>>({});
  const [projType, setProjType] = useState<"project" | "cert">("project");
  const [skillType, setSkillType] = useState<"technical" | "soft" | "tools">("technical");
  const [localTools, setLocalTools] = useState<string[]>([]);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const checkProAndLoadProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profile = docSnap.data();
            setIsPro(profile.isPro || false);
            
            // Auto-populate full name
            if (profile.name) {
              setUserName(profile.name);
            }
            // Auto-populate target job role
            if (profile.jobRoles && profile.jobRoles.length > 0) {
              setExpForm((prev) => ({
                ...prev,
                role: profile.jobRoles[0],
              }));
            }
          }
        } catch (err) {
          console.warn("Error loading user profile in chat.tsx:", err);
        }
      }
    };
    checkProAndLoadProfile();
  }, [user]);

  useEffect(() => {
    if (incomingUrl) {
      setScrapingUrl(incomingUrl);
      setMessages((prev) => [
        ...prev,
        {
          id: "init-scrape",
          text: "I've received the job link! Analyzing the description now to prepare your tailored resume...",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
    return () => {
      AudioService.hardReset();
    };
  }, [incomingUrl]);

  const startRecording = async () => {
    if (AudioService.isBusy() || AudioService.isRecording()) return;
    try {
      await AudioService.startRecording();
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (AudioService.isBusy() || !AudioService.isRecording()) return;
    setIsRecording(false);
    try {
      const uri = await AudioService.stopRecording();

      if (uri) {
        setIsSynthesizing(true);
        try {
          const text = await transcribeAudio(uri);
          if (text) {
            setInputText(text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (transcribeErr) {
          console.error("Transcription failed", transcribeErr);
          Alert.alert(
            "Voice Error",
            "I couldn't hear you clearly. Please try again.",
          );
        } finally {
          setIsSynthesizing(false);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSynthesizing) return;

    const userText = inputText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Check if the input is a URL
    const urlMatch = userText.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      setScrapingUrl(url);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "I see a job link! Let me analyze the requirements to tailor your resume perfectly...",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Save answer
    const newAnswers = {
      ...collectedAnswers,
      [QUESTIONS[currentStep].key]: userText,
    };
    setCollectedAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      // Move to next question
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        // If the next step is a video step, we don't add to chat messages
        // But if it's a chat step, we do.
        if (!QUESTIONS[nextStep].videoUri) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: QUESTIONS[nextStep].question,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 800);
    } else {
      // Last question answered, trigger AI Synthesis
      handleFinalSynthesis(newAnswers);
    }
  };

  const handleVideoStepSubmit = () => {
    let userText = inputText.trim();

    // Special handling for Education step
    if (QUESTIONS[currentStep].id === "education") {
      const { college, degree, year } = localEdu;
      if (college || degree || year) {
        userText = `${college || "[Unknown College]"}, ${degree || "[Degree]"} (${year || "[Year]"})`;
      }
    }

    // Special handling for Skills step
    if (QUESTIONS[currentStep].id === "skills") {
      let parts = [];
      if (localSkills.length > 0) {
        parts.push(`Skills: ${localSkills.join(", ")}`);
      }
      if (localTools.length > 0) {
        parts.push(`Tools/Software: ${localTools.join(", ")}`);
      }
      userText = parts.join(" | ") || "Not provided";
    }

    // Special handling for Experience step
    if (QUESTIONS[currentStep].id === "experience") {
      if (localExperience.length > 0) {
        userText = localExperience
          .map(
            (exp) =>
              `${exp.role} at ${exp.company} (${exp.duration}). Responsibilities: ${exp.description}`,
          )
          .join(" | ");
      }
    }

    // Special handling for Projects/Certs step
    if (QUESTIONS[currentStep].id === "projects_certs") {
      const pText = localProjects
        .map((p) => `${p.name}: ${p.description}`)
        .join(", ");
      const cText = localCerts.join(", ");
      userText = `Projects: ${pText || "None"} | Certifications: ${cText || "None"}`;
    }

    userText = userText || "Not provided";
    const newAnswers = {
      ...collectedAnswers,
      [QUESTIONS[currentStep].key]:
        QUESTIONS[currentStep].id === "experience_level"
          ? `${inputText} (Name: ${userName}, Role: ${expForm.role})`
          : userText,
    };
    // Save current step data to history
    const stepId = QUESTIONS[currentStep].id;
    setStepHistory((prev) => ({
      ...prev,
      [stepId]: {
        inputText,
        userName,
        localEdu,
        expForm,
        localSkills,
        localTools,
        localExperience,
        localProjects,
        localCerts,
      },
    }));

    setCollectedAnswers(newAnswers);
    // Removed immediate state resets here, useEffect handles rehydration/clearing

    const nextStep = currentStep + 1;

    // Skip 'experience' step if user is a Fresher
    if (
      QUESTIONS[nextStep]?.id === "experience" &&
      newAnswers.experience_level === "Fresher"
    ) {
      setCurrentStep(nextStep + 1);
    } else {
      setCurrentStep(nextStep);
    }

    // If next step is NOT a video step, initialize chat messages
    if (!QUESTIONS[nextStep]?.videoUri) {
      setMessages([
        ...Object.keys(newAnswers).map((key, idx) => ({
          id: `v-ans-${idx}`,
          text: newAnswers[key],
          sender: "user" as const,
          timestamp: new Date(),
        })),
        {
          id: `q-${nextStep}`,
          text: QUESTIONS[nextStep].question,
          sender: "ai" as const,
          timestamp: new Date(),
        },
      ]);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleFinalSynthesis = async (allAnswers: any) => {
    if (!isPro) {
      Alert.alert(
        "Premium AI Feature",
        "AI Synthesis is a pro feature. Watch one short ad to unlock it for this resume?",
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
    setIsSynthesizing(true);
    const thinkingMsg: Message = {
      id: "synth",
      text: "Synthesis ongoing... I'm weaving your professional story into an elite resume structure.",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const messages = [
        {
          role: "system" as const,
          content:
            "You are an elite resume architect. Analyze interview answers and generate a high-end JSON resume.",
        },
        {
          role: "user" as const,
          content: `
            ${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription.substring(0, 2000)}` : ""}
            INTERVIEW ANSWERS: ${JSON.stringify(allAnswers)}
            
            REQUIREMENTS:
            1. Tailor the summary and experience bullet points to match the keywords and skills required.
            2. Return ONLY valid JSON:
            {
              "name": "string",
              "role": "string",
              "phone": "string",
              "email": "string",
              "location": "string",
              "website": "string",
              "summary": "string (professional & high-impact)",
              "experience": [{"title": "string", "company": "string", "description": "string (bullet points with achievements)"}],
              "skills": ["string"],
              "tools": ["string"],
              "education": [{"degree": "string", "school": "string", "year": "string"}],
              "projects": [{"name": "string", "description": "string", "link": "string"}],
              "certifications": [{"title": "string", "issuer": "string", "year": "string"}]
            }
          `,
        },
      ];

      const resultText = await callAI(messages, { jsonMode: true });
      const result = JSON.parse(resultText);

      await saveChatSession({
        messages: [...messages, thinkingMsg],
        collectedAnswers: allAnswers,
        resumeData: result,
      }).catch(err => console.warn("Could not save chat session:", err));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.push({
        pathname: "/builder/manual",
        params: { initialData: JSON.stringify(result) },
      });
    } catch (error) {
      console.error("Chat Synthesis Error:", error);
      const errorMsg: Message = {
        id: "err",
        text: "I encountered a neural synchronization error. Let's try to complete your profile manually.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (QUESTIONS[currentStep]?.videoUri) {
    return (
      <View style={styles.fullScreenVideoContainer}>
        <StatusBar style="light" />
        <Video
          ref={videoRef}
          key={`video-step-${currentStep}`}
          source={QUESTIONS[currentStep].videoUri}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isLooping={false}
          rate={0.9}
          volume={1.0}
          onPlaybackStatusUpdate={(status: any) => {
            if (status.isLoaded) {
              const remaining = Math.max(
                0,
                Math.ceil(
                  (status.durationMillis - status.positionMillis) / 1000,
                ),
              );
              setRemainingTime(remaining);
            }
            if (status.didJustFinish) {
              setVideoEnded(true);
              setRemainingTime(0);
            }
          }}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.videoOverlay}
        />

        <TouchableOpacity
          style={[styles.backButtonAbsolute, { top: insets.top + 10 }]}
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            } else {
              router.back();
            }
          }}
        >
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>

        {remainingTime !== null && remainingTime > 0 && !videoEnded && (
          <Animated.View
            entering={FadeInRight.springify()}
            style={[styles.countdownBadge, { top: insets.top + 10 }]}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.countdownText}>{remainingTime}s</Text>
          </Animated.View>
        )}

        {!videoEnded && (
          <TouchableOpacity
            style={[styles.skipVideoBtn, { top: insets.top + 10 }]}
            onPress={async () => {
              if (videoRef.current) {
                try {
                  await videoRef.current.stopAsync();
                } catch (e) {
                  console.log(e);
                }
              }
              setVideoEnded(true);
              setRemainingTime(0);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text style={styles.skipVideoText}>Skip</Text>
            <Sparkles size={12} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.videoContent}
        >
          <Animated.View
            entering={FadeInUp.springify().duration(800)}
            style={styles.videoQuestionBox}
          >
            <View style={styles.roboTag}>
              <Sparkles size={14} color={Theme.colors.primary} />
              <Text style={styles.roboTagText}>AI ARCHITECT</Text>
            </View>
            <Text style={styles.videoQuestionText}>
              {QUESTIONS[currentStep].question}
            </Text>

            {videoEnded && (
              <Animated.View entering={FadeInUp} style={{ width: "100%" }}>
                {QUESTIONS[currentStep].id === "experience_level" && (
                  <View style={styles.experienceSelectionContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={[styles.videoInput, { marginBottom: 10 }]}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={userName}
                      onChangeText={(t) => setUserName(t)}
                    />
                    <Text style={styles.inputLabel}>Target Job Role</Text>
                    <TextInput
                      style={[styles.videoInput, { marginBottom: 15 }]}
                      placeholder="e.g. Frontend Developer"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={expForm.role}
                      onChangeText={(t) => setExpForm({ ...expForm, role: t })}
                    />

                    <View style={styles.videoButtonRow}>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          inputText === "Fresher" && styles.activeTypeBtn,
                        ]}
                        onPress={() => {
                          setInputText("Fresher");
                          if (expForm.role)
                            setTimeout(handleVideoStepSubmit, 200);
                        }}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            inputText === "Fresher" && styles.activeTypeBtnText,
                          ]}
                        >
                          I am Fresher
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          inputText.includes("Experienced") &&
                            styles.activeTypeBtn,
                        ]}
                        onPress={() => {
                          setInputText("Experienced: ");
                        }}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            inputText.includes("Experienced") &&
                              styles.activeTypeBtnText,
                          ]}
                        >
                          Experienced
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {inputText.includes("Experienced") && (
                      <Animated.View
                        entering={FadeInUp}
                        style={styles.yearsGrid}
                      >
                        {["1", "2", "3", "4", "5", "10+"].map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={styles.yearChip}
                            onPress={() => {
                              const val = `Experienced: ${year} Years`;
                              setInputText(val);
                              if (expForm.role)
                                setTimeout(handleVideoStepSubmit, 200);
                            }}
                          >
                            <Text style={styles.yearChipText}>{year}</Text>
                          </TouchableOpacity>
                        ))}
                      </Animated.View>
                    )}

                    {expForm.role && localEdu.degree && inputText && (
                      <TouchableOpacity
                        style={[
                          styles.videoNextBtn,
                          { marginTop: 20, width: "100%" },
                        ]}
                        onPress={handleVideoStepSubmit}
                      >
                        <LinearGradient
                          colors={[
                            Theme.colors.primary,
                            Theme.colors.secondary,
                          ]}
                          style={styles.videoNextGradient}
                        >
                          <Text style={styles.videoNextText}>Next Step</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {QUESTIONS[currentStep].id === "education" && (
                  <View style={styles.eduInputContainer}>
                    <Text style={styles.inputLabel}>College / University</Text>
                    <TextInput
                      style={styles.videoInput}
                      placeholder="Enter your college name..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={localEdu.college}
                      onChangeText={(t) =>
                        setLocalEdu({ ...localEdu, college: t })
                      }
                    />
                    <View style={styles.eduRow}>
                      <TextInput
                        style={[styles.videoInput, { flex: 2 }]}
                        placeholder="Degree (e.g. B.Tech)"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={localEdu.degree}
                        onChangeText={(t) =>
                          setLocalEdu({ ...localEdu, degree: t })
                        }
                      />
                      <TextInput
                        style={[styles.videoInput, { flex: 1.5 }]}
                        placeholder="e.g. 2023 - 2024"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={localEdu.year}
                        onChangeText={(t) =>
                          setLocalEdu({ ...localEdu, year: t })
                        }
                      />
                    </View>
                  </View>
                )}

                {QUESTIONS[currentStep].id === "skills" && (
                  <View style={styles.skillsInputContainer}>
                    <View style={styles.skillTypeToggle}>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          skillType === "technical" && styles.activeTypeBtn,
                        ]}
                        onPress={() => setSkillType("technical")}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            skillType === "technical" &&
                              styles.activeTypeBtnText,
                          ]}
                        >
                          Technical
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          skillType === "soft" && styles.activeTypeBtn,
                        ]}
                        onPress={() => setSkillType("soft")}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            skillType === "soft" && styles.activeTypeBtnText,
                          ]}
                        >
                          Non-Technical
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          skillType === "tools" && styles.activeTypeBtn,
                        ]}
                        onPress={() => setSkillType("tools")}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            skillType === "tools" && styles.activeTypeBtnText,
                          ]}
                        >
                          Tools
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.skillsChipGrid}>
                      {(skillType === "tools" ? localTools : localSkills).map((skill, index) => (
                        <TouchableOpacity
                          key={`skill-${index}`}
                          style={styles.skillChip}
                          onPress={() =>
                            skillType === "tools"
                              ? setLocalTools(localTools.filter((_, i) => i !== index))
                              : setLocalSkills(localSkills.filter((_, i) => i !== index))
                          }
                        >
                          <Text style={styles.skillChipText}>{skill}</Text>
                          <X size={12} color="#fff" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.videoInputRow}>
                      <TextInput
                        style={[styles.videoInput, { flex: 1 }]}
                        placeholder={
                          skillType === "technical"
                            ? "e.g. React, Python"
                            : skillType === "soft"
                              ? "e.g. Teamwork, Leadership"
                              : "e.g. Git, VS Code, Figma"
                        }
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => {
                          if (inputText.trim()) {
                            if (skillType === "tools") {
                              setLocalTools([...localTools, inputText.trim()]);
                            } else {
                              setLocalSkills([...localSkills, inputText.trim()]);
                            }
                            setInputText("");
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={styles.skillAddBtn}
                        onPress={() => {
                          if (inputText.trim()) {
                            if (skillType === "tools") {
                              setLocalTools([...localTools, inputText.trim()]);
                            } else {
                              setLocalSkills([...localSkills, inputText.trim()]);
                            }
                            setInputText("");
                          }
                        }}
                      >
                        <Plus size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.suggestionGrid}>
                      {(skillType === "technical"
                        ? ["React", "Python", "SQL", "JavaScript", "Cloud"]
                        : skillType === "soft"
                          ? [
                              "Teamwork",
                              "Leadership",
                              "Communication",
                              "Agile",
                              "English",
                            ]
                          : ["Git", "VS Code", "Figma", "Docker", "Postman"]
                      )
                        .filter((s) => !(skillType === "tools" ? localTools : localSkills).includes(s))
                        .map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={styles.suggestionChip}
                            onPress={() =>
                              skillType === "tools"
                                ? setLocalTools([...localTools, s])
                                : setLocalSkills([...localSkills, s])
                            }
                          >
                            <Text style={styles.suggestionText}>+ {s}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.videoNextBtn,
                        { marginTop: 15, width: "100%" },
                      ]}
                      onPress={handleVideoStepSubmit}
                      disabled={localSkills.length === 0 && localTools.length === 0 && !inputText.trim()}
                    >
                      <LinearGradient
                        colors={[Theme.colors.primary, Theme.colors.secondary]}
                        style={styles.videoNextGradient}
                      >
                        <Text style={styles.videoNextText}>
                          Save {localSkills.length + localTools.length} Skills & Next
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {QUESTIONS[currentStep].id === "experience" && (
                  <View style={styles.experienceInputContainer}>
                    {localExperience.length > 0 && (
                      <FlatList
                        data={localExperience}
                        keyExtractor={(_, i) => `exp-${i}`}
                        style={{ maxHeight: 90, marginBottom: 8 }}
                        renderItem={({ item, index }) => (
                          <View style={styles.expItem}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.expItemTitle}>
                                {item.role}
                              </Text>
                              <Text style={styles.expItemSub}>
                                {item.company}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() =>
                                setLocalExperience(
                                  localExperience.filter((_, i) => i !== index),
                                )
                              }
                            >
                              <X size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      />
                    )}

                    {localExperience.length < 3 && (
                      <View style={styles.expForm}>
                        <TextInput
                          style={[
                            styles.videoInput,
                            { height: 40, fontSize: 14, marginBottom: 6 },
                          ]}
                          placeholder="Company"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={expForm.company}
                          onChangeText={(t) =>
                            setExpForm({ ...expForm, company: t })
                          }
                        />
                        <View style={styles.eduRow}>
                          <TextInput
                            style={[
                              styles.videoInput,
                              { height: 40, fontSize: 14, flex: 2 },
                            ]}
                            placeholder="Role"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={expForm.role}
                            onChangeText={(t) =>
                              setExpForm({ ...expForm, role: t })
                            }
                          />
                          <TextInput
                            style={[
                              styles.videoInput,
                              { height: 40, fontSize: 14, flex: 1.5 },
                            ]}
                            placeholder="e.g. 2023 - 2024"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={expForm.duration}
                            onChangeText={(t) =>
                              setExpForm({ ...expForm, duration: t })
                            }
                          />
                        </View>
                        <TextInput
                          style={[
                            styles.videoInput,
                            {
                              height: 60,
                              fontSize: 13,
                              marginTop: 6,
                              paddingTop: 10,
                            },
                          ]}
                          placeholder="What did you do? (Key achievements...)"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          multiline
                          value={expForm.description}
                          onChangeText={(t) =>
                            setExpForm({ ...expForm, description: t })
                          }
                        />
                        <TouchableOpacity
                          style={[
                            styles.addExpBtn,
                            { height: 36, marginTop: 8 },
                          ]}
                          onPress={() => {
                            if (expForm.company && expForm.role) {
                              setLocalExperience([
                                ...localExperience,
                                { ...expForm },
                              ]);
                              setExpForm({
                                company: "",
                                role: "",
                                duration: "",
                                description: "",
                              });
                            }
                          }}
                        >
                          <Plus size={16} color="#fff" />
                          <Text
                            style={[styles.addExpBtnText, { fontSize: 12 }]}
                          >
                            Add Entry
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.videoNextBtn,
                        { marginTop: 15, width: "100%" },
                      ]}
                      onPress={handleVideoStepSubmit}
                      disabled={false}
                    >
                      <LinearGradient
                        colors={[Theme.colors.primary, Theme.colors.secondary]}
                        style={styles.videoNextGradient}
                      >
                        <Text style={styles.videoNextText}>
                          {localExperience.length === 0
                            ? "Skip Experience"
                            : `Save ${localExperience.length} & Next`}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {QUESTIONS[currentStep].id === "projects_certs" && (
                  <View style={styles.experienceInputContainer}>
                    <View style={styles.skillTypeToggle}>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          projType === "project" && styles.activeTypeBtn,
                        ]}
                        onPress={() => setProjType("project")}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            projType === "project" && styles.activeTypeBtnText,
                          ]}
                        >
                          Projects
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          projType === "cert" && styles.activeTypeBtn,
                        ]}
                        onPress={() => setProjType("cert")}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            projType === "cert" && styles.activeTypeBtnText,
                          ]}
                        >
                          Certificates
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      data={projType === "project" ? localProjects : localCerts}
                      keyExtractor={(_, i) => `pc-${i}`}
                      style={{ maxHeight: 80, marginBottom: 8 }}
                      renderItem={({ item, index }) => (
                        <View style={styles.expItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expItemTitle}>
                              {projType === "project" ? item.name : item}
                            </Text>
                            {projType === "project" && (
                              <Text style={styles.expItemSub}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              if (projType === "project")
                                setLocalProjects(
                                  localProjects.filter((_, i) => i !== index),
                                );
                              else
                                setLocalCerts(
                                  localCerts.filter((_, i) => i !== index),
                                );
                            }}
                          >
                            <X size={14} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    />

                    <View style={styles.expForm}>
                      <TextInput
                        style={[
                          styles.videoInput,
                          { height: 40, fontSize: 14, marginBottom: 6 },
                        ]}
                        placeholder={
                          projType === "project"
                            ? "Project Name"
                            : "Certificate Name"
                        }
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={inputText}
                        onChangeText={setInputText}
                      />
                      {projType === "project" && (
                        <TextInput
                          style={[
                            styles.videoInput,
                            {
                              height: 50,
                              fontSize: 13,
                              marginTop: 2,
                              paddingTop: 8,
                            },
                          ]}
                          placeholder="Brief description..."
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          multiline
                          value={expForm.description}
                          onChangeText={(t) =>
                            setExpForm({ ...expForm, description: t })
                          }
                        />
                      )}
                      <TouchableOpacity
                        style={[styles.addExpBtn, { height: 36, marginTop: 8 }]}
                        onPress={() => {
                          if (inputText.trim()) {
                            if (projType === "project") {
                              setLocalProjects([
                                ...localProjects,
                                {
                                  name: inputText.trim(),
                                  description: expForm.description,
                                },
                              ]);
                            } else {
                              setLocalCerts([...localCerts, inputText.trim()]);
                            }
                            setInputText("");
                            setExpForm({ ...expForm, description: "" });
                          }
                        }}
                      >
                        <Plus size={16} color="#fff" />
                        <Text style={[styles.addExpBtnText, { fontSize: 12 }]}>
                          Add to List
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.videoNextBtn,
                        { marginTop: 15, width: "100%" },
                      ]}
                      onPress={handleVideoStepSubmit}
                    >
                      <LinearGradient
                        colors={[Theme.colors.primary, Theme.colors.secondary]}
                        style={styles.videoNextGradient}
                      >
                        <Text style={styles.videoNextText}>
                          Save & Continue
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {QUESTIONS[currentStep].id !== "education" &&
                  QUESTIONS[currentStep].id !== "skills" &&
                  QUESTIONS[currentStep].id !== "experience" &&
                  QUESTIONS[currentStep].id !== "projects_certs" &&
                  QUESTIONS[currentStep].id !== "experience_level" &&
                  QUESTIONS[currentStep].id !== "generate" && (
                    <View style={styles.videoInputRow}>
                      <TextInput
                        style={[styles.videoInput, { flex: 1 }]}
                        placeholder="Type your answer here..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={inputText}
                        onChangeText={setInputText}
                      />
                      <TouchableOpacity
                        style={styles.videoNextBtn}
                        onPress={handleVideoStepSubmit}
                      >
                        <LinearGradient
                          colors={[
                            Theme.colors.primary,
                            Theme.colors.secondary,
                          ]}
                          style={styles.videoNextGradient}
                        >
                          <Text style={styles.videoNextText}>Next</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                {QUESTIONS[currentStep].id === "education" && (
                  <TouchableOpacity
                    style={[
                      styles.videoNextBtn,
                      { marginTop: 10, alignSelf: "flex-end", width: "100%" },
                    ]}
                    onPress={handleVideoStepSubmit}
                  >
                    <LinearGradient
                      colors={[Theme.colors.primary, Theme.colors.secondary]}
                      style={styles.videoNextGradient}
                    >
                      <Text style={styles.videoNextText}>
                        Save Education Details
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {QUESTIONS[currentStep].id === "experience" && (
                  <TouchableOpacity
                    style={styles.fresherButton}
                    onPress={() => {
                      setInputText("I am a Fresher / No previous experience");
                      setTimeout(handleVideoStepSubmit, 100);
                    }}
                  >
                    <Text style={styles.fresherButtonText}>I am a Fresher</Text>
                  </TouchableOpacity>
                )}

                {QUESTIONS[currentStep].id === "projects_certs" && (
                  <View style={styles.videoButtonRow}>
                    <TouchableOpacity
                      style={styles.videoActionBtn}
                      onPress={() => {
                        setInputText("Project: [Enter Details]");
                      }}
                    >
                      <Text style={styles.videoActionBtnText}>Add Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.videoActionBtn}
                      onPress={() => {
                        setInputText("Certification: [Enter Details]");
                      }}
                    >
                      <Text style={styles.videoActionBtnText}>
                        Add Certification
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {QUESTIONS[currentStep].id === "generate" && videoEnded && (
                  <Animated.View entering={FadeInUp.springify()}>
                    <TouchableOpacity
                      style={[
                        styles.videoNextBtn,
                        { marginTop: 20, width: "100%", height: 60 },
                      ]}
                      onPress={() => handleFinalSynthesis(collectedAnswers)}
                    >
                      <LinearGradient
                        colors={["#f59e0b", "#d97706"]}
                        style={styles.videoNextGradient}
                      >
                        <Sparkles
                          size={24}
                          color="#fff"
                          style={{ marginRight: 12 }}
                        />
                        <Text style={[styles.videoNextText, { fontSize: 20 }]}>
                          BUILD ELITE RESUME
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <BrainCircuit size={18} color={Theme.colors.primary} />
              <Text style={[styles.headerText, { color: colors.text }]}>
                AI Chat Architect
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowHistory(true)}
              style={styles.backButton}
            >
              <History color={colors.text} size={22} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Hidden Scraper */}
      {scrapingUrl && (
        <View style={{ height: 0, width: 0, opacity: 0, position: "absolute" }}>
          <WebView
            source={{ uri: scrapingUrl }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={`
              setTimeout(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'url_scraped',
                  text: document.body.innerText.substring(0, 5000)
                }));
              }, 4000);
            `}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "url_scraped") {
                  setJobDescription(data.text);
                  setScrapingUrl(null);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      text:
                        "Got it! I've analyzed the job. Let's continue. " +
                        QUESTIONS[currentStep].question,
                      sender: "ai",
                      timestamp: new Date(),
                    },
                  ]);
                }
              } catch (e) {
                console.error("Scraping error", e);
              }
            }}
          />
        </View>
      )}

      <LinearGradient
        colors={isDark ? ["#000d1a", "#121212"] : ["#f0f9ff", "#ffffff"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            { paddingTop: insets.top + 70 },
          ]}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => (
            <Animated.View
              entering={item.sender === "user" ? FadeInRight : FadeInLeft}
              layout={Layout.springify()}
              style={[
                styles.messageWrapper,
                item.sender === "user" ? styles.userWrapper : styles.aiWrapper,
              ]}
            >
              {item.sender === "ai" && (
                <View
                  style={[
                    styles.avatarBox,
                    { backgroundColor: Theme.colors.primary },
                  ]}
                >
                  <Bot size={16} color="#fff" />
                </View>
              )}

              <GlassCard
                intensity={isDark ? 20 : 10}
                style={[
                  styles.messageCard,
                  item.sender === "user" ? styles.userCard : styles.aiCard,
                  {
                    backgroundColor:
                      item.sender === "user"
                        ? isDark
                          ? "rgba(99, 102, 241, 0.2)"
                          : "#eef2ff"
                        : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#ffffff",
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                {item.videoUri && (
                  <Video
                    source={item.videoUri}
                    style={styles.messageVideo}
                    resizeMode={ResizeMode.COVER}
                    useNativeControls
                    shouldPlay={item.id === "intro-video"}
                    isLooping
                  />
                )}
                {item.id === "synth" && (
                  <ActivityIndicator
                    size="small"
                    color={Theme.colors.primary}
                    style={{ marginBottom: 8 }}
                  />
                )}
                <Text style={[styles.messageText, { color: colors.text }]}>
                  {item.text}
                </Text>
              </GlassCard>

              {item.sender === "user" && (
                <View
                  style={[
                    styles.avatarBox,
                    { backgroundColor: Theme.colors.secondary },
                  ]}
                >
                  <User size={16} color="#fff" />
                </View>
              )}
            </Animated.View>
          )}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={[styles.typingText, { color: colors.textMuted }]}>
                  Architect is thinking...
                </Text>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <GlassCard
            intensity={60}
            style={[styles.inputCard, { borderColor: colors.glassBorder }]}
          >
            <View style={styles.inputPrefix}>
              <Sparkles size={20} color={Theme.colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Message your AI Architect..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isSynthesizing}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={inputText.trim() ? handleSend : undefined}
              onPressIn={!inputText.trim() ? startRecording : undefined}
              onPressOut={!inputText.trim() ? stopRecording : undefined}
              disabled={isSynthesizing}
            >
              <LinearGradient
                colors={
                  isSynthesizing
                    ? ["#64748b", "#475569"]
                    : isRecording
                      ? ["#ef4444", "#dc2626"]
                      : [Theme.colors.primary, Theme.colors.secondary]
                }
                style={[
                  styles.sendGradient,
                  isRecording && { transform: [{ scale: 1.1 }] },
                ]}
              >
                {isSynthesizing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : isRecording ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : inputText.trim() ? (
                  <Send size={20} color="#fff" />
                ) : (
                  <Mic size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.container, { backgroundColor: colors.background, padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS === 'ios' ? 20 : 0 }}>
            <Text style={[styles.headerText, { color: colors.text, fontSize: 24 }]}>Chat Sessions</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={{ padding: 8 }}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          {chatSessions.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>No chat sessions found.</Text>
            </View>
          ) : (
            <FlatList
              data={chatSessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.glassBorder
                  }}
                  onPress={() => {
                    if (item.messages) setMessages(item.messages);
                    if (item.collectedAnswers) setCollectedAnswers(item.collectedAnswers);
                    setCurrentStep(QUESTIONS.length - 1);
                    setVideoEnded(true);
                    setShowHistory(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Resume Chat Session</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>{item.date || new Date(item.createdAt?.seconds * 1000).toLocaleString()}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { fontSize: 18, fontWeight: "800" },
  backButton: { marginLeft: 16 },
  messageList: { padding: 20, paddingBottom: 120 },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  messageCard: { padding: 16, borderRadius: 20, borderWidth: 1 },
  userCard: { borderBottomRightRadius: 4 },
  aiCard: { borderBottomLeftRadius: 4 },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  messageVideo: {
    width: width * 0.65,
    height: width * 0.65 * (9 / 16),
    borderRadius: 12,
    marginBottom: 10,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 65,
    marginBottom: 20,
  },
  typingText: { fontSize: 12, fontWeight: "600" },
  inputContainer: { padding: 20, paddingTop: 10 },
  inputCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputPrefix: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(216, 27, 96, 0.1)",
    borderRadius: 22,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    fontWeight: "500",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledSend: { opacity: 0.6 },
  fullScreenVideoContainer: { flex: 1, backgroundColor: "#000" },
  videoOverlay: { ...StyleSheet.absoluteFillObject },
  videoContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 30,
    paddingBottom: 50,
  },
  videoQuestionBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roboTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  roboTagText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  videoQuestionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    marginBottom: 20,
  },
  videoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  videoInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: "100%",
  },
  videoNextBtn: {
    height: 50,
    borderRadius: 15,
    overflow: "hidden",
    minWidth: 80,
  },
  videoNextGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  videoNextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  fresherButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  fresherButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  videoButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 15,
  },
  videoActionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  videoActionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  activeActionBtn: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  experienceSelectionContainer: {
    marginBottom: 15,
  },
  yearsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    minWidth: 45,
    alignItems: "center",
  },
  yearChipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  eduInputContainer: {
    gap: 12,
    marginBottom: 5,
  },
  eduRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  inputLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  skillsInputContainer: {
    gap: 12,
    marginBottom: 5,
  },
  skillsChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillChipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  skillAddBtn: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  suggestionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  skillTypeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTypeBtn: {
    backgroundColor: Theme.colors.primary,
  },
  typeBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },
  activeTypeBtnText: {
    color: "#fff",
  },
  experienceInputContainer: {
    gap: 10,
  },
  expItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  expItemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  expItemSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  expForm: {
    gap: 4,
  },
  addExpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    height: 44,
    borderRadius: 12,
    marginTop: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  addExpBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  backButtonAbsolute: {
    position: "absolute",
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownBadge: {
    position: "absolute",
    right: 20,
    zIndex: 100,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  countdownText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  skipVideoBtn: {
    position: "absolute",
    right: 100,
    zIndex: 100,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  skipVideoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
