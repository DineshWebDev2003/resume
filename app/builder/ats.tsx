import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  Sparkles,
  Search,
  Zap
} from 'lucide-react-native';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassCard } from '@/components/glass-card';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { X, Eye } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ATSScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Pick error', err);
    }
  };

  const mockImprovements = [
    { title: 'Keyword Optimization', desc: 'Add "Cloud Architecture" and "Microservices" to match job requirements.', type: 'critical' },
    { title: 'Quantifiable Metrics', desc: 'Include more percentages and numbers in your experience section.', type: 'important' },
    { title: 'Action Verbs', desc: 'Start your bullet points with stronger verbs like "Spearheaded" or "Engineered".', type: 'suggestion' },
  ];

  const mockHighlights = [
    { title: 'Clean Formatting', desc: 'Your resume is easily parsable by major ATS systems.' },
    { title: 'Education Match', desc: 'Your computer science degree matches the requirements.' },
  ];

  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: 'base64',
      });
      
      const html = `
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          </head>
          <body>
            <div id="pdf-container"></div>
            <script>
              const pdfData = atob("${base64}");
              const loadingTask = pdfjsLib.getDocument({data: pdfData});
              loadingTask.promise.then(pdf => {
                let fullText = "";
                const pagePromises = [];
                
                // Show first page immediately
                pdf.getPage(1).then(page => {
                  const viewport = page.getViewport({scale: 1.5});
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  document.getElementById('pdf-container').appendChild(canvas);
                  page.render({canvasContext: context, viewport: viewport});
                });

                // Extract text from all pages
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
            <style>
              body { margin: 0; background: ${isDark ? '#121212' : '#f8fafc'}; }
              canvas { width: 100%; height: auto; margin-bottom: 10px; }
            </style>
          </body>
        </html>
      `;
      setPdfHtml(html);
      setIsAnalyzing(false);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview error', err);
      setIsAnalyzing(false);
      await Sharing.shareAsync(selectedFile.uri);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedFile || !jobDescription) return;
    
    setIsAnalyzing(true);
    
    // Local ATS Logic: Keyword Matching
    setTimeout(() => {
      const jdKeywords = jobDescription.toLowerCase().split(/[\s,.]+/).filter(w => w.length > 3);
      const resumeContent = extractedText.toLowerCase();
      
      let matches = 0;
      const foundKeywords: string[] = [];
      
      jdKeywords.forEach(keyword => {
        if (resumeContent.includes(keyword)) {
          matches++;
          if (!foundKeywords.includes(keyword)) foundKeywords.push(keyword);
        }
      });
      
      const matchRate = jdKeywords.length > 0 ? (matches / jdKeywords.length) * 100 : 70;
      const finalScore = Math.min(Math.round(matchRate + 40), 98); // Heuristic base + match
      
      setScore(finalScore);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: () => (
             <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: Platform.OS === 'android' ? 10 : 0 }}>ATS Optimizer</Text>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 100 + insets.top, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Upload Your Resume</Text>
          <TouchableOpacity 
            onPress={handleDocumentPick}
            activeOpacity={0.8}
          >
            <GlassCard style={[styles.uploadZone, selectedFile && styles.uploadedZone, { borderColor: colors.glassBorder }]}>
              {selectedFile ? (
                <View style={styles.previewContent}>
                  <View style={[styles.miniDoc, { borderColor: colors.glassBorder }]}>
                     <View style={[styles.miniDocLine, { width: '60%', backgroundColor: Theme.colors.primary }]} />
                     <View style={[styles.miniDocLine, { width: '90%', backgroundColor: colors.textMuted + '40' }]} />
                     <View style={[styles.miniDocLine, { width: '80%', backgroundColor: colors.textMuted + '40' }]} />
                     <View style={[styles.miniDocLine, { width: '40%', marginTop: 10, backgroundColor: Theme.colors.primary }]} />
                     <View style={[styles.miniDocLine, { width: '90%', backgroundColor: colors.textMuted + '40' }]} />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={[styles.uploadText, { color: colors.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                    <Text style={styles.uploadSubtext}>Ready for analysis • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePreview();
                    }}
                    style={styles.eyeBtn}
                  >
                    <Eye size={20} color={Theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={[styles.uploadIcon, { backgroundColor: Theme.colors.primary + '15' }]}>
                    <Upload size={32} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.uploadText, { color: colors.text }]}>Click to upload PDF resume</Text>
                </>
              )}
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Resume Preview</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <WebView 
            source={pdfHtml ? { html: pdfHtml } : { uri: selectedFile?.uri }} 
            style={{ flex: 1 }}
            originWhitelist={['*']}
            scalesPageToFit
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'text_extracted') {
                  setExtractedText(data.text);
                }
              } catch (e) {
                console.error('WebView message error', e);
              }
            }}
          />
          <View style={[styles.adContainer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.surface }]}>
             <GlassCard style={styles.adCard}>
                <View style={styles.adBadge}>
                  <Text style={styles.adBadgeText}>AD</Text>
                </View>
                <View style={styles.adContent}>
                  <Text style={[styles.adTitle, { color: colors.text }]}>Unlock Premium Templates</Text>
                  <Text style={[styles.adSub, { color: colors.textMuted }]}>Get 50+ ATS-friendly designs today!</Text>
                </View>
                <TouchableOpacity style={styles.adBtn}>
                   <Text style={styles.adBtnText}>Upgrade</Text>
                </TouchableOpacity>
             </GlassCard>
          </View>
        </View>
      </Modal>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.spacing}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Target Job Description</Text>
          <GlassCard style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <View style={styles.inputHeader}>
              <Target size={18} color={Theme.colors.primary} />
              <Text style={[styles.inputHeaderText, { color: colors.text }]}>Paste Job Details or Link</Text>
            </View>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Paste the job requirements or target company job link here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={jobDescription}
              onChangeText={setJobDescription}
            />
          </GlassCard>
        </Animated.View>

        {!score && !isAnalyzing && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.spacing}>
            <TouchableOpacity 
              style={[styles.analyzeButton, !selectedFile && styles.disabledButton]}
              onPress={handleStartAnalysis}
              disabled={!selectedFile}
            >
              <LinearGradient
                colors={['#6366f1', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Zap size={20} color="#fff" />
                <Text style={styles.buttonText}>Scan ATS Compatibility</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <Sparkles size={40} color={Theme.colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing keywords & formatting...</Text>
          </View>
        )}

        {score && !isAnalyzing && (
          <View style={styles.resultsContainer}>
            <Animated.View entering={FadeInUp} style={styles.scoreCardContainer}>
              <GlassCard style={[styles.scoreCard, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9' }]}>
                <View style={[styles.scoreCircle, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                  <Text style={styles.scoreNumber}>{score}%</Text>
                  <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>ATS MATCH</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={[styles.matchStatus, { color: colors.text }]}>Strong Match!</Text>
                  <Text style={[styles.matchDesc, { color: colors.textMuted }]}>Your resume is highly compatible with this role.</Text>
                </View>
              </GlassCard>
            </Animated.View>

            <Text style={[styles.listTitle, { color: colors.text }]}>Top Improvements</Text>
            {mockImprovements.map((item, idx) => (
              <Animated.View key={idx} entering={FadeInDown.delay(200 * idx)}>
                <GlassCard style={[styles.improvementCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <View style={[styles.typeBadge, { backgroundColor: item.type === 'critical' ? '#ef444420' : '#f59e0b20' }]}>
                    <AlertCircle size={14} color={item.type === 'critical' ? '#ef4444' : '#f59e0b'} />
                    <Text style={[styles.typeText, { color: item.type === 'critical' ? '#ef4444' : '#f59e0b' }]}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.itemDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                </GlassCard>
              </Animated.View>
            ))}

            <Text style={[styles.listTitle, { color: colors.text }]}>Success Highlights</Text>
            {mockHighlights.map((item, idx) => (
              <Animated.View key={idx} entering={FadeInDown.delay(200 * idx)}>
                <View style={styles.highlightItem}>
                  <CheckCircle2 size={20} color={Theme.colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.highlightTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.highlightDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  backButton: {
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
  },
  uploadZone: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderRadius: 24,
  },
  uploadedZone: {
    borderStyle: 'solid',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSubtext: {
    color: Theme.colors.success,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: 10,
    backgroundColor: Theme.colors.primary + '15',
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
  },
  adContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  adCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  adBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  adContent: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  adSub: {
    fontSize: 10,
  },
  adBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  spacing: {
    marginTop: 32,
  },
  inputCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 32,
  },
  scoreCardContainer: {
    marginBottom: 32,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    color: Theme.colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 20,
  },
  matchStatus: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  matchDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  improvementCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 10,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlightItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  highlightDesc: {
    fontSize: 13,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  miniDoc: {
    width: 60,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  miniDocLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 5,
  },
  previewInfo: {
    flex: 1,
  },
});
