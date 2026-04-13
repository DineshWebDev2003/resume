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
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, Send, ChevronLeft, Sparkles, User, Bot, Volume2, FileText, FileSearch } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassCard } from '@/components/glass-card';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInLeft, FadeInDown, Layout } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateResumeHtml } from '@/components/resume-html-generator';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type Step = 'name' | 'role' | 'education' | 'experience' | 'skills' | 'complete';

export default function AIChatBuilder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();
  const initialMode = params.initialMode as string;

  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [collectedData, setCollectedData] = useState<any>({
    name: '',
    role: '',
    education: { degree: '', school: '', year: '' },
    experience: [],
    skills: '',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 234-5678',
    summary: ''
  });

  const getStepQuestion = (step: Step) => {
    switch (step) {
      case 'name': return "Let's start! What is your full name?";
      case 'role': return "Great! What is your target job role or current professional title?";
      case 'education': return "Excellent. Tell me about your highest education (Degree, School, and Graduation Year).";
      case 'experience': return "Now, describe your work experience. You can list your most recent roles and key responsibilities.";
      case 'skills': return "Almost there! What are your top professional skills? (e.g., React, Project Management, Sales)";
      case 'complete': return "Thank you! I've structured all your details. You can now preview and download your professional resume.";
      default: return "How else can I help you today?";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI Resume Assistant. I'll help you build a professional resume step-by-step.",
      sender: 'ai',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: getStepQuestion('name'),
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      let nextStep: Step = currentStep;
      let newData = { ...collectedData };

      switch (currentStep) {
        case 'name':
          newData.name = text;
          nextStep = 'role';
          break;
        case 'role':
          newData.role = text;
          nextStep = 'education';
          break;
        case 'education':
          newData.education = { degree: text, school: 'Various', year: '2024' };
          nextStep = 'experience';
          break;
        case 'experience':
          newData.experience = [{ role: text, company: 'Previous Co', period: '2020-2024', description: text }];
          newData.summary = `Professional with experience in ${text}.`;
          nextStep = 'skills';
          break;
        case 'skills':
          newData.skills = text;
          nextStep = 'complete';
          setIsReady(true);
          break;
      }

      setCollectedData(newData);
      setCurrentStep(nextStep);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getStepQuestion(nextStep),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleExport = async () => {
    const html = generateResumeHtml(collectedData, 'Professional', Theme.colors.primary, 'Roboto');
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Export error', error);
    }
  };

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setRecording(null);
    await recording?.stopAndUnloadAsync();
    const mockTranscription = "I have 5 years of experience in React Native development.";
    setInputText(mockTranscription);
  }

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: () => (
            <View style={[styles.headerTitle, { marginTop: Platform.OS === 'android' ? 10 : 0 }]}>
              <Sparkles size={18} color={Theme.colors.primary} />
              <Text style={[styles.headerText, { color: colors.text }]}>AI Builder</Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
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
                <View style={styles.avatarAi}>
                  <Bot size={16} color="#fff" />
                </View>
              )}
              
              <GlassCard
                intensity={isDark ? (item.sender === 'user' ? 40 : 20) : (item.sender === 'user' ? 20 : 10)}
                style={[
                  styles.messageCard,
                  item.sender === 'user' ? styles.userCard : styles.aiCard,
                  { 
                    borderColor: isDark ? colors.glassBorder : 'rgba(0,0,0,0.05)', 
                    backgroundColor: item.sender === 'user' 
                      ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#f0f4ff') 
                      : (isDark ? (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa') : '#f8f9fa') 
                  }
                ]}
              >
                <Text style={[styles.messageText, { color: colors.text }]}>{item.text}</Text>
                {item.sender === 'ai' && (
                  <View style={styles.aiActions}>
                    <TouchableOpacity style={styles.voiceAction}>
                      <Volume2 size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>

              {item.sender === 'user' && (
                <View style={styles.avatarUser}>
                  <User size={16} color="#fff" />
                </View>
              )}
            </Animated.View>
          )}
          ListFooterComponent={isReady ? (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.exportContainer}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <FileText size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Preview & Export PDF</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <GlassCard intensity={30} style={[styles.inputCard, { borderColor: colors.glassBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={"Describe your experience..."}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, isRecording && styles.recordingButton]} 
                onPress={toggleRecording}
              >
                <Mic size={20} color={isRecording ? Theme.colors.accent : colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.disabledSend]} 
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    marginLeft: 10,
  },
  messageList: {
    padding: 20,
    paddingTop: 120,
    paddingBottom: 40,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    padding: 14,
    borderRadius: 18,
  },
  userCard: {
    borderBottomRightRadius: 4,
  },
  aiCard: {
    borderBottomLeftRadius: 4,
  },
  avatarAi: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  voiceAction: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  aiActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  exportContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    padding: 20,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledSend: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOpacity: 0,
  },
});
