import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
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
  ShieldCheck,
  Target
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getResumes, deleteResume } from '@/utils/storage';
import { getAtsHistory } from '@/services/firestore';
import { exportToPDF } from '@/utils/resume-exporter';
import { ActivityIndicator } from 'react-native';

export default function MyResumesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const localResumes = await getResumes();
          const atsHistory = await getAtsHistory();
          
          setResumes([
            ...localResumes.map((r) => ({ ...r, type: "builder" })),
            ...atsHistory.map((a) => ({
              ...a,
              name: a.resumeName,
              date: "recent",
              type: "ats",
            })),
          ]);
        } catch (e) {
          console.error("Load resumes error:", e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

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
                ...atsHistory.map((a) => ({
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
        {loading ? (
           <ActivityIndicator color={Theme.colors.primary} size="large" style={{ marginTop: 100 }} />
        ) : resumes.length > 0 ? (
          resumes.map((resume, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 100)}>
              <TouchableOpacity
                style={[
                  styles.resumeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() =>
                  router.push(
                    resume.type === "ats"
                      ? "/builder/ats"
                      : ({
                          pathname: "/builder/manual",
                          params: { resumeId: resume.id },
                        } as any),
                  )
                }
              >
                <View
                  style={[
                    styles.avatarBox,
                    {
                      backgroundColor:
                        resume.type === "ats"
                          ? Theme.colors.secondary + "15"
                          : Theme.colors.primary + "15",
                    },
                  ]}
                >
                  {resume.snapshotUri ? (
                    <Image
                      source={{ uri: resume.snapshotUri }}
                      style={styles.snapshot}
                    />
                  ) : resume.imageUrl ? (
                    <Image
                      source={{ uri: resume.imageUrl }}
                      style={styles.snapshot}
                    />
                  ) : resume.type === "ats" ? (
                    <ShieldCheck size={24} color={Theme.colors.secondary} />
                  ) : (
                    <FileText size={24} color={Theme.colors.primary} />
                  )}
                </View>

                <View style={styles.infoBox}>
                  <Text style={[styles.resumeName, { color: colors.text }]}>
                    {resume.name}
                  </Text>
                  <Text style={[styles.resumeMeta, { color: colors.textMuted }]}>
                    {resume.type === "ats"
                      ? `ATS Checked • ${resume.score}%`
                      : `Modified ${resume.date}`}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  {resume.type === "builder" && (
                    <TouchableOpacity
                      onPress={async () => await exportToPDF(resume.data, resume.template)}
                      style={styles.actionBtn}
                    >
                      <Download size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {resume.type === "builder" && (
                    <TouchableOpacity
                      onPress={() => handleDelete(resume.id)}
                      style={styles.actionBtn}
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: 'hidden'
  },
  snapshot: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  infoBox: {
    flex: 1,
  },
  resumeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  resumeMeta: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 10,
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
});
