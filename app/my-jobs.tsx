import { GlassCard } from '@/components/glass-card';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useJobStore } from '@/hooks/use-job-store';
import { getMyApplications } from '@/services/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Trash2
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyJobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applied' | 'saved'>('applied');

  const { savedJobs, unsaveJob } = useJobStore();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Jobs</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabWrapper}>
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('applied')}
            style={[styles.tab, activeTab === 'applied' && { backgroundColor: Theme.colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'applied' ? '#000' : colors.textMuted }]}>Applied</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('saved')}
            style={[styles.tab, activeTab === 'saved' && { backgroundColor: Theme.colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'saved' ? '#000' : colors.textMuted }]}>Saved</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={styles.statNum}>{activeTab === 'applied' ? applications.length : savedJobs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{activeTab === 'applied' ? 'Applied' : 'Saved'}</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>
              {activeTab === 'applied'
                ? applications.filter(a => a.status === 'Shortlisted' || a.status === 'Interview').length
                : savedJobs.filter(j => j.source === 'verified').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{activeTab === 'applied' ? 'Success Rate' : 'Verified'}</Text>
          </GlassCard>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {activeTab === 'applied' ? 'Recent Applications' : 'Saved Opportunities'}
        </Text>

        {loading && activeTab === 'applied' ? (
          <ActivityIndicator color={Theme.colors.primary} size="large" style={{ marginTop: 100 }} />
        ) : activeTab === 'applied' ? (
          applications.length > 0 ? (
            applications.map((job, index) => (
              <Animated.View key={job.id} entering={FadeInUp.delay(index * 100)}>
                <TouchableOpacity
                  style={[styles.jobCard, { backgroundColor: colors.surface }]}
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
                      {job.logo ? <Image source={{ uri: job.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <Image source={require("@/assets/case.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />}
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
                        {(() => {
                          if (!job.appliedAt) return 'Just now';
                          try {
                            let d: Date;
                            if (job.appliedAt instanceof Date) {
                              d = job.appliedAt;
                            } else if (typeof job.appliedAt === 'object' && job.appliedAt.seconds !== undefined) {
                              d = new Date(job.appliedAt.seconds * 1000);
                            } else if (typeof job.appliedAt === 'object' && typeof job.appliedAt.toDate === 'function') {
                              d = job.appliedAt.toDate();
                            } else {
                              d = new Date(job.appliedAt);
                            }
                            return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString();
                          } catch (e) {
                            return 'Just now';
                          }
                        })()}
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
          )
        ) : (
          savedJobs.length > 0 ? (
            savedJobs.map((job, index) => (
              <Animated.View key={job.id} entering={FadeInUp.delay(index * 100)}>
                <GlassCard style={[styles.jobCard, { backgroundColor: colors.surface, padding: 0 }]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{ padding: 20, paddingBottom: 12 }}
                    onPress={() => router.push({
                      pathname: '/job-details',
                      params: {
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        logo: job.logo,
                        description: job.description || '',
                        salary: job.salary || '',
                        type: job.type || '',
                        url: job.url || '',
                        isInternal: 'false'
                      }
                    })}
                  >
                    <View style={styles.jobTop}>
                      <View style={[styles.logoPlaceholder, { backgroundColor: Theme.colors.primary + '20' }]}>
                        {job.logo ? <Image source={{ uri: job.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <Image source={require("@/assets/case.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                        <Text style={[styles.companyName, { color: colors.textMuted }]}>{job.company}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => unsaveJob(job.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.jobMeta}>
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Heart size={14} color={Theme.colors.primary} fill={Theme.colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>Saved</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={[styles.savedActions, { marginHorizontal: 20, marginBottom: 20, marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Theme.colors.primary }]}
                      onPress={() => router.push({
                        pathname: '/builder/ats',
                        params: {
                          jobUrl: job.url,
                          autoScan: 'true',
                          jobTitle: job.title,
                          company: job.company
                        }
                      })}
                    >
                      <Text style={styles.actionBtnText}>Optimize & Apply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtnOutline, { borderColor: colors.glassBorder }]}
                      onPress={() => Linking.openURL(job.url)}
                    >
                      <ExternalLink size={14} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Heart size={80} color={colors.textMuted} style={{ marginBottom: 20, opacity: 0.3 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Jobs</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Save jobs you're interested in to view them later.</Text>
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: Theme.colors.primary }]} onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={styles.startBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          )
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
  tabWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
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
  savedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  actionBtnOutline: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
