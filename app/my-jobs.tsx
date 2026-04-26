import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react-native';
import { GlassCard } from '@/components/glass-card';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { getMyApplications } from '@/services/firestore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function MyJobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadApplications = async () => {
        setLoading(true);
        try {
          const data = await getMyApplications();
          setApplications(data);
        } catch (e) {
          console.error("Load applications error:", e);
        } finally {
          setLoading(true);
        }
        setLoading(false);
      };
      loadApplications();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Applications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={styles.statNum}>{applications.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Applied</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>
              {applications.filter(a => a.status === 'Shortlisted' || a.status === 'Interview').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Success Rate</Text>
          </GlassCard>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Applications</Text>

        {loading ? (
           <ActivityIndicator color={Theme.colors.primary} size="large" style={{ marginTop: 100 }} />
        ) : applications.length > 0 ? (
          applications.map((job, index) => (
            <Animated.View key={job.id} entering={FadeInUp.delay(index * 100)}>
              <TouchableOpacity 
                style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                onPress={() => router.push({
                  pathname: '/job-details',
                  params: {
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    logo: job.logo,
                    isInternal: 'false'
                  }
                })}
              >
                <View style={styles.jobTop}>
                  <View style={[styles.logoPlaceholder, { backgroundColor: job.statusColor + '20' }]}>
                    {job.logo ? <Image source={{ uri: job.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <Briefcase size={22} color={job.statusColor} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                    <Text style={[styles.companyName, { color: colors.textMuted }]}>{job.company}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: job.statusColor + '10' }]}>
                    <Text style={[styles.statusText, { color: job.statusColor }]}>{job.status}</Text>
                  </View>
                </View>
  
                <View style={styles.jobMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {job.appliedAt instanceof Date ? job.appliedAt.toLocaleDateString() : 'Just now'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
             <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }} style={styles.emptyIcon} />
             <Text style={[styles.emptyTitle, { color: colors.text }]}>No Applications Yet</Text>
             <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Explore jobs and apply to see them here.</Text>
             <TouchableOpacity style={[styles.startBtn, { backgroundColor: Theme.colors.primary }]} onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={styles.startBtnText}>Browse Jobs</Text>
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
  },
  jobCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 30,
  },
  startBtn: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
  },
  startBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
});
