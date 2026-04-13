import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import { Linkedin, ArrowLeft, Search, CheckCircle2, ShieldCheck, Cpu, BrainCircuit, FileJson } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LinkedInSyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [url, setUrl] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'completed'>('input');
  const [currentSubStep, setCurrentSubStep] = useState(0);

  const subSteps = [
    { label: 'Authenticating Secure Session...', icon: ShieldCheck, color: '#0077B5' },
    { label: 'Extracting Profile Metadata...', icon: Search, color: '#10b981' },
    { label: 'AI Mapping Work Experience...', icon: Cpu, color: '#8b5cf6' },
    { label: 'Summarizing Strategic Impact...', icon: BrainCircuit, color: '#f59e0b' },
    { label: 'Generating Structured Resume Data...', icon: FileJson, color: '#ec4899' },
  ];

  const handleSync = () => {
    if (!url || !url.includes('linkedin.com/in/')) {
      alert('Please enter a valid LinkedIn Profile URL');
      return;
    }
    setStep('processing');
  };

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setCurrentSubStep((prev) => {
          if (prev < subSteps.length - 1) return prev + 1;
          clearInterval(interval);
          setTimeout(() => setStep('completed'), 1000);
          return prev;
        });
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleContinue = () => {
    // Redirect to manual builder with mock "found" data
    router.push({
      pathname: '/builder/manual',
      params: { 
        name: 'Alex Johnson',
        role: 'Senior Software Engineer',
        summary: 'Extracted from LinkedIn: Experienced engineering leader with a focus on React Native and Distributed Systems.',
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: colors.background }]}>
      <LinearGradient 
        colors={isDark ? ['#001a2c', '#121212'] : ['#e0f2ff', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>LinkedIn Intelligent Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'input' && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
            <View style={styles.iconHero}>
              <View style={[styles.linkedinIconCircle, { backgroundColor: '#0077B5' }]}>
                <Linkedin size={48} color="#fff" />
              </View>
              <View style={styles.aiBadge}>
                <Cpu size={14} color="#fff" />
                <Text style={styles.aiBadgeText}>AI POWERED</Text>
              </View>
            </View>

            <Text style={[styles.mainTitle, { color: colors.text }]}>Import Your Professional DNA</Text>
            <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
              Paste your public LinkedIn profile URL. Our AI will intelligently map your experience, skills, and honors into a premium resume format.
            </Text>

            <GlassCard style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>PROFILE URL</Text>
              <View style={styles.inputWrapper}>
                <Linkedin size={20} color="#0077B5" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="linkedin.com/in/username"
                  placeholderTextColor={colors.textMuted + '80'}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                />
              </View>
            </GlassCard>

            <TouchableOpacity style={styles.syncBtn} onPress={handleSync}>
              <LinearGradient 
                colors={['#0077B5', '#00a0dc']} 
                style={styles.syncBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.syncBtnText}>Fetch Professional Profile</Text>
                <CheckCircle2 size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <ShieldCheck size={14} color={colors.textMuted} />
              <Text style={[styles.securityText, { color: colors.textMuted }]}>
                Your data is parsed securely and never stored.
              </Text>
            </View>
          </Animated.View>
        )}

        {step === 'processing' && (
          <View style={styles.processingContainer}>
            <View style={styles.progressCircle}>
               <ActivityIndicator size="large" color="#0077B5" />
            </View>
            
            <Text style={[styles.procTitle, { color: colors.text }]}>Intelligent Extraction in Progress</Text>
            
            <View style={styles.stepsList}>
              {subSteps.map((s, i) => (
                <Animated.View 
                  key={i} 
                  entering={FadeInRight.delay(i * 100)}
                  layout={Layout.springify()}
                  style={[
                    styles.stepRow, 
                    { opacity: i > currentSubStep ? 0.3 : 1 }
                  ]}
                >
                  <View style={[styles.stepIconBox, { backgroundColor: s.color + '20' }]}>
                    {i < currentSubStep ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <s.icon size={18} color={i === currentSubStep ? s.color : colors.textMuted} />
                    )}
                  </View>
                  <Text style={[
                      styles.stepLabel, 
                      { color: i === currentSubStep ? colors.text : colors.textMuted },
                      i === currentSubStep && { fontWeight: '700' }
                    ]}>
                    {s.label}
                  </Text>
                  {i === currentSubStep && (
                    <Animated.View entering={FadeInRight} style={styles.activeIndicator} />
                  )}
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {step === 'completed' && (
          <Animated.View entering={FadeInDown} style={styles.completedContainer}>
            <View style={styles.successIcon}>
              <CheckCircle2 size={80} color="#10b981" />
            </View>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Profile Synced Successfully!</Text>
            <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
              We've successfully extracted your top skills, 3+ years of experience, and educational background. Ready to review and polish?
            </Text>

            <GlassCard style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
               <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>12</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Skills</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>3</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Roles</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>5</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Projects</Text>
                  </View>
               </View>
            </GlassCard>

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
              <LinearGradient 
                colors={['#10b981', '#059669']} 
                style={styles.syncBtnGradient}
              >
                <Text style={styles.syncBtnText}>Personalize My Resume</Text>
                <ArrowLeft size={20} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconHero: {
    marginTop: 40,
    marginBottom: 32,
    position: 'relative',
  },
  linkedinIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0077B5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  aiBadge: {
    position: 'absolute',
    bottom: -8,
    right: -20,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  mainSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  inputCard: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  syncBtn: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0077B5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  syncBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    opacity: 0.7,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  processingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  procTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 40,
  },
  stepsList: {
    width: '100%',
    gap: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0077B5',
  },
  completedContainer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  successIcon: {
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    marginTop: 32,
    marginBottom: 40,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0077B5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#000',
    opacity: 0.1,
  },
  continueBtn: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
});
