import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Mic, Send, Sparkles, Volume2, X, Power, MessageSquare, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { AudioService } from '@/services/audio';
import { transcribeAudio, callAI } from '@/services/ai';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [isAwake, setIsAwake] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [collectedData, setCollectedData] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const glowValue = useSharedValue(1);
  const robotScale = useSharedValue(1.1);

  useFocusEffect(
    React.useCallback(() => {
      // Screen focused
      return () => {
        // Screen unfocused
        Speech.stop();
        AudioService.hardReset();
      };
    }, [])
  );

  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      ),
      -1,
      true
    );

    // Auto-welcome
    const timer = setTimeout(() => {
      const welcome = "I'm ready! Tell me about your career, and I'll build your elite resume.";
      Speech.speak(welcome, { pitch: 1.0, rate: 0.9 });
    }, 500);

    return () => {
      clearTimeout(timer);
      Speech.stop();
      AudioService.hardReset();
    };
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: glowValue.value }],
    opacity: withTiming(isAwake ? (isRecording ? 0.8 : 0.4) : 0.1),
    backgroundColor: isAwake ? (isRecording ? '#EC829A' : Theme.colors.primary) : '#475569',
  }));

  const animatedRobot = useAnimatedStyle(() => ({
    transform: [{ scale: robotScale.value }],
    opacity: withTiming(isAwake ? 1 : 0.4),
  }));

  const handleWakeUp = () => {
    setIsAwake(true);
    robotScale.value = withSpring(1.1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const welcome = "I'm awake! Tell me about your career, and I'll build your elite resume.";
    Speech.speak(welcome, { pitch: 1.0, rate: 0.9 });
  };

  const handleStartRecording = async () => {
    if (!isAwake) return;
    try {
      await AudioService.startRecording((status) => {
        if (status.metering !== undefined) {
          const normalized = Math.max(0, (status.metering + 60) / 60);
          robotScale.value = withTiming(1.1 + normalized * 0.4, { duration: 100 });
        }
      });
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Speech.stop();
    } catch (err) {
      Alert.alert("Mic Error", "Could not access microphone.");
    }
  };

  const handleStopRecording = async () => {
    if (!isAwake) return;
    setIsRecording(false);
    setIsProcessing(true);
    robotScale.value = withSpring(1.1);
    try {
      const uri = await AudioService.stopRecording();
      if (uri) {
        const text = await transcribeAudio(uri);
        if (text) {
          setCollectedData(prev => [...prev, text]);
          processUserInput(text);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Transcription failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const [conversation, setConversation] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const processUserInput = async (text: string) => {
    // Add user message to history
    setConversation(prev => [...prev, { role: 'user', text }]);
    setCollectedData(prev => [...prev, text]);

    try {
      const response = await callAI([
        { 
          role: 'system', 
          content: 'You are an expert AI Career Architect. Support both English and Tamil (Tanglish). If the user speaks Tamil, respond in polite Tanglish/Tamil. Analyze the user input and ask ONE dynamic follow-up question to complete their resume profile (Experience, Skills, Education). If you have enough info, say: "Excellent! I have enough to build your resume. Ready to generate?"' 
        },
        { role: 'user', content: `User said: "${text}". Context: This is a resume interview.` }
      ], { jsonMode: false });
      
      // Add AI response to history
      setConversation(prev => [...prev, { role: 'ai', text: response }]);
      Speech.speak(response, { 
        pitch: 1.1, 
        rate: 0.95,
        language: text.match(/[\u0B80-\u0BFF]/) ? 'ta-IN' : 'en-US' 
      });

      if (response.toLowerCase().includes("ready to generate")) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Interview Complete",
          "The AI has gathered enough information. Would you like to generate your resume now?",
          [
            { text: "Talk More", style: "cancel" },
            { text: "Generate Now", onPress: handleFinalSynthesis }
          ]
        );
      }
    } catch (err) {}
  };

  const handleFinalSynthesis = async () => {
    if (collectedData.length === 0) return;
    setIsGenerating(true);
    try {
      const prompt = `Synthesize these interview transcripts into a high-end, professional JSON resume.
      TRANSCRIPTS: ${collectedData.join(" | ")}
      
      JSON SCHEMA:
      {
        "name": "string",
        "role": "string",
        "phone": "string",
        "email": "string",
        "location": "string",
        "website": "string",
        "summary": "string (professional & high-impact)",
        "experience": [{"role": "string", "company": "string", "period": "string", "description": "string"}],
        "skills": ["string"],
        "education": [{"school": "string", "degree": "string", "year": "string"}],
        "projects": [{"name": "string", "description": "string", "link": "string"}]
      }
      
      Return ONLY the JSON object. Ensure the content is professional and expanded where possible.`;

      const result = await callAI([
        { role: 'system', content: 'You are an elite Resume Data Synthesizer. Convert fragmented voice transcripts into polished, professional resume JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true });
      
      router.push({
        pathname: "/builder/manual",
        params: { initialData: result }
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Synthesis Error", "The neural network couldn't structure your resume. Try speaking more details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#000'] : ['#f1f5f9', '#fff']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backBtn}
      >
        <ChevronLeft color={colors.text} size={28} />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setShowHistory(true)} 
        style={styles.historyBtn}
      >
        <MessageSquare color={colors.text} size={24} />
      </TouchableOpacity>

      <View style={styles.robotContainer}>
        <Animated.View style={[styles.glowCircle, animatedGlow]} />
        <Animated.View style={animatedRobot}>
          <LottieView
            source={require('@/assets/Ai Robot Animation.json')}
            autoPlay
            loop
            style={styles.robotLottie}
          />
        </Animated.View>
      </View>

      <View style={styles.minimalFooter}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handleStartRecording}
          onPressOut={handleStopRecording}
          style={[styles.micBtnContainer, { opacity: isAwake ? 1 : 0.2 }]}
          disabled={!isAwake}
        >
          <LinearGradient
            colors={isRecording ? ['#EC829A', '#D81B60'] : [Theme.colors.primary, Theme.colors.secondary]}
            style={styles.micBtnLarge}
          >
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Mic color="#fff" size={40} />}
          </LinearGradient>
          <Text style={[styles.tapHint, { color: colors.text, marginTop: 15 }]}>
            {isRecording ? "I'M LISTENING..." : "HOLD TO TALK"}
          </Text>
        </TouchableOpacity>
        
        {collectedData.length > 0 && !isRecording && (
          <TouchableOpacity 
            onPress={handleFinalSynthesis}
            style={styles.generateFab}
          >
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.fabGradient}>
              {isGenerating ? <ActivityIndicator color="#fff" /> : <Sparkles color="#fff" size={24} />}
              <Text style={styles.fabText}>Generate Resume</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Interview Transcript</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeModalBtn}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              {conversation.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.text }]}>Speak to the AI to start your transcript.</Text>
              ) : (
                conversation.map((msg, i) => (
                  <View key={i} style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.bubbleLabel, { color: msg.role === 'user' ? '#fff' : Theme.colors.primary }]}>{msg.role === 'user' ? 'YOU' : 'ROBOT'}</Text>
                    <Text style={[styles.bubbleText, { color: msg.role === 'user' ? '#fff' : colors.text }]}>{msg.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 100, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  historyBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  robotContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  robotLottie: { width: width * 1.1, height: width * 1.1 },
  glowCircle: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: Theme.colors.primary + '15' },
  minimalFooter: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  micBtnContainer: { alignItems: 'center' },
  micBtnLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  tapHint: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5, opacity: 0.8 },
  generateFab: { marginTop: 30, width: width * 0.7 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 30, gap: 10 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '80%', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  closeModalBtn: { padding: 5 },
  historyScroll: { flex: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, fontWeight: '600' },
  msgBubble: { padding: 15, borderRadius: 20, marginBottom: 15, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Theme.colors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bubbleLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
});
