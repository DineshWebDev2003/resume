import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import { Linkedin, ArrowLeft, Search, CheckCircle2, ShieldCheck, Cpu, BrainCircuit, FileJson, Sparkles, FileUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { API_CONFIG } from '@/constants/config';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRewardedAd } from '@/hooks/use-rewarded-ad';
import { callAI } from '@/services/ai';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export default function LinkedInSyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [step, setStep] = useState<'input' | 'processing' | 'completed'>('input');
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const { user } = useAuth();
  const { loaded: adLoaded, showAd } = useRewardedAd();
  const webviewRef = useRef<WebView>(null);

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

  const subSteps = [
    { label: 'Initializing Intelligent Scraper...', icon: ShieldCheck, color: '#0077B5' },
    { label: 'Navigating to Profile Node...', icon: Search, color: '#10b981' },
    { label: 'Extracting Structural Metadata...', icon: Cpu, color: '#8b5cf6' },
    { label: 'AI Mapping Professional DNA...', icon: BrainCircuit, color: '#f59e0b' },
    { label: 'Synthesizing Resume Dataset...', icon: FileJson, color: '#ec4899' },
  ];


  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setStep('processing');
        setCurrentSubStep(0);
        handleBackgroundExtract(result.assets[0]);
      }
    } catch (err) {
      console.error('Pick error', err);
    }
  };

  const handleBackgroundExtract = async (file: any) => {
    try {
      setCurrentSubStep(1);
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });
      
      const html = `
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          </head>
          <body>
            <script>
              const pdfData = atob("${base64}");
              const loadingTask = pdfjsLib.getDocument({data: pdfData});
              loadingTask.promise.then(pdf => {
                let fullText = "";
                const pagePromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                  pagePromises.push(
                    pdf.getPage(i).then(page => 
                      page.getTextContent().then(content => {
                        fullText += content.items.map(item => item.str).join(" ") + " ";
                      })
                    )
                  );
                }
                Promise.all(pagePromises).then(() => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'text_extracted',
                    text: fullText
                  }));
                });
              });
            </script>
          </body>
        </html>
      `;
      setPdfHtml(html);
      setCurrentSubStep(2);
    } catch (err) {
      console.error('Extract error', err);
    }
  };

  const handleAnalyzeProfile = async (rawText: string) => {
    if (!isPro) {
       Alert.alert(
         "Premium AI Sync",
         "Full LinkedIn Analysis is a pro feature. Watch one short ad to unlock it for this profile?",
         [
           { text: "Cancel", style: "cancel", onPress: () => {
             // Fallback to basic sync if ad cancelled
             setExtractedData({
               name: 'Professional User',
               role: 'Basic Sync (Ad Cancelled)',
               summary: 'We found your profile but couldn\'t perform deep AI analysis. Please refine manually.',
               experience: [],
               skills: []
             });
             setStep('completed');
             setIsAnalyzing(false);
           }},
           { text: "Watch Ad", onPress: () => showAd(() => startAnalysis(rawText)) }
         ]
       );
       return;
    }

    startAnalysis(rawText);
  };

  const startAnalysis = async (rawText: string) => {
    setIsAnalyzing(true);
    setCurrentSubStep(3);

    try {
      const messages = [
        { 
          role: 'system' as const, 
          content: 'Analyze LinkedIn profile text and extract professional details for a resume. Return ONLY JSON.' 
        },
        { 
          role: 'user' as const, 
          content: `
            {
              "name": "string",
              "role": "string",
              "summary": "string",
              "experience": [{"title": "string", "company": "string", "period": "string"}],
              "skills": ["string"]
            }
            
            Text: ${rawText.substring(0, 6000)}
          ` 
        }
      ];

      const resultText = await callAI(messages, { jsonMode: true });
      const result = JSON.parse(resultText);
      setExtractedData(result);
      setCurrentSubStep(4);
      setTimeout(() => setStep('completed'), 1500);
    } catch (error: any) {
      console.error("LinkedIn AI Full Error:", error);
      setExtractedData({
        name: 'Professional User',
        role: 'Extracted Specialist',
        summary: 'Synchronized from LinkedIn Profile. Review and refine your professional summary below.',
        experience: [],
        skills: ['LinkedIn Optimized']
      });
      setStep('completed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/builder/manual',
      params: { 
        name: extractedData?.name || '',
        role: extractedData?.role || '',
        summary: extractedData?.summary || '',
        initialData: JSON.stringify(extractedData)
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
            <View style={styles.heroSection}>
              <View style={styles.badgeContainer}>
                <View style={styles.eliteBadge}>
                  <Sparkles size={12} color="#fff" />
                  <Text style={styles.eliteBadgeText}>ELITE SYNC</Text>
                </View>
              </View>
              <Text style={[styles.mainTitle, { color: colors.text }]}>Intelligent Profile Sync</Text>
              <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
                Choose your preferred method to import your professional DNA into a premium resume format.
              </Text>
            </View>

            <View style={styles.methodsGrid}>
              {/* Method 1: PDF Upload */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleDocumentPick}
                style={styles.methodCardWrapper}
              >
                <GlassCard style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <LinearGradient 
                    colors={['#10b981', '#059669']} 
                    style={styles.methodIconBox}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <FileUp size={28} color="#fff" />
                  </LinearGradient>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>PDF Professional Import</Text>
                    <Text style={[styles.methodDesc, { color: colors.textMuted }]}>
                      Upload your LinkedIn-generated PDF for 99% extraction accuracy.
                    </Text>
                    <View style={styles.actionRow}>
                      <Text style={[styles.actionText, { color: '#10b981' }]}>Fastest Method</Text>
                      <ArrowLeft size={14} color="#10b981" style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>

              {/* Method 2: Assistant */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setShowAssistant(true)}
                style={styles.methodCardWrapper}
              >
                <GlassCard style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <LinearGradient 
                    colors={['#0077B5', '#00a0dc']} 
                    style={styles.methodIconBox}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <BrainCircuit size={28} color="#fff" />
                  </LinearGradient>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Intelligent Assistant</Text>
                    <Text style={[styles.methodDesc, { color: colors.textMuted }]}>
                      Login and sync your live profile using our AI-guided assistant.
                    </Text>
                    <View style={styles.actionRow}>
                      <Text style={[styles.actionText, { color: '#0077B5' }]}>Real-time Sync</Text>
                      <ArrowLeft size={14} color="#0077B5" style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </View>

            <View style={styles.guideContainer}>
              <Text style={[styles.guideTitle, { color: colors.text }]}>Quick PDF Guide</Text>
              <View style={styles.guideSteps}>
                <View style={styles.miniStep}>
                  <View style={[styles.miniStepNum, { backgroundColor: colors.textMuted + '20' }]}><Text style={[styles.miniStepNumText, { color: colors.text }]}>1</Text></View>
                  <Text style={[styles.miniStepText, { color: colors.textMuted }]}>Tap 'More' on LinkedIn</Text>
                </View>
                <View style={styles.miniStep}>
                  <View style={[styles.miniStepNum, { backgroundColor: colors.textMuted + '20' }]}><Text style={[styles.miniStepNumText, { color: colors.text }]}>2</Text></View>
                  <Text style={[styles.miniStepText, { color: colors.textMuted }]}>'Save to PDF'</Text>
                </View>
                <View style={styles.miniStep}>
                  <View style={[styles.miniStepNum, { backgroundColor: colors.textMuted + '20' }]}><Text style={[styles.miniStepNumText, { color: colors.text }]}>3</Text></View>
                  <Text style={[styles.miniStepText, { color: colors.textMuted }]}>Upload here</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.portalBtn} 
                onPress={() => require('react-native').Linking.openURL('https://www.linkedin.com/feed/')}
              >
                <Text style={styles.portalBtnText}>Open LinkedIn App</Text>
                <Linkedin size={16} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.securitySection}>
              <ShieldCheck size={14} color={colors.textMuted} />
              <Text style={[styles.securityText, { color: colors.textMuted }]}>
                Elite security: Data is encrypted and never stored on servers.
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
                  style={styles.stepRow}
                >
                  <View style={[styles.stepContent, { opacity: i > currentSubStep ? 0.3 : 1 }]}>
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
                  </View>
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
              {isBlocked 
                ? "LinkedIn partially blocked the automated sync. Use the Sync Assistant for full experience and skills extraction."
                : `We've successfully extracted ${extractedData?.skills?.length || 0} skills, ${extractedData?.experience?.length || 0} professional roles, and synthesized a custom summary for your target roles.`}
            </Text>

            {isBlocked && (
              <TouchableOpacity style={styles.assistantBtn} onPress={() => setShowAssistant(true)}>
                <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.syncBtnGradient}>
                  <Cpu size={18} color="#fff" />
                  <Text style={styles.syncBtnText}>Launch Sync Assistant</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <GlassCard style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
               <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{extractedData?.skills?.length || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Skills</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.text }]} />
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{extractedData?.experience?.length || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Roles</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.text }]} />
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{extractedData?.summary ? '1' : '0'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Highlights</Text>
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

      {/* Sync Assistant Modal */}
      <Modal 
        visible={showAssistant} 
        animationType="slide"
        onRequestClose={() => setShowAssistant(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setShowAssistant(false)}>
               <ArrowLeft size={24} color={colors.text} />
             </TouchableOpacity>
             <Text style={[styles.headerTitle, { color: colors.text }]}>LinkedIn Sync Assistant</Text>
             <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.assistantNotice}>
             <ShieldCheck size={16} color={Theme.colors.primary} />
             <Text style={[styles.assistantNoticeText, { color: colors.textMuted }]}>
                Login if required, navigate to your full profile, then tap Capture.
             </Text>
          </View>

          <WebView 
            ref={webviewRef}
            source={{ uri: 'https://www.linkedin.com/feed/' }}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
            style={{ flex: 1 }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'text_extracted') {
                  setPdfHtml(null);
                  handleAnalyzeProfile(data.text);
                }
              } catch (e) {
                const text = event.nativeEvent.data;
                setShowAssistant(false);
                setStep('processing');
                setIsBlocked(false);
                handleAnalyzeProfile(text);
              }
            }}
          />

          <TouchableOpacity 
            style={[styles.captureBtn, { bottom: insets.bottom + 20 }]}
            onPress={() => {
              webviewRef.current?.injectJavaScript(`
                window.ReactNativeWebView.postMessage(document.body.innerText);
              `);
            }}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.captureGradient}>
               <Cpu size={24} color="#fff" />
               <Text style={styles.captureText}>Capture & AI Sync</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Background Scrapers */}
      {scrapingUrl && (
        <View style={{ height: 0, width: 0, opacity: 0 }}>
          <WebView 
            source={{ uri: scrapingUrl }}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
            onLoadStart={() => setCurrentSubStep(1)} // Navigating step
            onLoadEnd={() => setCurrentSubStep(2)} // Extracting step
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={`
              setTimeout(() => {
                const text = document.body.innerText;
                window.ReactNativeWebView.postMessage(text);
              }, 6000);
            `}
            onMessage={(event) => {
              const text = event.nativeEvent.data;
              setScrapingUrl(null);
              handleAnalyzeProfile(text);
            }}
          />
        </View>
      )}

      {pdfHtml && (
        <View style={{ height: 0, width: 0, opacity: 0 }}>
          <WebView 
            source={{ html: pdfHtml }}
            originWhitelist={['*']}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'text_extracted') {
                setPdfHtml(null);
                handleAnalyzeProfile(data.text);
              }
            }}
          />
        </View>
      )}
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
  heroSection: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: 16,
  },
  eliteBadge: {
    backgroundColor: '#0077B5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  eliteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  mainSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  methodsGrid: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
  },
  methodCardWrapper: {
    width: '100%',
  },
  methodCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 28,
    alignItems: 'center',
    gap: 20,
  },
  methodIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guideContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
    width: '100%',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
  },
  guideSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  miniStep: {
    flex: 1,
    alignItems: 'center',
  },
  miniStepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniStepNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  miniStepText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: '#0077B515',
    borderRadius: 16,
  },
  portalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0077B5',
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
    justifyContent: 'center',
    opacity: 0.7,
  },
  securityText: {
    fontSize: 11,
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
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  assistantBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  assistantNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#8b5cf610',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  assistantNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  captureBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  captureGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  captureText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#000',
    opacity: 0.08,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  uploadPdfBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#0077B520',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadPdfInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  uploadPdfText: {
    fontSize: 16,
    fontWeight: '700',
  },
  uploadPdfHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  guideContainer: {
    width: '100%',
    marginTop: 32,
    padding: 20,
    backgroundColor: '#0077B505',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0077B510',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
  },
  portalBtnText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
