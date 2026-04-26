import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView, NativeModules, TextInput } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import { Mic, MicOff, Volume2, ArrowRight, CheckCircle2, Layout as LayoutIcon, BrainCircuit, Sparkles, ChevronLeft, Keyboard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { API_CONFIG } from '@/constants/config';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';

const QUESTIONS = [
  { id: 'name', question: "Hello! I'm your AI Resume Architect. To get started, what is your full name?", key: 'name' },
  { id: 'role', question: "Great to meet you! And what professional role are you currently in or targeting?", key: 'role' },
  { id: 'summary', question: "Excellent. Now, briefly describe your professional background and what makes you unique.", key: 'summary' },
  { id: 'experience', question: "Tell me about your most significant work experience. Include the company name and one key achievement there.", key: 'experience_text' },
  { id: 'skills', question: "Finally, what are your top professional skills?", key: 'skills_text' },
];

export default function AIInterviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answers, setAnswers] = useState<any>({});
  const [recording, setRecording] = useState<any>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [finalData, setFinalData] = useState<any>(null);
  const [isVocalWoken, setIsVocalWoken] = useState(false);

  const lottieRef = useRef<LottieView>(null);
  const vocalBridgeRef = useRef<WebView>(null);
  const currentQuestion = QUESTIONS[currentStep];

  useEffect(() => {
    if (isVocalWoken) {
      // Small delay to ensure WebView is ready
      const timer = setTimeout(askQuestion, 800);
      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }
  }, [currentStep, isVocalWoken]);

  const wakeAssistant = () => {
    setIsVocalWoken(true);
    // Initial silent sound to unlock audio context
    if (vocalBridgeRef.current) {
      const js = `
        var msg = new SpeechSynthesisUtterance("Vocal engine activated");
        msg.volume = 0; // Silent first speak to unlock
        window.speechSynthesis.speak(msg);
        window.ReactNativeWebView.postMessage("vocal_woken");
      `;
      vocalBridgeRef.current.injectJavaScript(js);
    }
  };

  const speakThroughWeb = (text: string) => {
    if (vocalBridgeRef.current && isVocalWoken) {
      const encoded = encodeURIComponent(text);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;
      
      const js = `
        var audio = new Audio("${ttsUrl}");
        audio.onended = function() { window.ReactNativeWebView.postMessage("speech_done"); };
        audio.onerror = function() { window.ReactNativeWebView.postMessage("speech_error"); };
        audio.play().catch(function(e) { 
           // If play fails, try synthesis as backup 
           var msg = new SpeechSynthesisUtterance(${JSON.stringify(text)});
           msg.onend = function() { window.ReactNativeWebView.postMessage("speech_done"); };
           window.speechSynthesis.speak(msg);
        });
      `;
      vocalBridgeRef.current.injectJavaScript(js);
      setIsSpeaking(true);
    }
  };

  const stopSpeech = () => {
    if (vocalBridgeRef.current) {
      vocalBridgeRef.current.injectJavaScript('window.speechSynthesis.cancel();');
    }
    setIsSpeaking(false);
  };

  const askQuestion = () => {
    speakThroughWeb(QUESTIONS[currentStep].question);
  };

  const getAudioModule = () => {
    try {
      if (NativeModules.ExponentAV || NativeModules.ExpoAV) {
        return require('expo-av').Audio;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const startRecording = async () => {
    const Audio = getAudioModule();
    if (!Audio) {
      console.warn("Audio recording not supported");
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsListening(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error("No recording URI");

      const transcript = await transcribeAudio(uri);
      const newAnswers = { ...answers, [currentQuestion.key]: transcript };
      setAnswers(newAnswers);

      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await generateFinalStructure(newAnswers);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      const FileSystem = require('expo-file-system');
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri, type: 'audio/m4a', name: 'recording.m4a' });
      formData.append('model', 'whisper-large-v3');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_CONFIG.GROQ_API_KEY}` },
        body: formData,
      });

      const data = await response.json();
      return data.text || "";
    } catch(e) {
      return "Audio capture failed";
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    const text = manualText;
    setManualText('');
    setShowTextInput(false);
    
    const newAnswers = { ...answers, [currentQuestion.key]: text };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await generateFinalStructure(newAnswers);
    }
  };

  const generateFinalStructure = async (allAnswers: any) => {
    setIsProcessing(true);
    try {
      const prompt = `
        Create professionally structured resume JSON: ${JSON.stringify(allAnswers)}
        Return ONLY JSON:
        { "name": "string", "role": "string", "summary": "string", "experience": [{"title": "string", "company": "string", "description": "string"}], "skills": ["string"] }
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_CONFIG.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setFinalData(result);
      setShowTemplatePicker(true);
    } catch (error) {
      console.error("Synthesis Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setShowTemplatePicker(false);
    router.push({
      pathname: '/builder/manual',
      params: { theme: template, initialData: JSON.stringify(finalData) }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient 
        colors={isDark ? ['#001a2c', '#121212'] : ['#e0f2ff', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
        <ChevronLeft color={colors.text} size={28} />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={!isVocalWoken ? wakeAssistant : undefined}
          style={styles.robotWrapper}
        >
          <Animated.View entering={FadeInUp.delay(300)}>
            <LottieView
              source={require('../../assets/Ai Robot Animation.json')}
              autoPlay
              loop
              style={styles.robotAnimation}
            />
          </Animated.View>
          
          {!isVocalWoken && (
            <Animated.View entering={FadeInDown} style={styles.wakePill}>
               <Sparkles size={16} color="#fff" />
               <Text style={styles.wakePillText}>TAP TO WAKE ASSISTANT</Text>
            </Animated.View>
          )}
        </TouchableOpacity>

        <View style={styles.questionContainer}>
          <Text style={[styles.stepText, { color: Theme.colors.primary }]}>STEP {currentStep + 1} OF 5</Text>
          <Animated.Text key={currentStep} entering={FadeInDown} style={[styles.questionText, { color: colors.text }]}>
            {currentQuestion.question}
          </Animated.Text>
        </View>

        {isSpeaking && (
          <View style={styles.statusRow}>
             <Volume2 size={16} color={Theme.colors.primary} />
             <Text style={[styles.statusText, { color: colors.text }]}>AI Architect is speaking...</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.statusRow}>
             <ActivityIndicator size="small" color={Theme.colors.primary} />
             <Text style={[styles.statusText, { color: colors.textMuted }]}>AI is drafting your story...</Text>
          </View>
        )}

        {isListening && !isProcessing && (
          <View style={styles.statusRow}>
             <View style={[styles.pulseCircle, { backgroundColor: Theme.colors.primary + '30' }]} />
             <Text style={[styles.statusText, { color: Theme.colors.primary }]}>Listening to you...</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.footerRow}>
           <TouchableOpacity 
             style={[styles.smallActionBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
             onPress={() => setShowTextInput(true)}
           >
             <Keyboard size={24} color={Theme.colors.primary} />
           </TouchableOpacity>

           <TouchableOpacity 
            onPress={isListening ? stopRecording : startRecording}
            disabled={isSpeaking || isProcessing}
            style={[
              styles.micBtn, 
              { 
                backgroundColor: isListening ? '#ef4444' : Theme.colors.primary,
                opacity: (isSpeaking || isProcessing) ? 0.5 : 1
              }
            ]}
          >
            {isListening ? <MicOff size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.smallActionBtnPlaceholder} />
        </View>
        <Text style={[styles.micHint, { color: colors.textMuted }]}>
          {isListening ? 'Tap to Stop' : 'Tap to Answer'}
        </Text>
      </View>

      <Modal visible={showTextInput} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <GlassCard style={[styles.inputModalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.inputModalTitle, { color: colors.text }]}>{currentQuestion.id === 'name' ? 'What is your name?' : 'Your Answer'}</Text>
              <TextInput
                style={[styles.manualTextInput, { color: colors.text, borderColor: colors.glassBorder }]}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={manualText}
                onChangeText={setManualText}
                autoFocus
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleManualSubmit}>
                 <LinearGradient colors={[Theme.colors.primary, Theme.colors.secondary]} style={styles.submitBtnGradient}>
                    <Text style={styles.submitBtnText}>Submit Answer</Text>
                    <ArrowRight size={20} color="#fff" />
                 </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTextInput(false)} style={styles.cancelBtn}>
                 <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
           </GlassCard>
        </View>
      </Modal>

      <Modal visible={showTemplatePicker} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Sparkles size={24} color={Theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Your Design</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              We've synthesized your story. Select a template to finish.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
              {['Executive', 'Modern', 'Professional', 'Creative'].map((temp) => (
                <TouchableOpacity key={temp} style={styles.templateCard} onPress={() => handleTemplateSelect(temp)}>
                   <View style={[styles.templateIconBox, { backgroundColor: colors.background }]}>
                      <LayoutIcon size={32} color={Theme.colors.primary} />
                   </View>
                   <Text style={[styles.templateName, { color: colors.text }]}>{temp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <View style={{ height: 0, width: 0, opacity: 0 }}>
        <WebView 
          ref={vocalBridgeRef}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          source={{ html: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><script>console.log("Vocal Engine Rooted");</script></body></html>' }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            if (data === 'speech_done') {
              setIsSpeaking(false);
              if (getAudioModule()) startRecording();
            } else if (data === 'vocal_woken') {
              // Immediately ask first question
              askQuestion();
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  robotWrapper: { alignItems: 'center', justifyContent: 'center' },
  robotAnimation: { width: 280, height: 280 },
  wakePill: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  wakePillText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  questionContainer: { alignItems: 'center', marginTop: -20 },
  stepText: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  questionText: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 10 },
  statusText: { fontSize: 14, fontWeight: '600' },
  pulseCircle: { width: 10, height: 10, borderRadius: 5 },
  footer: { alignItems: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', justifyContent: 'center', paddingHorizontal: 40 },
  micBtn: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  smallActionBtn: {
    width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  smallActionBtnPlaceholder: { width: 52 },
  micHint: { marginTop: 12, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  inputModalContent: { padding: 30, borderTopLeftRadius: 40, borderTopRightRadius: 40, width: '100%' },
  inputModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  manualTextInput: {
    width: '100%', minHeight: 120, borderRadius: 20, borderWidth: 1, padding: 20, fontSize: 16,
    textAlignVertical: 'top', marginBottom: 20,
  },
  submitBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden' },
  submitBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 20, padding: 10 },
  modalContent: { padding: 30, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  modalSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 30 },
  templateScroll: { paddingBottom: 20, gap: 20 },
  templateCard: { width: 120, alignItems: 'center', gap: 12 },
  templateIconBox: { width: 100, height: 140, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  templateName: { fontSize: 14, fontWeight: '700' },
});
