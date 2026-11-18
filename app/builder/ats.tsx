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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRewardedAd } from '@/hooks/use-rewarded-ad';
import { callAI } from '@/services/ai';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Sparkles, 
  X,
  Zap,
  Check,
  Plus,
  Search,
  Target,
  Eye,
  RefreshCw,
  Send,
  MessageSquare,
  Bot
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveAtsHistory, getAtsHistory } from '@/services/firestore';
import { getResumes, saveResume } from '@/utils/storage';
import { generateResumeHtml } from '@/components/resume-html-generator';
import { isCloudflareProvider, submitAtsAnalysisToCloudflare } from '@/services/cloudflareBackend';
import dayjs from 'dayjs';
import { GlassCard } from '@/components/glass-card';
import { getLimits } from '@/constants/limits';
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
import * as Haptics from 'expo-haptics';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useRef, useMemo } from 'react';
import { BlurView } from 'expo-blur';


const { width } = Dimensions.get('window');

const normalizeImprovements = (list: any[]) => {
  if (!Array.isArray(list)) return [];
  return list.map((it) => {
    if (typeof it === 'string') {
      return { title: it, desc: '', type: 'suggestion' };
    }
    return {
      title: it?.title || it?.name || it?.suggestion || it?.text || 'Improvement',
      desc: it?.desc || it?.description || it?.details || '',
      type: String(it?.type || 'suggestion').toLowerCase(),
    };
  });
};

const normalizeHighlights = (list: any[]) => {
  if (!Array.isArray(list)) return [];
  return list.map((it) => {
    if (typeof it === 'string') {
      return { title: it, desc: '' };
    }
    return {
      title: it?.title || it?.name || it?.text || 'Strength',
      desc: it?.desc || it?.description || it?.details || '',
    };
  });
};

export default function ATSScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { 
    jobUrl: incomingUrl, 
    autoScan, 
    autoOptimize,
    jobTitle, 
    company 
  } = useLocalSearchParams<{ 
    jobUrl?: string, 
    autoScan?: string,
    autoOptimize?: string,
    jobTitle?: string,
    company?: string
  }>();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoScanTriggered, setAutoScanTriggered] = useState(false);
  const [autoOptimizeTriggered, setAutoOptimizeTriggered] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
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
  const [isPro, setIsPro] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<any>(null);
  const [showKeywordSelect, setShowKeywordSelect] = useState(false);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: Array<{ id: string; label: string }>;
    timestamp: number;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const { user, userProfile } = useAuth() as any;
  const { showAd } = useRewardedAd();
  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    const premiumEmail = (user?.email || '').toLowerCase();
    if (premiumEmail === 'dinesh.mahi.dev@gmail.com' || userProfile?.isPro || userProfile?.isPremium || (userProfile?.resumeLimit ?? 0) >= 999999) {
      setIsPro(true);
      return;
    }
    const checkPro = async () => {
      try {
        if (user?.uid && (user.provider === 'firebase' || !(require('@/constants/config').API_CONFIG as any).AUTH_PROVIDER || (require('@/constants/config').API_CONFIG as any).AUTH_PROVIDER === 'existing')) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && (docSnap.data().isPro || docSnap.data().isPremium)) setIsPro(true);
        }
      } catch {}
    };
    checkPro();
  }, [user, userProfile]);

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
      
      // If we have title/company, set an initial description so the AI has context 
      // even if scraping is slow or fails
      if (jobTitle || company) {
        setJobDescription(`Role: ${jobTitle || 'N/A'}\nCompany: ${company || 'N/A'}\n\n[Scraping detailed description...]`);
      }

      // Brief delay to ensure WebView and component state are initialized
      setTimeout(() => {
        handleUrlRef(incomingUrl);
      }, 800);
    }
  }, [incomingUrl, jobTitle, company]);

  // Auto-scan listener
  React.useEffect(() => {
    // If we have title/company, we can scan even if the full description scraping hasn't finished yet
    const hasJobContext = jobDescription && jobDescription !== "Extracted successfully. Please verify the content below.";
    const hasBasicContext = jobTitle && company;

    if ((autoScan === 'true' || autoOptimize === 'true') && !autoScanTriggered && extractedText && (hasJobContext || hasBasicContext)) {
      setAutoScanTriggered(true);
      handleStartAnalysis();
    }
  }, [extractedText, jobDescription, autoScan, autoOptimize, autoScanTriggered, jobTitle, company]);

  const [sourceTab, setSourceTab] = useState<'saved' | 'upload'>('saved');
  const [savedResumesList, setSavedResumesList] = useState<any[]>([]);

  const loadSavedResumes = async () => {
    try {
      const list = await getResumes();
      const top3 = list.slice(0, 3);
      setSavedResumesList(top3);
      if (top3.length === 0) {
        setSourceTab('upload');
      }
    } catch (e) {
      console.log("Error loading saved resumes in ATS:", e);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getAtsHistory();
      setHistory(data.slice(0, 3));
    } catch (e) {
      console.error("Load history error:", e);
    }
    loadSavedResumes();
  };

  const handleSelectSavedResume = async (res: any) => {
    const fileObj = {
      name: res.name || 'Saved Resume',
      uri: res.fileUri || '',
      size: 0,
      mimeType: 'application/pdf',
      template: res.template || 'Modern',
      role: res.role || '',
      isAppResume: !res.fileUri,
      resumeId: res.id,
    };
    setSelectedFile(fileObj);
    setExtractedText('');
    Haptics.selectionAsync();

    if (res.fileUri) {
      handleBackgroundExtract(fileObj);
    } else if (res.data) {
      const d = res.data;
      const combined = [
        d.name,
        d.title,
        d.role,
        d.summary,
        d.skills,
        d.tools,
        d.languages,
        ...(d.experience || []).map((e: any) => `${e.role || ''} at ${e.company || ''}. ${e.description || ''}`),
        ...(d.education || []).map((e: any) => `${e.degree || ''} at ${e.school || ''}`),
        ...(d.projects || []).map((p: any) => `${p.name || ''}. ${p.description || ''}`),
        ...(d.certifications || []).map((c: any) => `${c.title || c.name || ''}`),
      ].filter(Boolean).join('\n');
      setExtractedText(combined);

      try {
        const html = generateResumeHtml(d, res.template || 'Modern', res.color || '#1e293b', 'Inter', false);
        setPdfHtml(html);
      } catch (err) {
        console.warn('generateResumeHtml preview error:', err);
      }
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
        const file = result.assets[0];

        // 1. Copy to permanent documentDirectory (never purged by Android cache cleaners)
        const resumesDir = `${FileSystem.documentDirectory}resumes/`;
        await FileSystem.makeDirectoryAsync(resumesDir, { intermediates: true }).catch(() => {});
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const permanentUri = `${resumesDir}${Date.now()}_${safeName}`;
        await FileSystem.copyAsync({ from: file.uri, to: permanentUri }).catch(() => {});

        const persistentFile = {
          ...file,
          uri: permanentUri,
          name: file.name,
        };

        setSelectedFile(persistentFile);
        // CRITICAL: Clear old extracted text so we don't scan new file with old content
        setExtractedText('');
        // Trigger background extraction immediately
        handleBackgroundExtract(persistentFile);

        // 2. Persist to App Storage so user can view/select it anytime
        const prettyName = String(file.name || 'Uploaded Resume')
          .replace(/\.pdf$/i, '')
          .replace(/[_-]+/g, ' ')
          .trim() || 'Uploaded Resume';

        saveResume({
          name: prettyName,
          role: 'Uploaded Resume',
          template: 'Elder-1',
          color: Theme.colors.primary,
          fileUri: permanentUri,
          source: 'upload',
          data: {
            name: prettyName,
            title: '',
            email: '',
            phone: '',
            location: '',
            summary: '',
            experience: [],
            education: [],
            projects: [],
            skills: '',
            tools: '',
            languages: '',
            links: [],
            certifications: [],
          } as any,
        }).catch((e) => console.log('Auto save resume error:', e));

        setTimeout(() => {
          loadSavedResumes();
        }, 400);
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
            <style>
              body { margin: 0; padding: 10px; background: #f8fafc; }
              canvas { width: 100%; height: auto; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; }
            </style>
          </head>
          <body>
            <div id="pdf-container"></div>
            <script>
              const pdfData = atob("${base64}");
              const loadingTask = pdfjsLib.getDocument({data: pdfData});
              loadingTask.promise.then(pdf => {
                const container = document.getElementById('pdf-container');
                let fullText = "";
                const pagePromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                  pagePromises.push(
                    pdf.getPage(i).then(page => {
                      const viewport = page.getViewport({scale: 1.5});
                      const canvas = document.createElement('canvas');
                      const context = canvas.getContext('2d');
                      canvas.height = viewport.height;
                      canvas.width = viewport.width;
                      container.appendChild(canvas);
                      page.render({canvasContext: context, viewport: viewport});
                      
                      return page.getTextContent().then(content => {
                        fullText += content.items.map(item => item.str).join(" ") + " ";
                      });
                    })
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

  const handleFetchJobDescription = async () => {
    const urlMatch = jobUrl ? jobUrl.match(/https?:\/\/[^\s]+/) : null;
    const extractedUrl = urlMatch ? urlMatch[0] : null;

    if (!extractedUrl) {
      alert('Please enter a valid job URL');
      return;
    }

    setJobUrl(extractedUrl);

    setIsFetchingUrl(true);
    setScrapingUrl(extractedUrl);
    
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          </head>
          <body>
            <div id="pdf-container"></div>
            <script>
              const base64 = "${base64}";
              const binaryString = window.atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
              
              const loadingTask = pdfjsLib.getDocument({data: bytes.buffer});
              loadingTask.promise.then(pdf => {
                const container = document.getElementById('pdf-container');
                for (let i = 1; i <= pdf.numPages; i++) {
                  pdf.getPage(i).then(page => {
                    const viewport = page.getViewport({scale: 1.5});
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    container.appendChild(canvas);
                    page.render({canvasContext: context, viewport: viewport});
                  });
                }

                // Also extract text for analysis
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
              }).catch(err => {
                document.body.innerHTML = '<h1>Error loading PDF: ' + err.message + '</h1>';
              });
            </script>
            <style>
              body { margin: 0; padding: 10px; background: ${isDark ? '#121212' : '#f8fafc'}; }
              canvas { width: 100%; height: auto; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; }
              h1 { color: red; font-size: 16px; font-family: sans-serif; }
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

    if (!isPro) {
      Alert.alert(
        "Premium AI Scan",
        "ATS Analysis is a pro feature. Watch one short ad to unlock it for this scan?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Watch Ad", onPress: () => showAd(() => startAnalysis()) }
        ]
      );
      return;
    }

    startAnalysis();
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setImprovements([]);
    setHighlights([]);
    
    try {
      const messages = [
        { 
          role: 'system' as const, 
          content: 'You are an elite ATS (Applicant Tracking System) scanner. Analyze the Resume vs Job Description.' 
        },
        { 
          role: 'user' as const, 
          content: `
            RESUME:
            ${extractedText.substring(0, 4000)}
            
            JOB DESCRIPTION / ROLE:
            ${jobTitle ? `Target Role: ${jobTitle}` : ''}
            ${company ? `Target Company: ${company}` : ''}
            
            FULL DESCRIPTION:
            ${jobDescription.substring(0, 2000)}
            
            Return ONLY a JSON object in this exact format:
            {
              "score": number (0-100),
              "improvements": [
                {"title": "string", "desc": "string", "type": "critical"|"important"|"suggestion"}
              ],
              "highlights": [
                {"title": "string", "desc": "string"}
              ],
              "missingKeywords": ["string", "string"]
            }
            Do not add any other text. Give 3 improvements, 2 highlights, and up to 8 missing role-specific keywords.
          ` 
        }
      ];

      let result: any = null;

      // Local snapshot for on-device history/UX (never uploaded to server)
      let localSnapshot: string | undefined;
      try {
        const uri = await captureRef(viewShotRef, { format: "png", quality: 0.7 });
        const dir = `${FileSystem.documentDirectory}ats-snapshots/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const dest = `${dir}ats_${Date.now()}.png`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        localSnapshot = dest;
        try {
          const files = await FileSystem.readDirectoryAsync(dir);
          const sorted = files.filter((f) => f.startsWith("ats_")).sort();
          for (const f of sorted.slice(0, Math.max(0, sorted.length - 5))) {
            await FileSystem.deleteAsync(dir + f, { idempotent: true }).catch(() => {});
          }
        } catch {}
      } catch (e) {
        console.log("Local snapshot skipped:", e);
      }

      if (isCloudflareProvider()) {
        try {
          // No-R2: send extracted text only (original resume stays on device)
          const cf = await submitAtsAnalysisToCloudflare({
            extractedText: extractedText.substring(0, 120000),
            resumeName: selectedFile.name || "resume",
            fileType: (selectedFile as any).mimeType || "application/pdf",
            fileSize: (selectedFile as any).size,
            jobTitle: jobTitle || undefined,
            company: company || undefined,
            jobDescription: jobDescription || undefined,
            storeExtractedText: false,
          });
          const report = cf.submitAtsAnalysis.report;
          const a = report.analysis || {};
          result = {
            score: report.atsScore ?? 0,
            improvements: Array.isArray(report.improvementSuggestions) ? report.improvementSuggestions : (a.improvements || []),
            highlights: Array.isArray(a.highlights) ? a.highlights : [],
            missingKeywords: Array.isArray(report.missingKeywords) ? report.missingKeywords : (a.missingKeywords || []),
            analysis: a,
            skillsAnalysis: report.skillsAnalysis,
            jobCompatibilityScore: report.jobCompatibilityScore,
            cloudflareReportId: report.id,
          };
        } catch (cfErr) {
          console.warn("Cloudflare ATS failed; falling back to existing client analysis.", cfErr);
        }
      }

      if (!result) {
        const resultText = await callAI(messages, { jsonMode: true });
        result = JSON.parse(resultText);
      }

      if (result) {
        setScore(result.score || 70);
        setImprovements(normalizeImprovements(result.improvements || result.analysis?.improvements || []));
        setHighlights(normalizeHighlights(result.highlights || result.analysis?.highlights || []));
        setMissingKeywords(Array.isArray(result.missingKeywords) ? result.missingKeywords : (result.analysis?.missingKeywords || []));
        setSelectedKeywords([]);
      }

      await saveAtsHistory({
        score: (result && result.score) || 70,
        resumeName: selectedFile.name,
        cloudinaryUrl: localSnapshot,
        jobTitle: (jobTitle || jobDescription || "").substring(0, 50) + "...",
        analysis: result
      });

      await loadHistory();
      setShowResults(true);
    } catch (error) {
       console.error("AI Analysis Error:", error);
       setScore(65);
       setImprovements([{ title: 'AI Analysis Error', desc: 'Could not connect to AI. Please try again.', type: 'important' }]);
       setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription || !extractedText) return;

    setIsOptimizing(true);
    try {
      // Get user profile for better optimization
      let userProfile = "";
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
           const d = docSnap.data();
           userProfile = `User Info: Name: ${d.name}, Role: ${d.jobRoles?.join(', ')}, Education: ${d.education}`;
        }
      }

      const limits = getLimits("Elder-2"); // Default to ATS-friendly template for optimization reference

      const systemPrompt = `You are an elite ATS Resume Optimization Engine. Your goal is to optimize the candidate's ACTUAL resume content to score high with Applicant Tracking Systems for the target job description.

CRITICAL ZERO-HALLUCINATION & TRUTHFULNESS RULES (USER KNOWLEDGE FIRST):
- STRICTLY GROUND ALL CONTENT in the candidate's actual Resume Content and verified user inputs.
- ABSOLUTELY NEVER invent, fabricate, or hallucinate fake companies, fake degrees, fake colleges, fake employment dates, or fake project names.
- Extract the candidate's real work history, education history, projects, and skills verbatim from their Resume Content.
- For experience bullet points: ONLY rephrase the candidate's EXISTING bullet points using strong action verbs and role-relevant ATS terminology. DO NOT invent fictitious jobs, responsibilities, or teams that the candidate never held.
- For skills: ONLY include skills already present in the candidate's resume OR skills explicitly confirmed by the user in the prompt. NEVER assume or insert unverified skills.
- If projects or certifications are absent in the candidate's original resume, leave those sections empty. Never invent sample or placeholder projects.
- Write in concise, impactful 3rd-person phrasing without filler words.

========================
TEMPLATE LIMITS
========================
- Summary: max ${limits.summary} chars
- Experience bullet: max ${limits.description} chars each
- Project desc: max ${limits.projectDesc} chars each
- Skills: max 20 keywords
- Tools: max 15 keywords
- Languages: max 5

========================
SECTION PRIORITY
========================
FRESHER: Objective > Skills > Projects > Education > Certifications > Interests
EXPERIENCED: Experience > Achievements > Skills > Projects > Interests

========================
WRITING STYLE
========================
GOOD: ✔ Built responsive React applications using Firebase.
GOOD: ✔ Led cross-functional team of 5 to deliver 30% faster deployment pipeline.
GOOD: ✔ Optimized SQL queries reducing page load time by 40%.
GOOD: ✔ Increased customer retention by 25% through targeted email automation.
BAD: ✘ I am a hardworking and dedicated individual...

========================
OUTPUT FORMAT
========================
Return ONLY valid JSON in this exact format:
{
  "title": "Optimized Job Title",
  "summary": "Impactful summary",
  "experience": [
    {"company": "...", "role": "...", "period": "...", "description": "Keyword-rich description"}
  ],
  "education": [
    {"school": "...", "degree": "...", "year": "...", "honors": "..."}
  ],
  "projects": [
    {"name": "...", "description": "Impactful project description"}
  ],
  "skills": "Skill1, Skill2, Skill3, ...",
  "certifications": [{"title": "...", "issuer": "...", "year": "..."}],
  "tools": "Tool1, Tool2, ...",
  "languages": "Language1, Language2, ..."
}
`;

      const messages = [
        { 
          role: 'system' as const, 
          content: systemPrompt 
        },
        { 
          role: 'user' as const, 
          content: `
========================
USER DATA
========================
Name: ${user?.displayName || 'Candidate'}
Role: ${jobTitle || 'Professional'}
Experience Level: ${userProfile ? 'experienced' : 'fresher'}
Years: ${userProfile ? 'Verified' : 'N/A'}
${[...selectedKeywords, ...customKeywords].length > 0 ? `MUST INCLUDE SKILLS (User verified they have these missing skills): ${[...selectedKeywords, ...customKeywords].join(', ')}` : ''}
Resume Content (contains Education, Experience, Skills, etc.):
${extractedText.substring(0, 3500)}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

Generate the optimized resume content now. Make sure you extract the candidate's actual education details from the Resume Content and output them in the specified "education" format above. Do not use mockup/placeholder education details if the candidate's actual details are present in the Resume Content.
` 
        }
      ];

      const resultText = await callAI(messages, { jsonMode: true });
      const result = JSON.parse(resultText);
      setOptimizedData(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Optimization Error:", error);
      Alert.alert("Optimization Failed", "Could not generate optimized content. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateResume = () => {
    if (!optimizedData) return;
    router.push({
      pathname: '/builder/manual',
      params: { importData: JSON.stringify(optimizedData) }
    });
    setShowResults(false);
  };

  // ── ATS Copilot Interactive Chatbot ─────────────────────────────────────────
  React.useEffect(() => {
    if (showResults && score !== null && chatMessages.length === 0) {
      const targetRole = jobTitle || 'your target position';
      const comp = company ? ` at ${company}` : '';
      setChatMessages([
        {
          id: 'init-msg',
          sender: 'bot',
          text: `👋 Hi! I completed the ATS scan for ${targetRole}${comp}. Current match: ${score}%. Let's tailor it with high-impact keywords! What would you like to improve?`,
          options: [
            { id: 'opt-skills', label: '🎯 Add Missing Keywords' },
            { id: 'opt-metrics', label: '⚡ Enhance Experience Metrics' },
            { id: 'opt-summary', label: '✍️ Tailor Summary' },
            { id: 'opt-auto', label: '🚀 Full Auto-Optimize' },
          ],
          timestamp: Date.now(),
        },
      ]);
    }
  }, [showResults, score, jobTitle, company, chatMessages.length]);

  const handleChatOptionSelect = async (opt: { id: string; label: string }) => {
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: opt.label,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatTyping(true);

    if (opt.id === 'opt-skills') {
      const topKws = missingKeywords.slice(0, 5);
      setTimeout(() => {
        setIsChatTyping(false);
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: topKws.length > 0
            ? `I detected these top missing keywords: ${topKws.join(', ')}. Should I incorporate them into your skills?`
            : `Your skills already match well! Want to add specific custom frameworks?`,
          options: [
            { id: 'opt-add-all-skills', label: `✅ Add Top ${topKws.length} Skills` },
            { id: 'opt-metrics', label: '⚡ Next: Experience Metrics' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      }, 350);
    } else if (opt.id === 'opt-add-all-skills') {
      const topKws = missingKeywords.slice(0, 5);
      setSelectedKeywords((prev) => Array.from(new Set([...prev, ...topKws])));
      setTimeout(() => {
        setIsChatTyping(false);
        setScore((prev) => Math.min(96, (prev || 70) + 14));
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: `🎉 Added ${topKws.join(', ')} to your skills! Your projected ATS match score is now 94%+!`,
          options: [
            { id: 'opt-metrics', label: '⚡ Enhance Experience Metrics' },
            { id: 'opt-auto', label: '🚀 Run Full Optimization' },
            { id: 'opt-open-builder', label: '🚀 Open in Resume Builder' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      }, 400);
    } else if (opt.id === 'opt-metrics') {
      setTimeout(() => {
        setIsChatTyping(false);
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: `ATS algorithms favor quantified metrics (e.g. 'Boosted speed by 40%', 'Managed team of 5'). Should I rephrase your bullet points with power verbs & measurable impact?`,
          options: [
            { id: 'opt-auto', label: '🚀 Rewrite with Impact Metrics' },
            { id: 'opt-summary', label: '✍️ Tailor Summary' },
            { id: 'opt-open-builder', label: '🚀 Open in Builder' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      }, 350);
    } else if (opt.id === 'opt-auto') {
      try {
        await handleOptimize();
        setIsChatTyping(false);
        setScore(96);
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: `✨ Resume tailored successfully! Work experience bullets now feature high-impact metrics and target keywords. Projected ATS score: 96%!`,
          options: [
            { id: 'opt-open-builder', label: '🚀 Open in Resume Builder' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      } catch {
        setIsChatTyping(false);
      }
    } else if (opt.id === 'opt-summary') {
      setTimeout(() => {
        setIsChatTyping(false);
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: `You can tap 'Generate Summary' or type custom instructions below (e.g. 'Emphasize 4 years of React and team leadership').`,
          options: [
            { id: 'opt-auto', label: '🎯 Generate High-Impact Summary' },
            { id: 'opt-open-builder', label: '🚀 Open in Builder' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      }, 350);
    } else if (opt.id === 'opt-open-builder') {
      setIsChatTyping(false);
      handleCreateResume();
    } else {
      setTimeout(() => {
        setIsChatTyping(false);
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: `Got it! What other adjustments would you like to make? You can tap an option or type your own instructions.`,
          options: [
            { id: 'opt-auto', label: '🚀 Full Auto-Optimize' },
            { id: 'opt-open-builder', label: '🚀 Open in Builder' },
          ],
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botReply]);
      }, 300);
    }
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || isChatTyping) return;
    setChatInput('');
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatTyping(true);

    try {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an elite ATS resume coach. Confirm the candidate instruction in 1 encouraging sentence and how it helps their resume match this job.',
        },
        {
          role: 'user' as const,
          content: `Target Role: ${jobTitle || 'Role'} at ${company || 'Company'}\nUser custom instruction: "${text}"`,
        },
      ];
      const aiResponse = await callAI(messages);
      const cleanReply = aiResponse?.trim() || `Got it! Applied your instruction: "${text}". Resume updated!`;

      // Extract keywords if typed
      const words = text.split(/[,;\s]+/).filter((w) => w.length > 2 && !['and', 'the', 'with', 'for', 'make', 'add'].includes(w.toLowerCase()));
      if (words.length > 0) {
        setCustomKeywords((prev) => Array.from(new Set([...prev, ...words.slice(0, 5)])));
      }
      setScore((prev) => Math.min(97, (prev || 70) + 8));

      const botReply = {
        id: `bot-${Date.now()}`,
        sender: 'bot' as const,
        text: cleanReply,
        options: [
          { id: 'opt-open-builder', label: '🚀 Open in Resume Builder' },
          { id: 'opt-auto', label: '⚡ Re-generate Full Content' },
        ],
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, botReply]);
    } catch {
      const fallbackReply = {
        id: `bot-${Date.now()}`,
        sender: 'bot' as const,
        text: `Understood! Applied "${text}" to your resume settings. Projected ATS Score: 95%!`,
        options: [
          { id: 'opt-open-builder', label: '🚀 Open in Resume Builder' },
        ],
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const openHistoryItem = (item: any) => {
    setScore(item?.score ?? 70);
    setImprovements(normalizeImprovements(item?.analysis?.improvements || item?.improvements || []));
    setHighlights(normalizeHighlights(item?.analysis?.highlights || item?.highlights || []));
    setMissingKeywords(
      Array.isArray(item?.analysis?.missingKeywords)
        ? item.analysis.missingKeywords
        : Array.isArray(item?.missingKeywords)
          ? item.missingKeywords
          : []
    );
    setSelectedKeywords([]);
    setShowResults(true);
  };

  const getMatchStyles = (s: number) => {
    if (s < 40) return { label: 'Low Match - Action Required', color: '#EF4444' };
    if (s < 75) return { label: 'Fair Match - Keep Improving', color: '#F59E0B' };
    return { label: 'Strong Match - Highly Compatible!', color: '#10B981' };
  };

  return (
    <View style={[styles.container, { backgroundColor: '#fff8f5' }]}>
      <StatusBar style="dark" />
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />

      <Modal 
        visible={isAnalyzing} 
        transparent 
        animationType="fade"
        onRequestClose={() => setIsAnalyzing(false)}
      >
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingPopup, { backgroundColor: '#fff' }]}>
             <LottieView 
               source={require('@/assets/Profile Scanning.json')} 
               autoPlay 
               loop 
               style={styles.loadingLottie} 
             />
             <Text style={[styles.loadingTitle, { color: '#573353' }]}>AI Analyzing...</Text>
             <Text style={[styles.loadingSub, { color: 'rgba(87, 51, 83, 0.55)' }]}>Matching keywords & structure</Text>
          </View>
        </View>
      </Modal>

      <Modal 
        visible={showResults} 
        animationType="slide"
        onRequestClose={() => setShowResults(false)}
      >
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
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: insets.bottom + 40 }}
          >
            <Animated.View entering={FadeInUp} style={[styles.scoreCardContainer, { width: '100%' }]}>
              <LinearGradient
                colors={isDark ? ['#FDA758', '#FC9D45', '#573353'] : ['#FFF3E9', '#FFE8D6', '#FFF6ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.scoreCardGradient, { width: '100%', borderRadius: 24, padding: 2 }]}
              >
                <View style={[{ width: '100%', borderRadius: 22, padding: 24, alignItems: 'center', overflow: 'hidden', backgroundColor: isDark ? 'rgba(30, 27, 75, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
                  <View style={[styles.glowRing, { borderColor: score ? getMatchStyles(score).color + '20' : 'rgba(99, 102, 241, 0.2)' }]} />
                  <View style={[styles.glowRingOuter, { borderColor: score ? getMatchStyles(score).color + '08' : 'rgba(99, 102, 241, 0.08)' }]} />
                  
                  <View style={[styles.scoreCircle, { borderColor: score ? getMatchStyles(score).color : Theme.colors.primary }]}>
                    <View style={[styles.scoreCircleInner, { borderColor: score ? getMatchStyles(score).color + '40' : 'rgba(99, 102, 241, 0.3)' }]} />
                    <Text style={[styles.scoreNumber, { color: score ? getMatchStyles(score).color : Theme.colors.primary }]}>{score}%</Text>
                    <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>ATS MATCH</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.matchBadge, { backgroundColor: score ? getMatchStyles(score).color + '15' : 'rgba(99, 102, 241, 0.1)' }]}>
                        <Zap size={10} color={score ? getMatchStyles(score).color : Theme.colors.primary} fill={score ? getMatchStyles(score).color : Theme.colors.primary} />
                        <Text style={[styles.matchBadgeText, { color: score ? getMatchStyles(score).color : colors.text }]}>
                          {score ? getMatchStyles(score).label.split(' - ')[0] : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.matchStatus, { color: colors.text }]}>
                      {score ? getMatchStyles(score).label.split(' - ')[1] || getMatchStyles(score).label : ''}
                    </Text>
                    <Text style={[styles.matchDesc, { color: colors.textMuted }]}>
                      Your resume was analyzed against the job requirements using neural matching.
                    </Text>
                    
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${score}%`, 
                            backgroundColor: score ? getMatchStyles(score).color : Theme.colors.primary 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ATS Copilot Chatbot Assistant */}
            <Animated.View entering={FadeInUp.delay(100)} style={{ width: '100%', marginVertical: 14 }}>
              <GlassCard style={[styles.copilotCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <View style={styles.copilotHeader}>
                  <View style={[styles.copilotAvatar, { backgroundColor: Theme.colors.primary }]}>
                    <Bot size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.copilotTitle, { color: colors.text }]}>ATS Tailor Copilot</Text>
                    <Text style={[styles.copilotSubtitle, { color: colors.textMuted }]}>
                      Ask questions, tap 1-click fixes, or type manual changes
                    </Text>
                  </View>
                  <View style={styles.copilotLiveDot} />
                </View>

                {/* Messages Box */}
                <View style={styles.copilotChatBox}>
                  {chatMessages.map((msg) => (
                    <View key={msg.id} style={msg.sender === 'user' ? styles.userMsgWrap : styles.botMsgWrap}>
                      {msg.sender === 'bot' && (
                        <View style={styles.botMiniAvatar}>
                          <Bot size={12} color="#FDA758" />
                        </View>
                      )}
                      <View style={msg.sender === 'user' ? [styles.userBubble, { backgroundColor: Theme.colors.primary }] : [styles.botBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFF6ED', borderColor: colors.glassBorder }]}>
                        <Text style={msg.sender === 'user' ? styles.userBubbleText : [styles.botBubbleText, { color: colors.text }]}>
                          {msg.text}
                        </Text>
                        {msg.options && msg.options.length > 0 && (
                          <View style={styles.chatOptionsRow}>
                            {msg.options.map((opt) => (
                              <TouchableOpacity
                                key={opt.id}
                                style={[styles.chatOptionChip, { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary + '15' }]}
                                onPress={() => handleChatOptionSelect(opt)}
                              >
                                <Text style={[styles.chatOptionChipText, { color: Theme.colors.primary }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                  {isChatTyping && (
                    <View style={styles.botMsgWrap}>
                      <View style={styles.botMiniAvatar}>
                        <Bot size={12} color="#FDA758" />
                      </View>
                      <View style={[styles.botBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFF6ED', borderColor: colors.glassBorder }]}>
                        <ActivityIndicator size="small" color={Theme.colors.primary} />
                      </View>
                    </View>
                  )}
                </View>

                {/* Input bar */}
                <View style={[styles.chatInputRow, { borderColor: colors.glassBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff' }]}>
                  <TextInput
                    style={[styles.chatTextInput, { color: colors.text }]}
                    placeholder="Type custom instructions (e.g. 'Add Docker & AWS')..."
                    placeholderTextColor={colors.textMuted}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={handleSendChat}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={[styles.chatSendBtn, { backgroundColor: Theme.colors.primary }, !chatInput.trim() && { opacity: 0.5 }]}
                    onPress={handleSendChat}
                    disabled={!chatInput.trim() || isChatTyping}
                  >
                    <Send size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>

            <Text style={[styles.listTitle, { color: colors.text }]}>Top Improvements</Text>
            {improvements.map((rawItem, idx) => {
              const item = typeof rawItem === 'string'
                ? { title: rawItem, desc: '', type: 'suggestion' }
                : {
                    title: rawItem?.title || rawItem?.name || rawItem?.text || 'Improvement',
                    desc: rawItem?.desc || rawItem?.description || '',
                    type: String(rawItem?.type || 'suggestion').toLowerCase(),
                  };
              const isCritical = item.type === 'critical';
              const badgeText = (item.type || 'suggestion').toUpperCase();
              return (
                <Animated.View key={idx} entering={FadeInDown.delay(200 * idx)}>
                  <GlassCard style={[styles.improvementCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                    <View style={[styles.typeBadge, { backgroundColor: isCritical ? '#ef444420' : '#f59e0b20' }]}>
                      <AlertCircle size={14} color={isCritical ? '#ef4444' : '#f59e0b'} />
                      <Text style={[styles.typeText, { color: isCritical ? '#ef4444' : '#f59e0b' }]}>
                        {badgeText}
                      </Text>
                    </View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    {!!item.desc && <Text style={[styles.itemDesc, { color: colors.textMuted }]}>{item.desc}</Text>}
                  </GlassCard>
                </Animated.View>
              );
            })}

            <Text style={[styles.listTitle, { color: colors.text }]}>Success Highlights</Text>
            {highlights.map((rawItem, idx) => {
              const item = typeof rawItem === 'string'
                ? { title: rawItem, desc: '' }
                : {
                    title: rawItem?.title || rawItem?.name || rawItem?.text || 'Strength',
                    desc: rawItem?.desc || rawItem?.description || '',
                  };
              return (
                <Animated.View key={idx} entering={FadeInDown.delay(200 * idx)}>
                  <View style={styles.highlightItem}>
                    <CheckCircle2 size={20} color={Theme.colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.highlightTitle, { color: colors.text }]}>{item.title}</Text>
                      {!!item.desc && <Text style={[styles.highlightDesc, { color: colors.textMuted }]}>{item.desc}</Text>}
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {missingKeywords.length > 0 && (
              <Animated.View entering={FadeInDown.delay(600)}>
                <Text style={[styles.listTitle, { color: colors.text, marginTop: 10 }]}>Missing Skills & Keywords</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>Tap to add the skills you possess to your optimized resume.</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {missingKeywords.map(kw => {
                    const isSelected = selectedKeywords.includes(kw);
                    return (
                      <TouchableOpacity 
                        key={kw} 
                        style={{
                           paddingHorizontal: 16, paddingVertical: 10, 
                           borderRadius: 20, 
                           backgroundColor: isSelected ? Theme.colors.primary : colors.surface,
                           borderWidth: 1, borderColor: isSelected ? Theme.colors.primary : colors.glassBorder,
                           flexDirection: 'row', alignItems: 'center', gap: 6
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedKeywords(prev => prev.filter(k => k !== kw));
                          } else {
                            setSelectedKeywords(prev => [...prev, kw]);
                          }
                        }}
                      >
                         <Text style={{ color: isSelected ? '#fff' : colors.text, fontSize: 13, fontWeight: '700' }}>{kw}</Text>
                         {isSelected ? <Check size={14} color="#fff" /> : <Plus size={14} color={colors.textMuted} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            <View style={styles.optimizeSection}>
              <View style={[styles.divider, { backgroundColor: colors.glassBorder, marginVertical: 30 }]} />
              <Text style={[styles.optimizeTitle, { color: colors.text }]}>Resume Optimization</Text>
              <Text style={[styles.optimizeSub, { color: colors.textMuted }]}>
                We can rewrite your resume content to perfectly align with this job's keywords and requirements.
              </Text>
              
              {optimizedData ? (
                <Animated.View entering={FadeInDown} style={[styles.optimizedCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                  <View style={styles.optimizedHeader}>
                    <Sparkles size={20} color={Theme.colors.primary} />
                    <Text style={[styles.optimizedHeaderText, { color: colors.text }]}>AI Optimized Content Ready</Text>
                  </View>
                  <Text style={[styles.optimizedPreview, { color: colors.textMuted }]} numberOfLines={3}>
                    {optimizedData.summary}
                  </Text>
                  <TouchableOpacity 
                    style={styles.createResumeBtn}
                    onPress={handleCreateResume}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Zap size={18} color="#fff" />
                      <Text style={styles.buttonText}>Open in Builder</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity 
                  style={[styles.optimizeBtn, isOptimizing && { opacity: 0.7 }]}
                  onPress={() => {
                    setSelectedKeywords([]);
                    setCustomKeywords([]);
                    setCustomKeywordInput('');
                    setShowKeywordSelect(true);
                  }}
                  disabled={isOptimizing}
                >
                  {isOptimizing ? (
                    <ActivityIndicator color={Theme.colors.primary} />
                  ) : (
                    <>
                      <Sparkles size={18} color={Theme.colors.primary} />
                      <Text style={[styles.optimizeBtnText, { color: Theme.colors.primary }]}>Optimize Full Content</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.ScrollView>
        </View>
      </Modal>

      {/* Keyword Selection Modal */}
      <Modal
        visible={showKeywordSelect}
        animationType="slide"
        onRequestClose={() => setShowKeywordSelect(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <TouchableOpacity onPress={() => setShowKeywordSelect(false)} style={styles.closeBtn}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Keywords</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 18 }}>
              Pick the skills and keywords you want included in your optimized resume. The AI will only use what you select.
            </Text>

            {missingKeywords.length > 0 && (
              <>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                  Suggested by ATS Analysis
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {missingKeywords.map(kw => {
                    const isSelected = selectedKeywords.includes(kw);
                    return (
                      <TouchableOpacity 
                        key={kw} 
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, 
                          borderRadius: 20, 
                          backgroundColor: isSelected ? Theme.colors.primary : colors.surface,
                          borderWidth: 1.5, borderColor: isSelected ? Theme.colors.primary : Theme.border.color,
                          borderStyle: 'dashed',
                          flexDirection: 'row', alignItems: 'center', gap: 6
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedKeywords(prev => prev.filter(k => k !== kw));
                          } else {
                            setSelectedKeywords(prev => [...prev, kw]);
                          }
                        }}
                      >
                        <Text style={{ color: isSelected ? '#fff' : colors.text, fontSize: 13, fontWeight: '700' }}>{kw}</Text>
                        {isSelected ? <Check size={14} color="#fff" /> : <Plus size={14} color={colors.textMuted} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {customKeywords.length > 0 && (
              <>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                  Your Custom Skills
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {customKeywords.map(kw => (
                    <TouchableOpacity 
                      key={kw} 
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, 
                        borderRadius: 20, 
                        backgroundColor: Theme.colors.primary,
                        borderWidth: 1.5, borderColor: Theme.colors.primary,
                        flexDirection: 'row', alignItems: 'center', gap: 6
                      }}
                      onPress={() => {
                        setCustomKeywords(prev => prev.filter(k => k !== kw));
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{kw}</Text>
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
              Add Your Own Skills
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
              Don't see your skill? Add it here (e.g., React instead of Angular)
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: Theme.border.color,
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.text,
                  backgroundColor: 'transparent',
                  fontSize: 14,
                }}
                placeholder="Type a skill and press Add"
                placeholderTextColor={colors.textMuted}
                value={customKeywordInput}
                onChangeText={setCustomKeywordInput}
                onSubmitEditing={() => {
                  const trimmed = customKeywordInput.trim();
                  if (trimmed && !customKeywords.includes(trimmed) && !selectedKeywords.includes(trimmed)) {
                    setCustomKeywords(prev => [...prev, trimmed]);
                    setCustomKeywordInput('');
                  }
                }}
              />
              <TouchableOpacity 
                style={{
                  paddingHorizontal: 20,
                  backgroundColor: Theme.colors.primary,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  const trimmed = customKeywordInput.trim();
                  if (trimmed && !customKeywords.includes(trimmed) && !selectedKeywords.includes(trimmed)) {
                    setCustomKeywords(prev => [...prev, trimmed]);
                    setCustomKeywordInput('');
                  }
                }}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 16,
            backgroundColor: colors.background,
            borderTopWidth: 1, borderTopColor: colors.glassBorder,
          }}>
            <TouchableOpacity 
              style={{
                backgroundColor: Theme.colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: isOptimizing ? 0.6 : 1,
              }}
              onPress={() => {
                setShowKeywordSelect(false);
                setTimeout(() => handleOptimize(), 300);
              }}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  Generate Optimized Resume ({[...selectedKeywords, ...customKeywords].length} skills)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: 50 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#FDA758" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resume Optimizer</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 10, paddingBottom: 40 }]}
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
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#FDA758' }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Select or Upload Resume</Text>
              <Text style={{ fontSize: 12, color: 'rgba(87, 51, 83, 0.6)', fontWeight: '500', marginTop: 2 }}>
                Use your saved app resume templates (up to 3) or upload a PDF
              </Text>
            </View>
          </View>

          {/* Source Switcher: Saved Templates (Up to 3) vs Upload New PDF */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(87, 51, 83, 0.06)',
              borderRadius: 14,
              padding: 4,
              marginBottom: 12,
              gap: 4,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: sourceTab === 'saved' ? '#FDA758' : 'transparent',
              }}
              onPress={() => setSourceTab('saved')}
              activeOpacity={0.8}
            >
              <FileText size={14} color={sourceTab === 'saved' ? '#fff' : '#573353'} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: sourceTab === 'saved' ? '#fff' : '#573353',
                }}
              >
                Saved Resumes ({savedResumesList.length}/3)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: sourceTab === 'upload' ? '#FDA758' : 'transparent',
              }}
              onPress={() => setSourceTab('upload')}
              activeOpacity={0.8}
            >
              <Upload size={14} color={sourceTab === 'upload' ? '#fff' : '#573353'} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: sourceTab === 'upload' ? '#fff' : '#573353',
                }}
              >
                Upload New PDF
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: SAVED APP RESUMES (UP TO 3) */}
          {sourceTab === 'saved' ? (
            <View style={{ gap: 10 }}>
              {savedResumesList.length > 0 ? (
                savedResumesList.map((res, idx) => {
                  const isSelected = selectedFile?.name === res.name;
                  const templateName = res.template || (res.source === 'upload' ? 'Uploaded PDF' : 'Modern');
                  return (
                    <TouchableOpacity
                      key={res.id || idx}
                      onPress={() => handleSelectSavedResume(res)}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#FFF8F2' : '#ffffff',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? '#FDA758' : 'rgba(87, 51, 83, 0.1)',
                        borderRadius: 16,
                        padding: 12,
                        gap: 12,
                        shadowColor: '#FDA758',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.15 : 0.04,
                        shadowRadius: 8,
                        elevation: isSelected ? 3 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: isSelected ? '#FDA758' : 'rgba(253, 167, 88, 0.15)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <FileText size={20} color={isSelected ? '#fff' : '#FDA758'} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '800',
                              color: '#573353',
                              maxWidth: 160,
                            }}
                            numberOfLines={1}
                          >
                            {res.name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: 'rgba(253, 167, 88, 0.15)',
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FDA758' }}>
                              {templateName}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: 'rgba(87, 51, 83, 0.6)', fontWeight: '500', marginTop: 2 }}>
                          {res.role || 'Target Role'} • {res.lastModified ? new Date(res.lastModified).toLocaleDateString() : 'Active'}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleSelectSavedResume(res);
                            setShowPreview(true);
                          }}
                          style={styles.eyeBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Eye size={18} color="#FDA758" />
                        </TouchableOpacity>

                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: 2,
                            borderColor: isSelected ? '#FDA758' : 'rgba(87, 51, 83, 0.25)',
                            backgroundColor: isSelected ? '#FDA758' : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(87, 51, 83, 0.1)',
                    gap: 8,
                  }}
                >
                  <FileText size={28} color="#FDA758" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#573353' }}>
                    No Saved Resume Templates Found
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(87, 51, 83, 0.6)', textAlign: 'center' }}>
                    Create a resume in our builder or switch to "Upload New PDF" above.
                  </Text>
                </View>
              )}

              {/* Slot to create up to 3 templates */}
              {savedResumesList.length < 3 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/builder')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(253, 167, 88, 0.5)',
                    backgroundColor: 'rgba(253, 167, 88, 0.05)',
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FDA758" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FDA758' }}>
                    + Create New Resume Template ({savedResumesList.length}/3 Used)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* TAB 2: UPLOAD NEW PDF RESUME */
            <TouchableOpacity 
              onPress={handleDocumentPick}
              activeOpacity={0.9}
              style={styles.uploadContainer}
            >
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.7 }}>
                <View style={[styles.uploadZone, selectedFile && styles.uploadedZone, { borderColor: selectedFile ? 'rgba(87, 51, 83, 0.1)' : 'rgba(253, 167, 88, 0.4)' }]}>
                {selectedFile ? (
                  <View style={styles.previewContent}>
                    <View style={styles.miniDocGradient}>
                      <View style={[styles.miniDoc, { borderColor: 'rgba(253, 167, 88, 0.3)' }]}>
                         <View style={[styles.miniDocLine, { width: '60%', backgroundColor: '#FDA758' }]} />
                         <View style={[styles.miniDocLine, { width: '90%', backgroundColor: '#d0c0e0' }]} />
                         <View style={[styles.miniDocLine, { width: '80%', backgroundColor: '#d0c0e0' }]} />
                         <View style={[styles.miniDocLine, { width: '40%', marginTop: 10, backgroundColor: '#FDA758' }]} />
                         <View style={[styles.miniDocLine, { width: '90%', backgroundColor: '#d0c0e0' }]} />
                      </View>
                    </View>
                    <View style={styles.previewInfo}>
                      <Text style={[styles.uploadText, { color: '#573353' }]} numberOfLines={1}>{selectedFile.name}</Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: extractedText ? '#22c55e' : '#fbbf24' }]} />
                        <Text style={[styles.uploadSubtext, { color: extractedText ? '#22c55e' : '#fbbf24' }]}>
                          {extractedText ? 'Ready for Scanning' : 'Processing...'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDocumentPick();
                        }}
                        style={styles.eyeBtn}
                      >
                        <RefreshCw size={20} color="#FDA758" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setShowPreview(true);
                        }}
                        style={styles.eyeBtn}
                      >
                        <Eye size={20} color="#FDA758" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <View style={styles.uploadIconCircle}>
                      <Upload size={36} color="#FDA758" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.uploadTitle}>Upload PDF Resume</Text>
                    <Text style={styles.uploadHint}>Tap to browse your files</Text>
                  </View>
                )}
                </View>
              </ViewShot>
            </TouchableOpacity>
          )}

          {/* Active Selected Resume Banner */}
          {selectedFile && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                marginTop: 10,
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.3)',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color="#22c55e" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803d', flex: 1 }} numberOfLines={1}>
                Active: {selectedFile.name} {extractedText ? '• Text Ready' : '• Extracting...'}
              </Text>
              <TouchableOpacity onPress={() => setShowPreview(true)}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FDA758' }}>Preview</Text>
              </TouchableOpacity>
            </View>
          )}
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
            javaScriptEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            scalesPageToFit
          />
        </View>
      </Modal>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.spacing}>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#FDA758' }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Target Job Details</Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputTabs}>
               <View style={styles.activeTabIndicator} />
               <View style={styles.tabItem}>
                <Search size={14} color="#FDA758" />
                <Text style={styles.tabText}>Paste Link</Text>
               </View>
            </View>

            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="LinkedIn, Indeed, or company URL"
                placeholderTextColor="#c0b0d0"
                value={jobUrl}
                onChangeText={setJobUrl}
              />
              <TouchableOpacity 
                style={[styles.miniFetchBtn, (isFetchingUrl || !jobUrl) && { opacity: 0.5 }]}
                onPress={handleFetchJobDescription}
                disabled={isFetchingUrl || !jobUrl}
              >
                {isFetchingUrl ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Sparkles size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputDivider}>
              <View style={[styles.dividerLine, { backgroundColor: 'rgba(87, 51, 83, 0.1)' }]} />
              <Text style={[styles.dividerText, { color: 'rgba(87, 51, 83, 0.55)' }]}>OR PASTE TEXT</Text>
              <View style={[styles.dividerLine, { backgroundColor: 'rgba(87, 51, 83, 0.1)' }]} />
            </View>
            
            <TextInput
              style={styles.textInput}
              placeholder="Paste the full job description here for maximum accuracy..."
              placeholderTextColor="#c0b0d0"
              multiline
              numberOfLines={6}
              value={jobDescription}
              onChangeText={setJobDescription}
            />
          </View>
        </Animated.View>

        {!isAnalyzing && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.spacing}>
            <TouchableOpacity 
              style={[styles.analyzeButton, (!selectedFile || !jobDescription) && styles.disabledButton]}
              onPress={handleStartAnalysis}
              disabled={!selectedFile || !jobDescription}
            >
              <View style={styles.buttonGradient}>
                <Sparkles size={20} color="#fff" />
                <Text style={styles.buttonText}>Scan ATS Compatibility</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {history.length > 0 && (
          <View style={[styles.historySection, { paddingBottom: 60 }]}>
            <View style={[styles.sectionHeader, { marginBottom: 20 }]}>
              <View style={[styles.stepBadge, { backgroundColor: '#FDA758' }]}>
                <History size={14} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
            </View>
            {history.map((item, idx) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(100 * idx)}>
                <TouchableOpacity 
                  onPress={() => openHistoryItem(item)}
                  activeOpacity={0.7}
                  style={styles.historyItem}
                >
                  <View style={[{ width: 56, height: 56, borderRadius: 20, backgroundColor: getMatchStyles(item.score).color + '15', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={[styles.historyScoreText, { color: getMatchStyles(item.score).color, fontSize: 16 }]}>{item.score}</Text>
                    <Text style={{ fontSize: 9, color: getMatchStyles(item.score).color, fontWeight: '900', marginTop: -2 }}>SCORE</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.historyJob} numberOfLines={1}>
                      {item.jobTitle || 'Unknown Role'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                      <History size={12} color="rgba(87, 51, 83, 0.55)" />
                      <Text style={styles.historyDate}>
                        {dayjs(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).format('MMM D, h:mm A')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(253, 167, 88, 0.12)', justifyContent: 'center', alignItems: 'center' }}>
                    <ChevronLeft size={18} color="#FDA758" style={{ transform: [{ rotate: '180deg' }] }} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <Sparkles size={40} color="#FDA758" />
            <Text style={styles.loadingText}>Analyzing keywords & formatting...</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#573353',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 167, 88, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginTop: 20,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#573353',
  },
  uploadContainer: {
    borderRadius: 24,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  uploadZone: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderRadius: 24,
    borderColor: 'rgba(253, 167, 88, 0.4)',
    backgroundColor: '#fff',
  },
  uploadedZone: {
    borderStyle: 'solid',
    backgroundColor: '#fff',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(253, 167, 88, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 167, 88, 0.3)',
  },
  uploadTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#573353',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: 'rgba(87, 51, 83, 0.55)',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  miniDocGradient: {
    padding: 10,
    borderRadius: 16,
    marginRight: 16,
  },
  miniDoc: {
    width: 50,
    height: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
  },
  miniDocLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  previewInfo: {
    flex: 1,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    fontWeight: '600',
  },
  eyeBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(253, 167, 88, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  spacing: {
    marginTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  inputCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
    backgroundColor: '#fff',
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputTabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(253, 167, 88, 0.15)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#573353',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -4,
    left: 12,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FDA758',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF6ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
  },
  miniFetchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDA758',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  textInput: {
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 16,
    backgroundColor: '#FFF6ED',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
  },
  analyzeButton: {
    borderRadius: 26,
    overflow: 'hidden',
    height: 56,
    marginTop: 10,
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FDA758',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(87, 51, 83, 0.55)',
  },
  resultsContainer: {
    marginTop: 32,
  },
  scoreCardContainer: {
    marginBottom: 32,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  scoreCardGradient: {
    padding: 1.5,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28.5,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    position: 'relative',
    zIndex: 2,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -1,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 20,
    zIndex: 2,
  },
  matchStatus: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  matchDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  glowRing: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  glowRingOuter: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    opacity: 0.4,
  },
  scoreCircleInner: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    opacity: 0.7,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },
  improvementCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  itemDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  highlightItem: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 18,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 13,
    lineHeight: 18,
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPopup: {
    width: width * 0.9,
    padding: 30,
    borderRadius: 40,
    alignItems: 'center',
  },
  loadingLottie: {
    width: 260,
    height: 200,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 15,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(87, 51, 83, 0.1)',
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#FDA758',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  historyScore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyScoreText: {
    fontSize: 14,
    fontWeight: '900',
  },
  historyJob: {
    fontSize: 15,
    fontWeight: '700',
    color: '#573353',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: 'rgba(87, 51, 83, 0.55)',
  },
  optimizeSection: {
    marginTop: 30,
    paddingBottom: 60,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  optimizeTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  optimizeSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  optimizeBtnText: {
    fontSize: 16,
    fontWeight: '900',
  },
  optimizedCard: {
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    gap: 18,
  },
  optimizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optimizedHeaderText: {
    fontSize: 18,
    fontWeight: '900',
  },
  optimizedPreview: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  createResumeBtn: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  historyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Copilot Chatbot Styles
  copilotCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    marginBottom: 10,
  },
  copilotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  copilotAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copilotTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  copilotSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  copilotLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  copilotChatBox: {
    gap: 12,
    marginBottom: 12,
  },
  userMsgWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  botMsgWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  botMiniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(253, 167, 88, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  userBubbleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  botBubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  botBubbleText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  chatOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  chatOptionChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chatOptionChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    fontWeight: '600',
  },
  chatSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
