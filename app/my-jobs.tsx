import { GlassCard } from '@/components/glass-card';
import { AUTO_APPLY_STATUS_COLORS } from '@/constants/autoApply';
import type { AutoApplyStatus } from '@/constants/autoApply';
import { AutoApplyBadge } from '@/components/AutoApplyBadge';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
import { getAutoApplyContext, processAutoApplyBatch } from '@/services/autoApply';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useJobStore } from '@/hooks/use-job-store';
import { getMyApplications, getAutoApplyRecords, saveAutoApplyRecord, cleanupStaleAutoMirrors } from '@/services/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
  const [activeTab, setActiveTab] = useState<'applied' | 'saved' | 'auto'>('applied');

  // AI Apply tab state (only shown while Auto Apply is ON).
  const { settings: aaSettings } = useAutoApplySettings();
  const [aaRecords, setAaRecords] = useState<any[]>([]);
  const [aaQuery, setAaQuery] = useState('');
  const [scanning, setScanning] = useState(false);

  const { savedJobs, unsaveJob } = useJobStore();

  useEffect(() => {
    if (!aaSettings.enabled && activeTab === 'auto') setActiveTab('applied');
  }, [aaSettings.enabled, activeTab]);

  useFocusEffect(
    useCallback(() => {
      const loadApplications = async () => {
        setLoading(true);
        try {
          await cleanupStaleAutoMirrors().catch(() => {});
          const data = await getMyApplications();
          setApplications(data);
        } catch (e) {
          console.error("Load applications error:", e);
        } finally {
          setLoading(true);
        }
        try {
          setAaRecords(await getAutoApplyRecords());
        } catch (e) {
          console.warn("Load auto apply records error:", e);
        }
        setLoading(false);
      };
      loadApplications();
    }, [])
  );

  // ── AI Apply tab helpers ───────────────────────────────────────────────
  const q = aaQuery.trim().toLowerCase();
  const matchesQuery = (r: any) =>
    q === '' || `${r.title || ''} ${r.company || ''}`.toLowerCase().includes(q);

  const autoMatched = aaRecords.filter(
    (r) =>
      ['Matched', 'Resume Customized', 'Manual Apply Required', 'Auto Apply Queued', 'Applying'].includes(r.status) &&
      matchesQuery(r),
  );
  const autoApplied = aaRecords.filter((r) => r.status === 'Applied' && matchesQuery(r));
  const autoSkipped = aaRecords.filter(
    (r) => (r.status === 'Skipped' || r.status === 'Failed') && matchesQuery(r),
  );
  const autoSkippedCount = aaRecords.filter(
    (r) => r.status === 'Skipped' || r.status === 'Failed',
  ).length;

  /** Manual test mode: match saved jobs + check resume. Nothing is submitted. */
  const handleScanSaved = async () => {
    if (!aaSettings.enabled) {
      Alert.alert('Auto Apply is OFF', 'Turn it ON in settings to test matching.');
      return;
    }
    if (savedJobs.length === 0) {
      Alert.alert('No saved jobs', 'Save a few jobs from the Jobs feed first, then scan.');
      return;
    }
    setScanning(true);
    console.log(`[AutoApply] Manual scan: ${savedJobs.length} saved jobs.`);
    try {
      const { profile, resume } = await getAutoApplyContext(aaSettings);
      if (profile.roles.length === 0) {
        Alert.alert(
          'No job roles',
          'Add at least 1 job role in your Profile first — matching needs a role to compare titles against.',
          [
            { text: 'Open Profile', onPress: () => router.push('/(tabs)/profile' as any) },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
      if (!resume) {
        Alert.alert(
          'No resume found',
          'Upload or create a resume first so matching has something to score against.',
          [
            { text: 'Open Builder', onPress: () => router.push('/(tabs)/builder' as any) },
            { text: 'Continue anyway' },
          ],
        );
      }
      const normalized = savedJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        description: j.description || '',
        salary: j.salary,
        scheduleType: j.type,
        source: j.source,
        applyUrl: j.url,
        logo: j.logo || undefined,
      }));
      const existingIds = new Set(aaRecords.map((r: any) => r.jobId));
      const out = await processAutoApplyBatch(normalized, {
        settings: aaSettings,
        profile,
        resume,
        existingIds,
      });
      for (const rec of out) {
        try {
          await saveAutoApplyRecord(rec);
          console.log(`[AutoApply] Scan tracked ${rec.jobId} as ${rec.status}.`);
        } catch (e: any) {
          console.log(`[AutoApply] Scan track failed for ${rec.jobId}:`, e?.message);
        }
      }
      try {
        setAaRecords(await getAutoApplyRecords());
      } catch {}
      try {
        const { refreshAutoApplyNotification } = await import('@/services/autoApplyNotifier');
        await refreshAutoApplyNotification('done');
      } catch {}
      const m = out.filter((r) => r.status !== 'Skipped' && r.status !== 'Failed').length;
      Alert.alert('Scan done', `${m} matched out of ${out.length} saved jobs.`);
    } catch (e: any) {
      Alert.alert('Scan failed', e?.message || 'Try again.');
    } finally {
      setScanning(false);
    }
  };

  const renderAutoCard = (r: any, index: number) => (
    <Animated.View key={r.id || `${r.jobId}-${index}`} entering={FadeInUp.delay(Math.min(index, 5) * 80)}>
      <View style={[styles.jobCard, { backgroundColor: colors.surface }]}>
        <View style={styles.jobTop}>
          <View style={[styles.logoPlaceholder, { backgroundColor: Theme.colors.primary + '20' }]}>
            {r.logo ? (
              <Image source={{ uri: r.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <ExpoImage source={require("@/assets/case.webp")} style={{ width: 22, height: 22 }} contentFit="contain" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>{r.title}</Text>
            <Text style={[styles.companyName, { color: colors.textMuted }]} numberOfLines={1}>{r.company}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <AutoApplyBadge status={r.status as AutoApplyStatus} />
          {r.matchScore != null && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Match {r.matchScore}%{r.atsScore ? ` • ATS ${r.atsScore}%` : ''}{r.resumeCustomized ? ' • Customized ✓' : ''}
            </Text>
          )}
        </View>
        {!!r.reason && (
          <Text style={[styles.metaText, { color: colors.textMuted, marginBottom: 12 }]} numberOfLines={2}>
            {r.reason}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Theme.colors.primary }]}
            onPress={() =>
              router.push({
                pathname: '/job-details',
                params: {
                  title: r.title,
                  company: r.company,
                  location: r.location,
                  logo: r.logo || '',
                  applyLink: r.applyUrl || r.url || '',
                  isInternal: 'false',
                },
              })
            }
          >
            <Text style={styles.actionBtnText}>Details</Text>
          </TouchableOpacity>
          {!!(r.applyUrl || r.url) && (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { borderColor: colors.glassBorder }]}
              onPress={() => Linking.openURL(r.applyUrl || r.url)}
            >
              <ExternalLink size={14} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
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
            <Text style={[styles.tabText, { color: activeTab === 'applied' ? '#fff' : colors.textMuted }]}>Applied</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('saved')}
            style={[styles.tab, activeTab === 'saved' && { backgroundColor: Theme.colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'saved' ? '#fff' : colors.textMuted }]}>Saved</Text>
          </TouchableOpacity>
          {aaSettings.enabled && (
            <TouchableOpacity
              onPress={() => setActiveTab('auto')}
              style={[styles.tab, activeTab === 'auto' && { backgroundColor: Theme.colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'auto' ? '#fff' : colors.textMuted }]}>AI Apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={styles.statNum}>
              {activeTab === 'applied' ? applications.length : activeTab === 'saved' ? savedJobs.length : autoMatched.length + autoApplied.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {activeTab === 'applied' ? 'Applied' : activeTab === 'saved' ? 'Saved' : 'Processed'}
            </Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>
              {activeTab === 'applied'
                ? applications.filter(a => a.status === 'Shortlisted' || a.status === 'Interview').length
                : activeTab === 'saved'
                  ? savedJobs.filter(j => j.source === 'verified').length
                  : autoApplied.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {activeTab === 'applied' ? 'Success Rate' : activeTab === 'saved' ? 'Verified' : 'Auto Applied'}
            </Text>
          </GlassCard>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {activeTab === 'applied' ? 'Recent Applications' : activeTab === 'saved' ? 'Saved Opportunities' : 'AI Apply'}
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
                      {job.logo ? <Image source={{ uri: job.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <ExpoImage source={require("@/assets/case.webp")} style={{ width: 22, height: 22 }} contentFit="contain" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                      <Text style={[styles.companyName, { color: colors.textMuted }]}>{job.company}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (job.statusColor || (AUTO_APPLY_STATUS_COLORS as any)[job.status] || '#F59E0B') + '10' }]}>
                      <Text style={[styles.statusText, { color: job.statusColor || (AUTO_APPLY_STATUS_COLORS as any)[job.status] || '#F59E0B' }]}>{job.status}</Text>
                    </View>
                  </View>

                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}</Text>
                    </View>
                    {job.matchScore != null && (
                      <View style={styles.metaItem}>
                        <Zap size={14} color={Theme.colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          Match {job.matchScore}%{job.atsScore ? ` • ATS ${job.atsScore}%` : ''}{job.resumeCustomized ? ' • Customized ✓' : ''}
                        </Text>
                      </View>
                    )}
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
        ) : activeTab === 'saved' ? (
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
                        {job.logo ? <Image source={{ uri: job.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} /> : <ExpoImage source={require("@/assets/case.webp")} style={{ width: 22, height: 22 }} contentFit="contain" />}
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
        ) : (
          <View style={{ gap: 0 }}>
            <View style={[styles.aaStatusBar, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Zap size={15} color={aaSettings.enabled && !aaSettings.paused ? Theme.colors.primary : colors.textMuted} fill={aaSettings.enabled && !aaSettings.paused ? Theme.colors.primary : 'transparent'} />
              <Text style={[styles.metaText, { color: colors.text, flex: 1 }]}>
                Auto {aaSettings.enabled ? (aaSettings.paused ? 'Paused' : `ON • min ${aaSettings.minMatch}%`) : 'OFF'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auto-apply-settings' as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <SlidersHorizontal size={17} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={aaQuery}
                onChangeText={setAaQuery}
                placeholder="Search matched jobs…"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: Theme.colors.primary, opacity: scanning ? 0.6 : 1 }]}
              onPress={handleScanSaved}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Zap size={15} color="#fff" fill="#fff" />
              )}
              <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Test match on saved jobs'}</Text>
            </TouchableOpacity>
            <Text style={[styles.scanHint, { color: colors.textMuted }]}>
              Manual test mode — matching + resume check only, nothing is submitted.
              {autoSkippedCount > 0 ? ` Skipped ${autoSkippedCount} below threshold.` : ''}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
              Matched ({autoMatched.length})
            </Text>
            {autoMatched.length > 0 ? (
              autoMatched.map(renderAutoCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Tap “Test match on saved jobs” to preview matching and resume checks.
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>
              Applied ({autoApplied.length})
            </Text>
            {autoApplied.length > 0 ? (
              autoApplied.map(renderAutoCard)
            ) : (
              <Text style={[styles.metaText, { color: colors.textMuted, marginBottom: 8 }]}>
                Nothing applied yet.
              </Text>
            )}

            {autoSkipped.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>
                  Skipped ({autoSkipped.length})
                </Text>
                <Text style={[styles.metaText, { color: colors.textMuted, marginBottom: 10 }]}>
                  Below your rules — each card says why. Lower Min Match % in settings to include more.
                </Text>
                {autoSkipped.map(renderAutoCard)}
              </>
            )}
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
    flexWrap: 'wrap',
    rowGap: 8,
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
    color: '#fff',
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
    color: '#fff',
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
  aaStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  scanBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  scanHint: { fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: 'center' },
});
