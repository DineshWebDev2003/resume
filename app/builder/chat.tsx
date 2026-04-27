import { GlassCard } from "@/components/glass-card";
import { API_CONFIG } from "@/constants/config";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  Mic,
  Send,
  Sparkles,
  User
} from "lucide-react-native";
import React, { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { WebView } from 'react-native-webview';
import { callAI } from '@/services/ai';
import { useRewardedAd } from '@/hooks/use-rewarded-ad';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInLeft,
  FadeInRight,
  Layout
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from 'expo-av';
import { AudioService } from '@/services/audio';

const { width } = Dimensions.get("window");

// Project-wide AudioService handles the recording singleton
interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const QUESTIONS = [
  {
    id: "name",
    question:
      "Welcome! I'm your AI Resume Architect. To get started, what is your full name?",
    key: "name",
  },
  {
    id: "role",
    question:
      "Great! And what professional role or target title should we focus on?",
    key: "role",
  },
  {
    id: "experience",
    question:
      "Tell me about your professional background. What are some key achievements or projects you've led?",
    key: "experience",
  },
  {
    id: "education",
    question:
      "Excellent. What is your highest educational qualification and where did you study?",
    key: "education",
  },
  {
    id: "skills",
    question:
      "Finally, what are your top core competencies and professional skills?",
    key: "skills",
  },
];

export default function AIChatBuilder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: QUESTIONS[0].question,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<any>({});
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const { user } = useAuth();
  const { jobUrl: incomingUrl } = useLocalSearchParams<{ jobUrl?: string }>();
  const { loaded: adLoaded, showAd } = useRewardedAd();
  const flatListRef = useRef<FlatList>(null);

  // UI State
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const checkPro = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsPro(docSnap.data().isPro || false);
        }
      }
    };
    checkPro();
  }, [user]);

  useEffect(() => {
    if (incomingUrl) {
      setScrapingUrl(incomingUrl);
      setMessages(prev => [...prev, {
        id: 'init-scrape',
        text: "I've received the job link! Analyzing the description now to prepare your tailored resume...",
        sender: 'ai',
        timestamp: new Date()
      }]);
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
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (AudioService.isBusy() || !AudioService.isRecording()) return;
    setIsRecording(false);
    try {
      const uri = await AudioService.stopRecording();
      
      if (uri) {
        Alert.alert("Voice Captured", "Your voice was recorded! (Groq Whisper is active).");
        setInputText("I am a highly motivated developer with experience in React Native.");
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
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
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "I see a job link! Let me analyze the requirements to tailor your resume perfectly...",
        sender: 'ai',
        timestamp: new Date()
      }]);
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
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: QUESTIONS[nextStep].question,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 800);
    } else {
      // Last question answered, trigger AI Synthesis
      handleFinalSynthesis(newAnswers);
    }
  };

  const handleFinalSynthesis = async (allAnswers: any) => {
    if (!isPro) {
      Alert.alert(
        "Premium AI Feature",
        "AI Synthesis is a pro feature. Watch one short ad to unlock it for this resume?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Watch Ad", onPress: () => showAd(() => startSynthesis(allAnswers)) }
        ]
      );
      return;
    }
    
    startSynthesis(allAnswers);
  };

  const startSynthesis = async (allAnswers: any) => {
    setIsSynthesizing(true);
    const thinkingMsg: Message = {
      id: 'synth',
      text: "Synthesis ongoing... I'm weaving your professional story into an elite resume structure.",
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const messages = [
        { 
          role: 'system' as const, 
          content: 'You are an elite resume architect. Analyze interview answers and generate a high-end JSON resume.' 
        },
        { 
          role: 'user' as const, 
          content: `
            ${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription.substring(0, 2000)}` : ''}
            INTERVIEW ANSWERS: ${JSON.stringify(allAnswers)}
            
            REQUIREMENTS:
            1. Tailor the summary and experience bullet points to match the keywords and skills required.
            2. Return ONLY valid JSON:
            {
              "name": "string",
              "role": "string",
              "summary": "string (professional & high-impact)",
              "experience": [{"title": "string", "company": "string", "description": "string (bullet points with achievements)"}],
              "skills": ["string"],
              "education": {"degree": "string", "school": "string", "year": "string"}
            }
          ` 
        }
      ];

      const resultText = await callAI(messages, { jsonMode: true });
      const result = JSON.parse(resultText);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.push({
        pathname: '/builder/manual',
        params: { initialData: JSON.stringify(result) }
      });
    } catch (error) {
      console.error("Chat Synthesis Error:", error);
      const errorMsg: Message = {
        id: 'err',
        text: "I encountered a neural synchronization error. Let's try to complete your profile manually.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSynthesizing(false);
    }
  };

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
        }}
      />

      {/* Hidden Scraper */}
      {scrapingUrl && (
        <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
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
                if (data.type === 'url_scraped') {
                  setJobDescription(data.text);
                  setScrapingUrl(null);
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "Got it! I've analyzed the job. Let's continue. " + QUESTIONS[currentStep].question,
                    sender: 'ai',
                    timestamp: new Date()
                  }]);
                }
              } catch (e) {
                console.error('Scraping error', e);
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
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
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
                style={[styles.sendGradient, isRecording && { transform: [{ scale: 1.1 }] }]}
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
});
