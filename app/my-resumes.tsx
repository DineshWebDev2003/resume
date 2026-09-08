import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter, useFocusEffect } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FileText,
  Download,
  Trash2,
  ChevronRight,
  Plus,
  Upload,
  ShieldCheck,
  Target
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getResumes, deleteResume, saveResume } from '@/utils/storage';
import { getAtsHistory } from '@/services/firestore';
import { exportToPDF } from '@/utils/resume-exporter';
import { ActivityIndicator } from 'react-native';

const formatDate = (timestamp: any) => {
  if (!timestamp) return "Recent";
  
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    const numStamp = typeof timestamp === "string" ? parseInt(timestamp, 10) : Number(timestamp);
    if (isNaN(numStamp)) {
      const parsed = Date.parse(timestamp);
      if (isNaN(parsed)) {
        return "Recent";
      }
      date = new Date(parsed);
    } else {
      date = new Date(numStamp);
    }
  }
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffTime < 60000) {
    return "Just now";
  }
  
  if (diffDays <= 1) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffTime / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 2) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function MyResumesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const pendingFileUri = React.useRef<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const localResumes = await getResumes();
      const atsHistory = await getAtsHistory();
      setResumes([
        ...localResumes.map((r) => ({ ...r, type: "builder" })),
        ...atsHistory.map((a: any) => ({
          ...a,
          name: a.resumeName,
          date: "recent",
          type: "ats",
        })),
      ]);
    } catch (e) {
      console.error("Load resumes error:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await reload();
        setLoading(false);
      };
      loadData();
    }, [reload])
  );

  /** Upload an older resume PDF: extract text, save as a resume for matching. */
  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      pendingFileUri.current = file.uri;
      setExtracting(true);
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      setPdfHtml(`
        <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        </head><body><script>
          try {
            var pdfData = atob("${base64}");
            pdfjsLib.getDocument({data: pdfData}).promise.then(function(pdf) {
              var fullText = "";
              var ps = [];
              for (var i = 1; i <= pdf.numPages; i++) {
                ps.push(pdf.getPage(i).then(function(p) {
                  return p.getTextContent().then(function(c) {
                    fullText += c.items.map(function(x) { return x.str; }).join(" ") + " ";
                  });
                }));
              }
              Promise.all(ps).then(function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({type:'upload_text_extracted', name: ${JSON.stringify(file.name)}, text: fullText}));
              });
            }).catch(function(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type:'upload_text_error', error: String(e)}));
            });
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'upload_text_error', error: String(e)}));
          }
        </script></body></html>
      `);
    } catch (e: any) {
      setExtracting(false);
      Alert.alert('Upload failed', e?.message || 'Could not read that file.');
    }
  };

  const handleUploadMessage = async (raw: string) => {
    let d: any;
    try { d = JSON.parse(raw); } catch { return; }
    if (d.type !== 'upload_text_extracted' && d.type !== 'upload_text_error') return;
    setPdfHtml(null);
    if (d.type === 'upload_text_error' || !d.text?.trim()) {
      setExtracting(false);
      Alert.alert('Could not read PDF', 'That file has no extractable text (it may be scanned images).');
      return;
    }
    const text: string = d.text;
    const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || '';
    const phone = (text.match(/\+?\d[\d\s\-()]{7,}\d/) || [])[0] || '';
    const prettyName = String(d.name || 'Uploaded Resume')
      .replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || 'Uploaded Resume';
    const res = await saveResume({
      name: prettyName,
      role: 'Uploaded PDF',
      template: 'Elder-1',
      color: Theme.colors.primary,
      fileUri: pendingFileUri.current || undefined,
      source: 'upload',
      data: {
        name: prettyName,
        title: '',
        email,
        phone,
        location: '',
        summary: text.slice(0, 300),
        experience: [],
        education: [],
        projects: [],
        skills: text.slice(0, 4000),
        tools: '',
        languages: '',
        links: [],
        certifications: [],
      } as any,
    });
    setExtracting(false);
    if (res.success) {
      await reload();
      Alert.alert('Resume saved', `"${prettyName}" is ready — Auto Apply can now match with your real skills.`);
    } else {
      Alert.alert('Save failed', res.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Resume",
      "Are you sure you want to delete this resume?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteResume(id);
            // Refresh list
            const localResumes = await getResumes();
            const atsHistory = await getAtsHistory();
            setResumes([
                ...localResumes.map((r) => ({ ...r, type: "builder" })),
                ...atsHistory.map((a: any) => ({
                  ...a,
                  name: a.resumeName,
                  date: "recent",
                  type: "ats",
                })),
            ]);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Resumes</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/builder')}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Plus size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Upload older resume */}
        <TouchableOpacity
          style={[styles.uploadCard, { backgroundColor: colors.surface, borderColor: Theme.colors.primary }]}
          onPress={handleUploadPdf}
          disabled={extracting}
          activeOpacity={0.8}
        >
          <View style={[styles.uploadIconBox, { backgroundColor: Theme.colors.primary + '15' }]}>
            {extracting
              ? <ActivityIndicator color={Theme.colors.primary} size="small" />
              : <Upload size={20} color={Theme.colors.primary} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              {extracting ? 'Reading your PDF…' : 'Upload older resume (PDF)'}
            </Text>
            <Text style={[styles.uploadSub, { color: colors.textMuted }]}>
              We extract its text so Auto Apply matches your real skills
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {pdfHtml !== null && (
          <View style={{ height: 0, width: 0, opacity: 0 }}>
            <WebView
              source={{ html: pdfHtml }}
              javaScriptEnabled
              onMessage={(e) => handleUploadMessage(e.nativeEvent.data)}
            />
          </View>
        )}
        {loading ? (
           <ActivityIndicator color={Theme.colors.primary} size="large" style={{ marginTop: 100 }} />
        ) : resumes.length > 0 ? (
          resumes.map((resume, i) => (
             <Animated.View key={i} entering={FadeInDown.delay(i * 100)}>
               <TouchableOpacity
                 key={resume.id || i}
                 style={[
                   styles.chatCard,
                   {
                     backgroundColor: colors.surface,
                   },
                 ]}
                  onPress={() =>
                    router.push(
                      resume.type === "ats"
                        ? "/builder/ats"
                        : resume.source === "upload"
                          ? ({ pathname: "/resume-pdf-viewer", params: { resumeId: resume.id } } as any)
                          : ({
                              pathname: "/builder/manual",
                              params: { resumeId: resume.id },
                            } as any),
                    )
                  }
               >
                 <View style={styles.resumeCardLeft}>
                   <View style={styles.resumeIconBox}>
                      <ExpoImage
                        source={require("@/assets/images/cv.webp")}
                        style={styles.resumeIcon}
                        contentFit="contain"
                      />
                   </View>
                 </View>

                 <View style={styles.chatInfo}>
                   <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                     {resume.name}
                   </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {resume.source === "upload" ? (
                        <View style={[styles.badgeContainer, { backgroundColor: Theme.colors.primary + '15' }]}>
                          <Text style={[styles.badgeText, { color: Theme.colors.primary }]}>
                            PDF Original
                          </Text>
                        </View>
                      ) : resume.type === "ats" ? (
                       <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(34, 191, 192, 0.15)' : 'rgba(26, 158, 159, 0.1)' }]}>
                         <Text style={[styles.badgeText, { color: isDark ? '#22BFC0' : '#1A9E9F' }]}>
                           ATS {resume.score}%
                         </Text>
                       </View>
                     ) : (
                       <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(137, 196, 244, 0.15)' : 'rgba(137, 196, 244, 0.1)' }]}>
                         <Text style={[styles.badgeText, { color: '#89C4F4' }]}>
                           Manual
                         </Text>
                       </View>
                     )}
                     <Text style={[styles.chatMessage, { color: colors.textMuted }]}>
                        {resume.type === "ats" 
                          ? `Checked ${formatDate(resume.createdAt)}` 
                          : `Modified ${formatDate(resume.lastModified)}`
                        }
                     </Text>
                   </View>
                 </View>

                 <View style={styles.chatMeta}>
                    {resume.type === "builder" && resume.source !== "upload" && (
                      <TouchableOpacity
                        onPress={async () => await exportToPDF(resume.data, resume.template, resume.color)}
                        style={styles.downloadIconBtn}
                      >
                        <Download size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                   {resume.type === "builder" && (
                     <TouchableOpacity
                       onPress={() => handleDelete(resume.id)}
                       style={styles.deleteIconBtn}
                     >
                       <Trash2 size={18} color="#ef4444" />
                     </TouchableOpacity>
                   )}
                   <ChevronRight size={18} color={colors.textMuted} />
                 </View>
               </TouchableOpacity>
             </Animated.View>
           ))
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={64} color={colors.textMuted} opacity={0.3} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Resumes Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Start building your professional resume to see it here.
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: Theme.colors.primary }]}
              onPress={() => router.push('/(tabs)/builder')}
            >
              <Text style={styles.createBtnText}>Create New Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.surface, borderColor: Theme.colors.primary, borderWidth: 1.2, marginTop: 10 }]}
              onPress={handleUploadPdf}
            >
              <Text style={[styles.createBtnText, { color: Theme.colors.primary }]}>Upload Older PDF Instead</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  resumeCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  resumeIconBox: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  resumeIcon: {
    width: 68,
    height: 68,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  chatMessage: {
    fontSize: 13,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadIconBtn: {
    padding: 8,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 10,
  },
  deleteIconBtn: {
    padding: 8,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 10,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 30,
  },
  createBtn: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 14,
  },
  uploadIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: { fontSize: 14, fontWeight: '800' },
  uploadSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
