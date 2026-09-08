import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getResumes } from '@/utils/storage';

/**
 * Shows an uploaded older resume EXACTLY as the original PDF —
 * never restyled into an app template. Renders pages on-device
 * with pdf.js (offline, no server upload).
 */
export default function ResumePdfViewerScreen() {
  const { resumeId } = useLocalSearchParams<{ resumeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = (colorScheme === 'dark' ? Colors.dark : Colors.light) as any;

  const [name, setName] = useState('Resume');
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getResumes();
        const found = list.find((r) => r.id === resumeId);
        if (!found) {
          setError('Resume not found.');
          return;
        }
        setName(found.name || 'Resume');
        if (!found.fileUri) {
          setError('Original file is gone — this copy only has extracted text. Open it in Builder to view.');
          return;
        }
        const base64 = await FileSystem.readAsStringAsync(found.fileUri, { encoding: 'base64' });
        setHtml(`
          <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
            <style>
              body { margin: 0; padding: 8px; background: #525659; }
              canvas { width: 100%; height: auto; margin-bottom: 8px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); background: #fff; }
              #msg { color: #fff; font-family: sans-serif; padding: 24px; text-align: center; }
            </style>
          </head><body>
            <div id="msg">Loading original…</div>
            <div id="pages"></div>
            <script>
              try {
                var pdfData = atob("${base64}");
                pdfjsLib.getDocument({data: pdfData}).promise.then(function(pdf) {
                  document.getElementById('msg').style.display = 'none';
                  var box = document.getElementById('pages');
                  for (var i = 1; i <= pdf.numPages; i++) {
                    (function(n) {
                      pdf.getPage(n).then(function(page) {
                        var vp = page.getViewport({scale: 2.0});
                        var cv = document.createElement('canvas');
                        cv.height = vp.height; cv.width = vp.width;
                        box.appendChild(cv);
                        page.render({canvasContext: cv.getContext('2d'), viewport: vp});
                      });
                    })(i);
                  }
                }).catch(function(e) {
                  document.getElementById('msg').innerText = 'Could not render this PDF.';
                });
              } catch (e) {
                document.getElementById('msg').innerText = 'Could not render this PDF.';
              }
            </script>
          </body></html>
        `);
      } catch (e: any) {
        setError(e?.message || 'Could not open the original file.');
      }
    })();
  }, [resumeId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Original PDF — as uploaded</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Theme.colors.primary }]}>
          <FileText size={12} color="#fff" />
          <Text style={styles.badgeText}>PDF</Text>
        </View>
      </View>
      {!html && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={[styles.hint, { color: colors.textMuted }]}>Loading original…</Text>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.builderBtn, { backgroundColor: Theme.colors.primary }]}
            onPress={() => router.replace({ pathname: '/builder/manual', params: { resumeId } } as any)}
          >
            <Text style={styles.builderText}>Open in Builder instead</Text>
          </TouchableOpacity>
        </View>
      )}
      {html && (
        <WebView source={{ html }} style={styles.web} javaScriptEnabled domStorageEnabled startInLoadingState />
      )}
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
  title: { fontSize: 14, fontWeight: '800' },
  sub: { fontSize: 11, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  hint: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  web: { flex: 1 },
  builderBtn: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 22 },
  builderText: { color: '#fff', fontWeight: '800' },
});
