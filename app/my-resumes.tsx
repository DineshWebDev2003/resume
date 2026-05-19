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

const formatDate = (timestamp: number | string | undefined) => {
  if (!timestamp) return "Recent";
  const numStamp = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(numStamp)) return "Recent";
  
  const date = new Date(numStamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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
                       : ({
                           pathname: "/builder/manual",
                           params: { resumeId: resume.id },
                         } as any),
                   )
                 }
               >
                 <View style={styles.resumeCardLeft}>
                   <View style={styles.resumeIconBox}>
                     <Image
                       source={require("@/assets/images/nav-icons/resume.png")}
                       style={styles.resumeIcon}
                       resizeMode="contain"
                     />
                   </View>
                 </View>

                 <View style={styles.chatInfo}>
                   <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                     {resume.name}
                   </Text>
                   <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                     {resume.type === "ats" ? (
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
                       {resume.type === "ats" ? "Checked" : `Modified ${formatDate(resume.lastModified)}`}
                     </Text>
                   </View>
                 </View>

                 <View style={styles.chatMeta}>
                   {resume.type === "builder" && (
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
});
