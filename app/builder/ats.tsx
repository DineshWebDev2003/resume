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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
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
import LottieView from 'lottie-react-native';
import { Theme, Colors } from '@/constants/theme';
import { API_CONFIG } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveAtsHistory, getAtsHistory } from '@/services/firestore';
import dayjs from 'dayjs';
import { GlassCard } from '@/components/glass-card';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  interpolateColor,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { X, Eye } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { uploadToCloudinary } from '@/services/cloudinary';
import { useRef } from 'react';

const { width } = Dimensions.get('window');

export default function ATSScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { jobUrl: incomingUrl, autoScan } = useLocalSearchParams<{ jobUrl?: string, autoScan?: string }>();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoScanTriggered, setAutoScanTriggered] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const viewShotRef = useRef<any>(null); // Ref for image capture
  const scrollRef = useRef<ScrollView>(null);

  const scrollY = useSharedValue(0);
  const modalScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const modalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      modalScrollY.value = event.contentOffset.y;
    },
  });

  const modalHeaderStyle = useAnimatedStyle(() => {
     return {
       backgroundColor: interpolateColor(
         modalScrollY.value,
         [0, 30],
         ['transparent', colors.background]
       ),
       borderBottomWidth: interpolate(modalScrollY.value, [0, 30], [0, 1]),
       borderBottomColor: colors.glassBorder,
     };
  });

  React.useEffect(() => {
    loadHistory();
    if (incomingUrl) {
      setJobUrl(incomingUrl);
      // Brief delay to ensure WebView and component state are initialized
      setTimeout(() => {
        handleUrlRef(incomingUrl);
      }, 800);
    }
  }, [incomingUrl]);

  // Auto-scan listener
  React.useEffect(() => {
    if (autoScan === 'true' && !autoScanTriggered && extractedText && jobDescription && jobDescription !== "Extracted successfully. Please verify the content below.") {
      setAutoScanTriggered(true);
      handleStartAnalysis();
    }
  }, [extractedText, jobDescription, autoScan, autoScanTriggered]);

  const headerStyle = useAnimatedStyle(() => {
     return {
       backgroundColor: interpolateColor(
         scrollY.value,
         [0, 50],
         ['transparent', colors.background]
       ),
       borderBottomWidth: interpolate(scrollY.value, [0, 50], [0, 1]),
       borderBottomColor: colors.glassBorder,
     };
  });

  const loadHistory = async () => {
    try {
      const data = await getAtsHistory();
      setHistory(data.slice(0, 3));
    } catch (e) {
      console.error("Load history error:", e);
    }
  };

  const handleUrlRef = (url: string) => {
    setIsFetchingUrl(true);
    setScrapingUrl(url);
    // Safety timeout for the background scraper
    setTimeout(() => {
      setScrapingUrl(null);
      setIsFetchingUrl(false);
    }, 15000);
  };


  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        // Trigger background extraction immediately
        handleBackgroundExtract(result.assets[0]);
      }
    } catch (err) {
      console.error('Pick error', err);
    }
  };

  const handleBackgroundExtract = async (file: any) => {
    try {
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
    } catch (err) {
      console.error('Extract error', err);
    }
  };

  const stopWords = new Set(['and', 'the', 'with', 'from', 'that', 'this', 'for', 'was', 'were', 'been', 'have', 'has', 'had', 'what', 'where', 'when', 'how', 'who', 'whom']);

  const handleFetchJobDescription = async () => {
    if (!jobUrl || !jobUrl.startsWith('http')) {
      alert('Please enter a valid job URL');
      return;
    }

    setIsFetchingUrl(true);
    setScrapingUrl(jobUrl);
    
    // Set a timeout to stop scraping if it hangs
    setTimeout(() => {
      if (isFetchingUrl) {
        setIsFetchingUrl(false);
        setScrapingUrl(null);
      }
    }, 15000);
  };

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

  const handleStartAnalysis = async () => {
    if (!selectedFile || !jobDescription) return;
    
    if (!extractedText) {
      alert("Still processing your resume text. Please wait a second...");
      return;
    }
    
    setIsAnalyzing(true);
    setImprovements([]);
    setHighlights([]);
    
    try {
      // 1. Prepare Groq AI Prompt
      const prompt = `
        You are an elite ATS (Applicant Tracking System) scanner. 
        Analyze this Resume vs Job Description.
        
        RESUME:
        ${extractedText.substring(0, 4000)}
        
        JOB DESCRIPTION:
        ${jobDescription.substring(0, 2000)}
        
        Return ONLY a JSON object in this exact format:
        {
          "score": number (0-100),
          "improvements": [
            {"title": "string", "desc": "string", "type": "critical"|"important"|"suggestion"}
          ],
          "highlights": [
            {"title": "string", "desc": "string"}
          ]
        }
        Do not add any other text. Give 3 improvements and 2 highlights.
      `;

      // 2. Call Groq API
      const response = await fetch(API_CONFIG.ATS_ENGINE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      if (result) {
        setScore(result.score || 70);
        setImprovements(result.improvements || []);
        setHighlights(result.highlights || []);
      }

      // Storage and history
      const uri = await captureRef(viewShotRef, { format: "png", quality: 0.7 });
      const cloudinary = await uploadToCloudinary(uri);
      await saveAtsHistory({
        score: result.score || 70,
        resumeName: selectedFile.name,
        snapshotUrl: cloudinary.url,
        cloudinaryPublicId: cloudinary.publicId,
        jobTitle: jobDescription.substring(0, 50) + "...",
        analysis: result
      });
      
      await loadHistory();
      setShowResults(true);
    } catch (error) {
       console.error("Groq AI Error:", error);
       // Basic Fallback if AI fails
       setScore(65);
       setImprovements([{ title: 'AI Analysis Error', desc: 'Could not connect to Groq AI. Falling back to basic scan.', type: 'important' }]);
       setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openHistoryItem = (item: any) => {
    setScore(item.score);
    setImprovements(item.analysis.improvements || []);
    setHighlights(item.analysis.highlights || []);
    setShowResults(true);
  };

  const getMatchStyles = (s: number) => {
    if (s < 40) return { label: 'Low Match - Action Required', color: '#EF4444' };
    if (s < 75) return { label: 'Fair Match - Keep Improving', color: '#F59E0B' };
    return { label: 'Strong Match - Highly Compatible!', color: '#10B981' };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />

      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingPopup, { backgroundColor: colors.surface }]}>
             <LottieView 
               source={require('@/assets/Profile Scanning.json')} 
               autoPlay 
               loop 
               style={styles.loadingLottie} 
             />
             <Text style={[styles.loadingTitle, { color: colors.text }]}>AI Analyzing...</Text>
             <Text style={[styles.loadingSub, { color: colors.textMuted }]}>Matching keywords & structure</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showResults} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <Animated.View style={[styles.modalHeader, { paddingTop: insets.top + 10 }, modalHeaderStyle]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Analysis Results</Text>
            <TouchableOpacity onPress={() => setShowResults(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.ScrollView 
            onScroll={modalScrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: insets.bottom + 40 }}
          >
            <Animated.View entering={FadeInUp} style={styles.scoreCardContainer}>
              <GlassCard style={[styles.scoreCard, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9' }]}>
                <View style={[styles.scoreCircle, { backgroundColor: isDark ? '#000' : '#fff', borderColor: score ? getMatchStyles(score).color : Theme.colors.primary }]}>
                  <Text style={[styles.scoreNumber, { color: score ? getMatchStyles(score).color : Theme.colors.primary }]}>{score}%</Text>
                  <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>ATS MATCH</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={[styles.matchStatus, { color: score ? getMatchStyles(score).color : colors.text }]}>
                    {score ? getMatchStyles(score).label : ''}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            <Text style={[styles.listTitle, { color: colors.text }]}>Top Improvements</Text>
            {improvements.map((item, idx) => (
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
            {highlights.map((item, idx) => (
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
          </Animated.ScrollView>
        </View>
      </Modal>

      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* Floating Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 10 }, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Resume Optimizer</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 100 + insets.top, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 0, width: 0, opacity: 0 }}>
          {selectedFile && pdfHtml && (
            <WebView 
              source={{ html: pdfHtml }} 
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'text_extracted') {
                    setExtractedText(data.text);
                  }
                } catch (e) {
                  console.error('Extraction error', e);
                }
              }}
            />
          )}
          {scrapingUrl && (
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
                    setIsFetchingUrl(false);
                    setScrapingUrl(null);
                  }
                } catch (e) {
                  console.error('URL Scraping error', e);
                }
              }}
            />
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Upload Your Resume</Text>
          <TouchableOpacity 
            onPress={handleDocumentPick}
            activeOpacity={0.8}
          >
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.7 }}>
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
                    <Text style={styles.uploadSubtext}>
                      {extractedText ? 'Analyzed & Ready' : 'Processing Content...'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowPreview(true);
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
            </ViewShot>
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
            source={{ html: pdfHtml || '' }} 
            style={{ flex: 1 }}
            originWhitelist={['*']}
            scalesPageToFit
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
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Target size={18} color={Theme.colors.primary} />
                <Text style={[styles.inputHeaderText, { color: colors.text }]}>Job Details or Link</Text>
              </View>
              <TouchableOpacity 
                style={[styles.fetchBtn, isFetchingUrl && { opacity: 0.7 }]}
                onPress={handleFetchJobDescription}
                disabled={isFetchingUrl || !jobUrl}
              >
                {isFetchingUrl ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.fetchBtnText}>Fetch Link</Text>}
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.urlInput, { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.glassBorder }]}
              placeholder="Paste LinkedIn/Indeed job link here..."
              placeholderTextColor={colors.textMuted}
              value={jobUrl}
              onChangeText={setJobUrl}
            />

            <TextInput
              style={[styles.textInput, { color: colors.text, marginTop: 12 }]}
              placeholder="Or paste the job description text here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={jobDescription}
              onChangeText={setJobDescription}
            />
          </GlassCard>
        </Animated.View>

        {!isAnalyzing && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.spacing}>
            <TouchableOpacity 
              style={[styles.analyzeButton, (!selectedFile || !jobDescription) && styles.disabledButton]}
              onPress={handleStartAnalysis}
              disabled={!selectedFile || !jobDescription}
            >
              <LinearGradient
                colors={['#D81B60', '#C2185B']}
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

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Recent Analysis History</Text>
            {history.map((item, idx) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => openHistoryItem(item)}
                style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
              >
                <View style={[styles.historyScore, { borderColor: getMatchStyles(item.score).color }]}>
                   <Text style={[styles.historyScoreText, { color: getMatchStyles(item.score).color }]}>{item.score}%</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.historyJob, { color: colors.text }]} numberOfLines={1}>{item.jobTitle}</Text>
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                    {dayjs(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).format('MMM D, h:mm A')}
                  </Text>
                </View>
                <ChevronLeft size={18} color={colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <Sparkles size={40} color={Theme.colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing keywords & formatting...</Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginTop: 24,
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
    marginTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
  fetchBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fetchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  urlInput: {
    fontSize: 14,
    paddingVertical: 8,
    marginBottom: 4,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPopup: {
    width: width * 0.85,
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingLottie: {
    width: 240,
    height: 180,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyScore: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyScoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
  historyJob: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
  },
});
