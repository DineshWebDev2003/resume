import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, Send, ChevronLeft, Sparkles, User, Bot, Volume2, FileText, FileSearch, ArrowRight, BrainCircuit } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassCard } from '@/components/glass-card';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInLeft, FadeInDown, Layout } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { API_CONFIG } from '@/constants/config';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const QUESTIONS = [
  { id: 'name', question: "Welcome! I'm your AI Resume Architect. To get started, what is your full name?", key: 'name' },
  { id: 'role', question: "Great! And what professional role or target title should we focus on?", key: 'role' },
  { id: 'experience', question: "Tell me about your professional background. What are some key achievements or projects you've led?", key: 'experience' },
  { id: 'education', question: "Excellent. What is your highest educational qualification and where did you study?", key: 'education' },
  { id: 'skills', question: "Finally, what are your top core competencies and professional skills?", key: 'skills' },
];

export default function AIChatBuilder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: QUESTIONS[0].question,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<any>({});
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isSynthesizing) return;

    const userText = inputText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    // Save answer
    const newAnswers = { ...collectedAnswers, [QUESTIONS[currentStep].key]: userText };
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
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 800);
    } else {
      // Last question answered, trigger AI Synthesis
      handleFinalSynthesis(newAnswers);
    }
  };

  const handleFinalSynthesis = async (allAnswers: any) => {
    setIsSynthesizing(true);
    const thinkingMsg: Message = {
      id: 'synth',
      text: "Synthesis ongoing... I'm weaving your professional story into an elite resume structure.",
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const prompt = `
        As a resume architect, analyze these interview answers and generate a high-end JSON resume.
        Answers: ${JSON.stringify(allAnswers)}
        
        Return ONLY valid JSON:
        {
          "name": "string",
          "role": "string",
          "summary": "string (professional & high-impact)",
          "experience": [{"title": "string", "company": "string", "description": "string (bullet points with achievements)"}],
          "skills": ["string"],
          "education": {"degree": "string", "school": "string", "year": "string"}
        }
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-handoff to Manual Builder
      router.push({
        pathname: '/builder/manual',
        params: { 
          initialData: JSON.stringify(result) 
        }
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
              <Text style={[styles.headerText, { color: colors.text }]}>AI Chat Architect</Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <LinearGradient 
        colors={isDark ? ['#000d1a', '#121212'] : ['#f0f9ff', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingTop: insets.top + 70 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <Animated.View
              entering={item.sender === 'user' ? FadeInRight : FadeInLeft}
              layout={Layout.springify()}
              style={[
                styles.messageWrapper,
                item.sender === 'user' ? styles.userWrapper : styles.aiWrapper,
              ]}
            >
              {item.sender === 'ai' && (
                <View style={[styles.avatarBox, { backgroundColor: Theme.colors.primary }]}>
                  <Bot size={16} color="#fff" />
                </View>
              )}
              
              <GlassCard
                intensity={isDark ? 20 : 10}
                style={[
                  styles.messageCard,
                  item.sender === 'user' ? styles.userCard : styles.aiCard,
                  { 
                    backgroundColor: item.sender === 'user' 
                      ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff') 
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'),
                    borderColor: colors.glassBorder
                  }
                ]}
              >
                {item.id === 'synth' && <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginBottom: 8 }} />}
                <Text style={[styles.messageText, { color: colors.text }]}>{item.text}</Text>
              </GlassCard>

              {item.sender === 'user' && (
                <View style={[styles.avatarBox, { backgroundColor: Theme.colors.secondary }]}>
                  <User size={16} color="#fff" />
                </View>
              )}
            </Animated.View>
          )}
          ListFooterComponent={isTyping ? (
            <View style={styles.typingContainer}>
               <ActivityIndicator size="small" color={Theme.colors.primary} />
               <Text style={[styles.typingText, { color: colors.textMuted }]}>Architect is thinking...</Text>
            </View>
          ) : null}
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <GlassCard intensity={60} style={[styles.inputCard, { borderColor: colors.glassBorder }]}>
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
              onPress={inputText.trim() ? handleSend : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              disabled={isSynthesizing}
            >
              <LinearGradient
                colors={isSynthesizing ? ['#64748b', '#475569'] : [Theme.colors.primary, Theme.colors.secondary]}
                style={styles.sendGradient}
              >
                {isSynthesizing ? (
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
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 18, fontWeight: '800' },
  backButton: { marginLeft: 16 },
  messageList: { padding: 20, paddingBottom: 120 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end', maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  aiWrapper: { alignSelf: 'flex-start' },
  messageCard: { padding: 16, borderRadius: 20, borderWidth: 1 },
  userCard: { borderBottomRightRadius: 4 },
  aiCard: { borderBottomLeftRadius: 4 },
  avatarBox: {
    width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 8,
  },
  messageText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  typingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 65, marginBottom: 20 },
  typingText: { fontSize: 12, fontWeight: '600' },
  inputContainer: { padding: 20, paddingTop: 10 },
  inputCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 8, 
    paddingVertical: 8, 
    borderWidth: 1.5, 
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputPrefix: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    borderRadius: 22,
    marginRight: 8,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    maxHeight: 120, 
    fontWeight: '500', 
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
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: Theme.colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 4,
  },
  disabledSend: { opacity: 0.6 },
});
