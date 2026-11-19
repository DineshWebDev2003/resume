import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { ChevronLeft, Sparkles, Trash2, Edit3 } from 'lucide-react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { AudioService } from '@/services/audio';
import { transcribeAudio, callAI } from '@/services/ai';
import { hasConfiguredAiApiKey, promptMissingApiKey } from '@/services/usageLimits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const RESUME_FIELDS = [
  'name', 'title', 'phone', 'email', 'location', 'website',
  'summary', 'experience', 'education', 'skills', 'languages',
  'projects', 'certifications', 'tools', 'interests',
] as const;

const SILENCE_TIMEOUT = 8000;
const SILENCE_THRESHOLD = -30;

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; role?: string; company?: string; description?: string }>();

  const isInterviewMode = params.mode === 'interview';
  const targetRole = (params.role as string) || 'Software Professional';
  const targetCompany = (params.company as string) || 'Company';
  const targetDescription = (params.description as string) || '';

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collectedFields, setCollectedFields] = useState<Set<string>>(new Set());
  const [resumeData, setResumeData] = useState<any>({});
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [interviewPhase, setInterviewPhase] = useState<'greeting' | 'collecting' | 'complete'>('greeting');
  const [conversation, setConversation] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const isActive = useRef(true);
  const welcomeSpoken = useRef(false);
  const skipCleanup = useRef(false);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTime = useRef(Date.now());
  const isRecordingRef = useRef(false);
  const conversationRef = useRef(conversation);
  const collectedFieldsRef = useRef(collectedFields);
  const resumeDataRef = useRef(resumeData);
  const scrollRef = useRef<ScrollView>(null);

  conversationRef.current = conversation;
  collectedFieldsRef.current = collectedFields;
  resumeDataRef.current = resumeData;

  const [lottieProgress, setLottieProgress] = useState(0);
  const animStartRef = useRef(Date.now());
  const introDoneRef = useRef(false);
  const glowValue = useSharedValue(1);

  // Load existing resume data on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('voice_assistant_draft');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.resumeData) setResumeData(data.resumeData);
          if (data.collectedFields) setCollectedFields(new Set(data.collectedFields));
          if (data.conversation) setConversation(data.conversation);
          if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
          if (data.interviewPhase) setInterviewPhase(data.interviewPhase);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
      AudioService.hardReset();
    };
  }, []);

  // Lottie animation
  useEffect(() => {
    const INTRO_END = 0.35;
    const LOOP_DURATION = 4500;
    let frame: number;
    const animate = () => {
      const elapsed = Date.now() - animStartRef.current;
      if (!introDoneRef.current) {
        if (elapsed >= 3000) {
          setLottieProgress(INTRO_END);
          introDoneRef.current = true;
          animStartRef.current = Date.now();
        } else {
          setLottieProgress((elapsed / 3000) * INTRO_END);
        }
      } else {
        const loopElapsed = (Date.now() - animStartRef.current) % LOOP_DURATION;
        setLottieProgress(INTRO_END + (loopElapsed / LOOP_DURATION) * (1 - INTRO_END));
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useFocusEffect(
    useCallback(() => {
      isActive.current = true;
      return () => {
        isActive.current = false;
        if (skipCleanup.current) {
          skipCleanup.current = false;
          return;
        }
        Speech.stop();
        AudioService.hardReset();
      };
    }, [])
  );

  // Greet first (no recording), then start listening after speech ends
  useEffect(() => {
    if (!welcomeSpoken.current) {
      welcomeSpoken.current = true;
      setTimeout(() => handleAutoGreeting(), 600);
    }
    return () => stopAutoListening();
  }, []);

  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 2500 }), withTiming(1, { duration: 2500 })),
      -1,
      true,
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: glowValue.value }],
    opacity: withTiming(isListening ? 0.8 : 0.2),
    backgroundColor: isListening ? '#FDA758' : '#A898A6',
  }));

  const detectLanguage = (text: string): string => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
    return 'en-US';
  };

  const speakThenListen = (text: string, onDone?: () => void) => {
    stopAutoListening();
    Speech.speak(text, {
      pitch: 0.55,
      rate: 0.85,
      language: detectLanguage(text),
      onDone: () => {
        if (onDone) onDone();
        startAutoListening();
      },
    });
  };

  // ─── Auto-listen with silence detection ───────────────
  const startAutoListening = async () => {
    if (!isActive.current || isRecordingRef.current) return;
    try {
      await AudioService.startRecording((status: any) => {
        if (status.metering !== undefined) {
          setAudioLevel(Math.max(0, (status.metering + 60) / 60));
          if (status.metering > SILENCE_THRESHOLD) {
            lastSpeechTime.current = Date.now();
            setIsListening(true);
          }
        }
      });
      isRecordingRef.current = true;
      setIsListening(true);
      lastSpeechTime.current = Date.now();
      resetSilenceTimer();
    } catch (err) {
      console.error('Auto-listen start failed:', err);
    }
  };

  const stopAutoListening = async () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    isRecordingRef.current = false;
    setIsListening(false);
    try {
      await AudioService.stopRecording();
    } catch {}
  };

  const resetSilenceTimer = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(handleSilenceTimeout, SILENCE_TIMEOUT);
  };

  const handleSilenceTimeout = async () => {
    if (!isRecordingRef.current) return;
    setIsListening(false);
    setIsProcessing(true);
    try {
      const uri = await AudioService.stopRecording();
      isRecordingRef.current = false;
      if (uri) {
        let text = await transcribeAudio(uri);
        if (text && text.trim().length > 0) {
          text = await grammarFix(text);
          await processUserInput(text);
          return;
        }
      }
      startAutoListening();
    } catch (err) {
      console.error('Silence processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const grammarFix = async (text: string): Promise<string> => {
    try {
      const fixed = await callAI([
        { role: 'system', content: 'Fix grammar and spelling in this text. Return ONLY the corrected text, nothing else. Keep the meaning identical.' },
        { role: 'user', content: text },
      ], { jsonMode: false });
      return fixed || text;
    } catch {
      return text;
    }
  };

  // ─── AI Greeting (onboarding with known fields / Interview Mode) ─────
  const handleAutoGreeting = async () => {
    try {
      const hasKey = await hasConfiguredAiApiKey();
      if (!hasKey) {
        promptMissingApiKey();
        return;
      }

      if (isInterviewMode) {
        const greeting = `Welcome to your mock interview for the ${targetRole} position at ${targetCompany}! I'll be your Senior Hiring Manager. I will ask you realistic technical and situational questions, and provide immediate feedback on your responses. Let's begin: please introduce yourself and summarize your experience relevant to this role.`;
        setCurrentQuestion(greeting);
        addMessage('ai', greeting);
        speakThenListen(greeting);
        setInterviewPhase('collecting');
        return;
      }

      const known = RESUME_FIELDS.filter(f => resumeDataRef.current[f]);
      let greeting: string;
      if (known.length > 0) {
        greeting = `Welcome back! I found some saved info:\n${known.map(f => `• ${f}: ${resumeDataRef.current[f]}`).join('\n')}\n\nI'll ask about each field. Let's start!`;
      } else {
        greeting = "Hi there! I'm your AI resume builder. Let's build your resume step by step. What's your name?";
      }
      setCurrentQuestion(greeting);
      addMessage('ai', greeting);
      speakThenListen(greeting);
      setInterviewPhase('collecting');
    } catch {
      const fallback = isInterviewMode
        ? `Hello! Welcome to your mock interview for ${targetRole} at ${targetCompany}. Could you please introduce yourself?`
        : "Hi there! I'm your AI resume builder. What's your name?";
      setCurrentQuestion(fallback);
      addMessage('ai', fallback);
      speakThenListen(fallback);
      setInterviewPhase('collecting');
    }
  };

  // ─── Conversation helpers ────────────────────────────
  const addMessage = (role: 'user' | 'ai', text: string) => {
    setConversation(prev => [...prev, { role, text }]);
  };

  const deleteMessage = (index: number) => {
    setConversation(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Process user input ──────────────────────────────
  const processUserInput = async (text: string) => {
    addMessage('user', text);

    try {
      const history = conversationRef.current.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: msg.text,
      }));

      // ── MOCK INTERVIEW MODE FLOW ──
      if (isInterviewMode) {
        const userAnswersCount = conversationRef.current.filter(m => m.role === 'user').length + 1;
        const isFinalWrapUp = userAnswersCount >= 5;

        const interviewPrompt = `You are a professional Senior Technical Hiring Manager at "${targetCompany}" interviewing a candidate for the role of "${targetRole}".
Job Context / Requirements: ${targetDescription || 'Focus on industry-standard engineering skills, problem solving, teamwork, and best practices.'}

Current Candidate Answer: "${text}"
Interview Progress: Answer #${userAnswersCount} of 5.

Instructions:
${
  isFinalWrapUp
    ? `1. Provide an overall interview scorecard summary.
2. Give an Interview Rating (e.g., 8.5/10), mentioning 2 key strengths and 1 area of improvement.
3. Congratulate them on completing the mock interview.`
    : `1. Give 1 sentence of constructive, professional feedback on their answer (what was strong or what could be improved).
2. Ask the NEXT realistic interview question (mix of technical scenario, system design / coding concepts, or behavioral STAR questions).
3. Keep the total response concise (under 3 sentences) so the audio voice is snappy.`
}
Support English, Tamil, or Hindi if the user speaks in that language.`;

        const response = await callAI([
          { role: 'system', content: interviewPrompt },
          ...history,
          { role: 'user', content: text },
        ], { jsonMode: false });

        if (!isActive.current) return;
        const cleaned = response.trim();
        setCurrentQuestion(cleaned);
        addMessage('ai', cleaned);
        speakThenListen(cleaned);
        if (isFinalWrapUp) {
          setInterviewPhase('complete');
        }
        return;
      }

      const collectedSnapshot = { ...resumeDataRef.current };
      const collectedFieldsList = Array.from(collectedFieldsRef.current);

      const response = await callAI([
        {
          role: 'system',
          content: `You are an expert multilingual AI resume interviewer. Support English, Tamil, Hindi, Telugu, Malayalam, Kannada.

Already collected fields: ${collectedFieldsList.join(', ') || 'None'}
Existing data: ${JSON.stringify(collectedSnapshot)}

Field order: ${RESUME_FIELDS.join(', ')}

RULES:
- For fields that have a value already, say: "Found your {field} is {value}. Want to change it?"
- Ask ONE question at a time for missing fields
- Speak in user's language
- Be conversational and friendly
- If all fields collected, say: "EXCELLENT! All information collected. Tap Generate to create your resume."
- If user says "skip" or "next", move to next missing field`,
        },
        ...history,
        { role: 'user', content: `User said: "${text}". Extract fields, update data, ask next missing field.` },
      ], { jsonMode: false });

      if (!isActive.current) return;

      const extractionResult = await callAI([
        {
          role: 'system',
          content: `Extract resume fields from conversation. Return ONLY JSON:
{
  "fields": { "fieldName": "value" },
  "newFields": ["fieldName1"],
  "isComplete": false,
  "nextQuestion": "..."
}
fieldName must be one of: ${RESUME_FIELDS.join(', ')}. Set isComplete true only if ALL fields collected.`,
        },
        { role: 'user', content: `Current: ${JSON.stringify(collectedSnapshot)}\nUser: "${text}"\nAI: "${response}"` },
      ], { jsonMode: true });

      if (!isActive.current) return;

      const parsed = JSON.parse(typeof extractionResult === 'string' ? extractionResult : JSON.stringify(extractionResult));

      if (parsed.fields) setResumeData(prev => ({ ...prev, ...parsed.fields }));
      if (parsed.newFields) {
        setCollectedFields(prev => {
          const next = new Set(prev);
          parsed.newFields.forEach((f: string) => next.add(f));
          return next;
        });
      }

      if (parsed.isComplete) {
        setInterviewPhase('complete');
        const msg = "EXCELLENT! All information collected. Tap Generate to create your resume.";
        setCurrentQuestion(msg);
        addMessage('ai', msg);
        speakThenListen(msg);
      } else {
        setInterviewPhase('collecting');
        const q = parsed.nextQuestion || response;
        setCurrentQuestion(q);
        addMessage('ai', response);
        speakThenListen(response);
      }

      saveDraft();
    } catch (err) {
      if (isActive.current) console.error('Processing error:', err);
    }
  };

  // ─── Navigation & persistence ────────────────────────
  const handleBack = () => {
    skipCleanup.current = true;
    Speech.stop();
    AudioService.hardReset();
    saveDraft();
    router.back();
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem('voice_assistant_draft', JSON.stringify({
        resumeData,
        collectedFields: Array.from(collectedFields),
        conversation,
        currentQuestion,
        interviewPhase,
      }));
    } catch {}
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem('voice_assistant_draft');
    } catch {}
  };

  const handleNewChat = () => {
    Alert.alert('New Chat', 'This will clear the current conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start New',
        style: 'destructive',
        onPress: async () => {
          await clearDraft();
          setConversation([]);
          setCollectedFields(new Set());
          setResumeData({});
          setCurrentQuestion('');
          setInterviewPhase('greeting');
          welcomeSpoken.current = false;
          setTimeout(() => handleAutoGreeting(), 500);
        },
      },
    ]);
  };

  const handleFinalSynthesis = async () => {
    if (Object.keys(resumeData).length === 0) return;
    setIsGenerating(true);
    try {
      const prompt = `Synthesize resume data into professional JSON.
DATA: ${JSON.stringify(resumeData)}
SCHEMA: { name, title, role, phone, email, location, website, summary, experience: [{role,company,period,description}], skills, education: [{school,degree,year}], projects: [{name,description,link}], certifications: [{title,issuer,year}], languages, tools, interests }
Return ONLY JSON. Make ATS-optimized with action verbs.`;

      const result = await callAI([
        { role: 'system', content: 'You are an elite Resume Data Synthesizer.' },
        { role: 'user', content: prompt },
      ], { jsonMode: true });

      if (!isActive.current) return;
      await clearDraft();
      isActive.current = false;
      stopAutoListening();
      router.push({
        pathname: '/builder/manual',
        params: { importData: JSON.stringify(result) },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not structure resume.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: '#fff8f5' }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <ChevronLeft color="#FDA758" size={24} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>
            {isInterviewMode ? 'AI Mock Interview' : 'Voice Assistant'}
          </Text>
          {isInterviewMode && (
            <View style={{ backgroundColor: '#8B5CF620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#8B5CF6' }}>
                {targetRole} • {targetCompany}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
          <Edit3 color="#FDA758" size={20} />
        </TouchableOpacity>
      </View>

      {/* ── Lottie + Current Question ── */}
      <View style={styles.topSection}>
        <View style={styles.lottieRow}>
          <Animated.View style={[styles.glowCircle, animatedGlow]} />
          <LottieView
            source={require('@/assets/niu.json')}
            progress={lottieProgress}
            style={styles.robotLottie}
          />
        </View>
        {currentQuestion ? (
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>{isInterviewMode ? 'Hiring Manager' : 'AI says'}</Text>
            <Text style={styles.questionText} numberOfLines={4}>{currentQuestion}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Conversation History (inline, like ChatGPT) ── */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {conversation.map((msg, i) => (
            <View
              key={i}
              style={[styles.msgRow, msg.role === 'user' ? styles.userMsgRow : styles.aiMsgRow]}
            >
              <View
                style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
              >
                <Text style={[styles.bubbleLabel, { color: msg.role === 'user' ? '#ffffff90' : '#FDA758' }]}>
                  {msg.role === 'user' ? 'YOU (Candidate)' : isInterviewMode ? 'INTERVIEWER' : 'AI'}
                </Text>
                <Text style={[styles.bubbleText, { color: msg.role === 'user' ? '#fff' : '#573353' }]}>
                  {msg.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteMessage(i)} style={styles.deleteBtn}>
                <Trash2 size={13} color="#c0b0d0" />
              </TouchableOpacity>
            </View>
          ))}
          {isProcessing && (
            <View style={[styles.msgRow, styles.aiMsgRow]}>
              <View style={[styles.msgBubble, styles.aiBubble]}>
                <ActivityIndicator color="#FDA758" size="small" />
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Progress + Bottom Controls ── */}
      <View style={styles.bottomSection}>
        {isInterviewMode ? (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Interview Questions</Text>
              <Text style={[styles.progressCount, { color: '#8B5CF6' }]}>
                {Math.min(5, conversation.filter(m => m.role === 'user').length + 1)} / 5
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: '#8B5CF6',
                    width: `${Math.min(100, ((conversation.filter(m => m.role === 'user').length + 1) / 5) * 100)}%`,
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressCount}>{collectedFields.size}/{RESUME_FIELDS.length}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(collectedFields.size / RESUME_FIELDS.length) * 100}%` }]}
              />
            </View>
            <View style={styles.pillRow}>
              {RESUME_FIELDS.slice(0, 8).map(field => (
                <View
                  key={field}
                  style={[styles.fieldPill, { backgroundColor: collectedFields.has(field) ? 'rgba(253, 167, 88, 0.2)' : '#f1f0f0' }]}
                >
                  <Text
                    style={[styles.fieldPillText, { color: collectedFields.has(field) ? '#FDA758' : '#b0a8a8' }]}
                  >
                    {field === 'name' ? 'Name' : field === 'title' ? 'Title' : field === 'phone' ? 'Phone' : field === 'email' ? 'Email' : field === 'location' ? 'Loc' : field === 'summary' ? 'Sum' : field === 'experience' ? 'Exp' : field === 'education' ? 'Edu' : field.slice(0, 3)}
                  </Text>
                </View>
              ))}
              {RESUME_FIELDS.length > 8 && (
                <View style={[styles.fieldPill, { backgroundColor: '#f1f0f0' }]}>
                  <Text style={[styles.fieldPillText, { color: '#b0a8a8' }]}>+{RESUME_FIELDS.length - 8}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomRow}>
          {isProcessing ? (
            <ActivityIndicator color="#FDA758" size="large" />
          ) : isInterviewMode && interviewPhase === 'complete' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={[styles.generateBtn, { backgroundColor: '#8B5CF6' }]}
            >
              <Sparkles size={20} color="#fff" />
              <Text style={styles.generateBtnText}>Interview Complete • Back to Jobs</Text>
            </TouchableOpacity>
          ) : !isInterviewMode && interviewPhase === 'complete' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFinalSynthesis}
              disabled={isGenerating}
              style={[styles.generateBtn, { opacity: isGenerating ? 0.6 : 1 }]}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Sparkles size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Resume</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.micStatus}>
              <View style={[styles.micDot, { backgroundColor: isListening ? '#22c55e' : '#f87171' }]} />
              <Text style={styles.micLabel}>
                {isListening ? 'Listening...' : 'Processing...'}
              </Text>
              {isListening && (
                <View style={styles.waveform}>
                  <View style={[styles.waveBar, { height: 8 + audioLevel * 20 }]} />
                  <View style={[styles.waveBar, { height: 6 + audioLevel * 16 }]} />
                  <View style={[styles.waveBar, { height: 10 + audioLevel * 24 }]} />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 167, 88, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#573353',
  },
  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  lottieRow: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    width: 130,
  },
  robotLottie: { width: 110, height: 110 },
  glowCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  questionCard: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
  },
  questionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDA758',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#573353',
    lineHeight: 21,
  },

  // ─── Chat ─────────────────────────────────────────────
  chatContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  chatScroll: { flex: 1 },
  chatContent: { paddingBottom: 12 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 4,
  },
  userMsgRow: { justifyContent: 'flex-end' },
  aiMsgRow: { justifyContent: 'flex-start' },
  msgBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: '#FDA758',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFF6ED',
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
    borderBottomLeftRadius: 4,
  },
  bubbleLabel: { fontSize: 9, fontWeight: '900', marginBottom: 3 },
  bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF6ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  // ─── Progress ─────────────────────────────────────────
  bottomSection: { paddingHorizontal: 20, paddingBottom: 30 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#7a6f8a' },
  progressCount: { fontSize: 12, fontWeight: '800', color: '#FDA758' },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(87, 51, 83, 0.1)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FDA758', borderRadius: 3 },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  fieldPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11 },
  fieldPillText: { fontSize: 9, fontWeight: '700' },
  bottomRow: { alignItems: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDA758',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 26,
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    width: '100%',
    justifyContent: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  micStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  micLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7a6f8a',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#FDA758',
  },
});
