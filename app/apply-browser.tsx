import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ClipboardPaste,
  ExternalLink,
  CheckCircle2,
  ShieldAlert,
  Upload,
  UserCheck,
} from 'lucide-react-native';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/services/firebase';
import {
  getApplyProfile,
  buildAutofillJS,
  buildPageSignalJS,
  detectATS,
  detectConfirmation,
  saveQuickApplyRecord,
  toUserError,
} from '@/services/applyAutofill';
import type { ATSKind, QuestionItem } from '@/services/autofill/types';
import { delay } from '@/services/quickApplyQueue';

/**
 * Quick Apply + Smart Autofill browser.
 * User reviews before submitting — never automatic submission.
 * Flow: Quick Apply -> ATS detect -> Autofill -> Review -> User submits
 * -> Confirmation -> My Jobs. Fallback: Continue in Chrome.
 */
export default function ApplyBrowserScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = (colorScheme === 'dark' ? Colors.dark : Colors.light) as any;

  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);
  const [url, setUrl] = useState((params.applyLink as string) || '');
  const [ats, setAts] = useState<ATSKind>(() => detectATS((params.applyLink as string) || ''));
  const [filled, setFilled] = useState(0);
  const [needsReview, setNeedsReview] = useState(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [captcha, setCaptcha] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [uploadRequired, setUploadRequired] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [pickedResume, setPickedResume] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmAsk, setConfirmAsk] = useState(false);
  const [lastFieldCount, setLastFieldCount] = useState(0);
  const [newFieldsHint, setNewFieldsHint] = useState(false);

  const askedRef = useRef(false);
  const lastInjectRef = useRef(0);

  const job = useMemo(
    () => ({
      id: (params.id || params.jobId || `${params.title}-${params.company}`) as string,
      title: (params.title as string) || 'Job',
      company: (params.company as string) || 'Company',
      location: (params.location as string) || '',
      logo: (params.logo as string) || '',
    }),
    [params],
  );

  const injectAutofill = async () => {
    const now = Date.now();
    if (now - lastInjectRef.current < 1500) return; // rate-limit page actions
    lastInjectRef.current = now;
    setFilling(true);
    setNewFieldsHint(false);
    try {
      const profile = await getApplyProfile();
      if (!profile.email && !profile.name && !profile.phone) {
        Alert.alert('No profile', 'Complete your profile / resume first so we can autofill.');
        return;
      }
      webRef.current?.injectJavaScript(buildAutofillJS(profile, url));
      await delay(400);
    } finally {
      setTimeout(() => setFilling(false), 800);
    }
  };

  const handlePickResume = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const name = res.assets?.[0]?.name || 'resume';
      setPickedResume(name);
      Alert.alert(
        'Resume selected',
        `"${name}" is ready. Now tap the form's Upload / Choose file button and pick the same file. Uploads always happen on the employer site — never to an unknown server.`,
      );
    } catch {
      Alert.alert('Upload', toUserError('RESUME_UPLOAD_REQUIRED'));
    }
  };

  const persistSubmitted = async (filledCount: number, source: 'quick_apply' | 'external_browser') => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to track this application.');
      return;
    }
    try {
      await saveQuickApplyRecord({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        logo: job.logo,
        jobUrl: url,
        source,
        ats,
        filledFieldsCount: filledCount,
      });
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Tracking failed', e?.message || toUserError('SUBMISSION_FAILED'));
    }
  };

  const handleMarkApplied = async () => {
    // Manual confirmation — medium/unknown confidence path.
    await persistSubmitted(filled, 'quick_apply');
  };

  const handleContinueInChrome = async () => {
    try {
      const result = await WebBrowser.openBrowserAsync(url, {
        toolbarColor: Theme.colors.primary,
        showTitle: true,
      });
      if (result.type === 'dismiss' || result.type === 'cancel') {
        Alert.alert('Did you apply?', 'Were you able to submit the application?', [
          { text: 'No', style: 'cancel' },
          { text: 'Try Again', onPress: () => webRef.current?.reload() },
          {
            text: 'Yes, Applied',
            onPress: () => persistSubmitted(filled, 'external_browser'),
          },
        ]);
      }
    } catch {
      Alert.alert('Chrome unavailable', toUserError('FORM_FAILED_TO_LOAD'));
    }
  };

  const onMessage = (raw: string) => {
    let d: any;
    try {
      d = JSON.parse(raw);
    } catch {
      return;
    }
    if (d?.ats) setAts(d.ats as ATSKind);
    switch (d?.type) {
      case 'autofill-result': {
        const f = Number(d.filled || 0);
        const q: QuestionItem[] = Array.isArray(d.questions) ? d.questions : [];
        setFilled((prev) => Math.max(prev, f));
        setQuestions(q);
        setNeedsReview(Number(d.skipped || 0) + q.length + (Number(d.fileInputs || 0) > 0 ? 1 : 0));
        if (d.captcha) setCaptcha(true);
        if (d.loginRequired) setLoginRequired(true);
        if (Number(d.fileInputs || 0) > 0) {
          setUploadRequired(true);
          setUploadCount(Number(d.fileInputs));
        }
        if (d.confirmation && d.confidence === 'high' && !askedRef.current) {
          askedRef.current = true;
          persistSubmitted(f, 'quick_apply');
        } else if (d.confirmation && d.confidence === 'medium') {
          setConfirmAsk(true);
        }
        break;
      }
      case 'page-signals': {
        if (d.captcha) setCaptcha(true);
        if (d.loginRequired) setLoginRequired(true);
        if (Number(d.fileInputs || 0) > 0) {
          setUploadRequired(true);
          setUploadCount(Number(d.fileInputs));
        }
        const fc = Number(d.fieldCount || 0);
        if (lastFieldCount > 0 && fc > lastFieldCount) setNewFieldsHint(true);
        if (fc > 0) setLastFieldCount(fc);
        if (d.confidence === 'high' && !askedRef.current) {
          askedRef.current = true;
          persistSubmitted(filled, 'quick_apply');
        } else if (d.confidence === 'medium') {
          setConfirmAsk(true);
        }
        break;
      }
      case 'captcha':
        setCaptcha(true);
        break;
      case 'login-required':
        setLoginRequired(true);
        break;
      case 'resume-upload-required':
        setUploadRequired(true);
        setUploadCount(Number(d.fileInputs || 1));
        break;
      case 'confirmation':
        if (d.confidence === 'high' && !askedRef.current) {
          askedRef.current = true;
          persistSubmitted(filled, 'quick_apply');
        } else {
          setConfirmAsk(true);
        }
        break;
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
        <View style={[styles.successCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <CheckCircle2 size={52} color="#10b981" />
          <Text style={[styles.successTitle, { color: colors.text }]}>✓ Application Submitted</Text>
          <Text style={[styles.successLine, { color: colors.textMuted }]}>Company: {job.company}</Text>
          <Text style={[styles.successLine, { color: colors.textMuted }]}>Position: {job.title}</Text>
          <Text style={[styles.successLine, { color: colors.textMuted }]}>
            {filled} fields completed automatically
          </Text>
          <Text style={[styles.successLine, { color: colors.textMuted }]}>Application saved to My Jobs.</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Theme.colors.primary }]}
            onPress={() => router.replace('/my-jobs' as any)}
          >
            <Text style={styles.primaryBtnText}>View My Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.ghostBtn}>
            <Text style={[styles.ghostText, { color: colors.textMuted }]}>Back to job</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={[styles.title, { color: colors.text }]}>Quick Apply</Text>
          <Text numberOfLines={1} style={[styles.sub, { color: colors.textMuted }]}>
            {job.company} • {job.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={injectAutofill}
          disabled={filling}
          style={[styles.autofillBtn, { backgroundColor: Theme.colors.primary, opacity: filling ? 0.6 : 1 }]}
        >
          <ClipboardPaste size={15} color="#fff" />
          <Text style={styles.autofillText}>{filling ? 'Filling…' : 'Autofill'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.statusScroll} contentContainerStyle={{ padding: 12, gap: 8 }}>
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>Smart Autofill Active</Text>
          <Text style={[styles.statusLine, { color: colors.textMuted }]}>
            ATS: {ats.toUpperCase()} • Fields Filled: {filled} • Needs Review: {needsReview}
          </Text>
          <Text style={[styles.reviewHint, { color: colors.textMuted }]}>
            Review every field before submitting. Autofill never submits for you.
          </Text>
          {newFieldsHint && (
            <Text style={styles.hintNew}>New fields detected on this step — tap Autofill again.</Text>
          )}
        </View>

        {captcha && (
          <View style={styles.warnCard}>
            <ShieldAlert size={16} color="#b45309" />
            <Text style={styles.warnText}>{toUserError('CAPTCHA_DETECTED')}</Text>
          </View>
        )}
        {loginRequired && (
          <View style={styles.warnCard}>
            <UserCheck size={16} color="#b45309" />
            <Text style={styles.warnText}>{toUserError('LOGIN_REQUIRED')}</Text>
          </View>
        )}
        {uploadRequired && (
          <View style={styles.warnCard}>
            <Upload size={16} color="#b45309" />
            <Text style={styles.warnText}>
              {toUserError('RESUME_UPLOAD_REQUIRED')}
              {uploadCount > 0 ? ` (${uploadCount} file field${uploadCount > 1 ? 's' : ''})` : ''}
              {pickedResume ? `\nSelected: ${pickedResume}` : ''}
            </Text>
            <TouchableOpacity onPress={handlePickResume} style={styles.pickBtn}>
              <Text style={styles.pickText}>{pickedResume ? 'Change file' : 'Select resume'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {questions.length > 0 && (
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {questions.length} question{questions.length > 1 ? 's' : ''} need{questions.length > 1 ? '' : 's'} your answer
            </Text>
            {questions.slice(0, 5).map((q) => (
              <Text key={q.id} style={[styles.qLine, { color: colors.textMuted }]}>
                • {q.label} — {q.reason}
              </Text>
            ))}
          </View>
        )}
        {confirmAsk && (
          <View style={styles.warnCard}>
            <Text style={styles.warnText}>Were you able to submit the application?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setConfirmAsk(false)} style={styles.pickBtn}>
                <Text style={styles.pickText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setConfirmAsk(false); webRef.current?.reload(); }} style={styles.pickBtn}>
                <Text style={styles.pickText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setConfirmAsk(false); handleMarkApplied(); }} style={[styles.pickBtn, { backgroundColor: '#10b981' }]}>
                <Text style={[styles.pickText, { color: '#fff' }]}>Yes, Applied</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.webWrap}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading employer site…</Text>
          </View>
        )}
        {!!url && (
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={styles.web}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsBackForwardNavigationGestures
            onLoadEnd={() => {
              setLoading(false);
              const next = detectATS(url);
              if (next !== 'unknown') setAts(next);
              // Controlled signal scan per page (no autofill loop).
              webRef.current?.injectJavaScript(buildPageSignalJS(url));
            }}
            onNavigationStateChange={(nav) => {
              setUrl(nav.url);
              setLoading(nav.loading);
              const next = detectATS(nav.url);
              if (next !== 'unknown') setAts(next);
              const r = detectConfirmation(nav.url, nav.title || '');
              if (r.state === 'submitted' && !askedRef.current) {
                askedRef.current = true;
                persistSubmitted(filled, 'quick_apply');
              } else if (r.state === 'review_required') {
                setConfirmAsk(true);
              }
            }}
            onError={() => {
              setLoading(false);
              Alert.alert(
                'Page blocked',
                'This employer site blocked the in-app browser. Continue in Chrome?',
                [
                  { text: 'Stay', style: 'cancel' },
                  { text: 'Continue in Chrome', onPress: handleContinueInChrome },
                ],
              );
            }}
            onHttpError={() => setLoading(false)}
            onMessage={(e) => onMessage(e.nativeEvent.data)}
          />
        )}
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.glassBorder, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
          onPress={handleContinueInChrome}
        >
          <ExternalLink size={15} color={colors.text} />
          <Text style={[styles.footerBtnText, { color: colors.text }]}>Chrome</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
          onPress={injectAutofill}
        >
          <ClipboardPaste size={15} color={colors.text} />
          <Text style={[styles.footerBtnText, { color: colors.text }]}>Autofill</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, styles.appliedBtn, { backgroundColor: '#10b981' }]}
          onPress={handleMarkApplied}
        >
          <CheckCircle2 size={15} color="#fff" />
          <Text style={[styles.footerBtnText, { color: '#fff' }]}>Mark Applied</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '900' },
  sub: { fontSize: 11, fontWeight: '600' },
  autofillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  autofillText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statusScroll: { maxHeight: 240 },
  statusCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  statusLine: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  reviewHint: { fontSize: 11, marginTop: 4 },
  hintNew: { fontSize: 11, fontWeight: '800', color: '#0ea5e9', marginTop: 6 },
  qLine: { fontSize: 11, marginTop: 4 },
  warnCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  warnText: { fontSize: 12, fontWeight: '700', color: '#92400e', flex: 1 },
  pickBtn: { backgroundColor: '#fff', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  pickText: { fontSize: 11, fontWeight: '800', color: '#92400e' },
  webWrap: { flex: 1 },
  web: { flex: 1, backgroundColor: 'transparent' },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 10, zIndex: 2 },
  loaderText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  footerBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  appliedBtn: { borderWidth: 0 },
  footerBtnText: { fontSize: 12, fontWeight: '800' },
  successCard: { margin: 20, borderWidth: 1, borderRadius: 22, padding: 28, alignItems: 'center', gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', marginTop: 8 },
  successLine: { fontSize: 13, fontWeight: '600' },
  primaryBtn: { marginTop: 14, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  ghostBtn: { marginTop: 8, padding: 10 },
  ghostText: { fontSize: 12, fontWeight: '700' },
});
