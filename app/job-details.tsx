import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  Platform,
  Share,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { saveJobApplication, saveAutoApplyRecord } from '@/services/firestore';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
import { useJobStore } from '@/hooks/use-job-store';
import { AutoApplyBadge } from '@/components/AutoApplyBadge';
import { calculateMatchScore, getAutoApplyContext, processJobForAutoApply } from '@/services/autoApply';
import type { ApplicationRecord } from '@/services/autoApply';
import { auth } from '@/services/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Briefcase,
  IndianRupee,
  Calendar,
  Building2,
  Share2,
  Zap,
  Award,
  Sparkles,
  Smile,
  Frown,
  Mic,
  Bookmark,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, BounceIn } from 'react-native-reanimated';

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { updateJobStatus } = useJobStore();
  const appState = useRef(AppState.currentState);
  const [clickedApply, setClickedApply] = useState(false);

  // Auto Apply settings & match state
  const { settings: aaSettings } = useAutoApplySettings();
  const [aaMatch, setAaMatch] = useState<number | null>(null);
  const [aaRecord, setAaRecord] = useState<ApplicationRecord | null>(null);
  const [aaBusy, setAaBusy] = useState(false);

  const job = {
    id: (params.id || params.jobId || `${params.title}-${params.company}`) as string,
    title: (params.title as string) || 'Senior Software Engineer',
    company: (params.company as string) || 'Technology Corp',
    location: (params.location as string) || 'Bengaluru / Hybrid',
    salary: (params.salary as string) || '₹14L - ₹22L / yr',
    logo: (params.logo as string) || null,
    scheduleType: (params.scheduleType as string) || 'Full-time',
    experience: (params.experience as string) || '2 - 5 Years Exp',
    postedAt: (params.postedAt as string) || 'Active • 2 days ago',
    description:
      (params.description as string) ||
      'We are looking for a skilled professional to join our core team. You will lead technical design, scale mission-critical products, and collaborate with product and engineering teams to deliver impactful experiences.',
    benefits: [
      'Comprehensive Health & Dental Coverage',
      'Flexible Work Hours & Hybrid Setup',
      'Annual Learning & Tech Stipend',
      'Performance Bonuses & ESOPs',
      'Wellness Allowance & Gym Pass',
      'Paid Time Off & Mental Health Days',
    ],
    workDays: (params.workDays as string) || 'Mon - Fri (10 AM - 7 PM)',
    applyLink: (params.applyLink as string) || 'https://google.com/jobs',
    isInternal: params.isInternal === 'true',
  };

  useEffect(() => {
    if (params.autoApply === 'true') {
      setTimeout(() => {
        handleAutofillApply();
      }, 350);
    }
  }, [params.autoApply]);

  // Live match score calculation
  useEffect(() => {
    let live = true;
    (async () => {
      if (!auth.currentUser) return;
      try {
        const { profile } = await getAutoApplyContext(aaSettings);
        const score = calculateMatchScore(
          {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            salary: job.salary,
            scheduleType: job.scheduleType,
            source: job.isInternal ? 'internal' : 'external',
            applyUrl: job.applyLink,
          },
          profile,
          aaSettings
        );
        if (live) setAaMatch(score);
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, [aaSettings]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        clickedApply
      ) {
        setShowApplyModal(true);
        setClickedApply(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [clickedApply]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${job.title} at ${job.company}`,
        message: `Check out this opening for ${job.title} at ${job.company}: ${job.applyLink}`,
        url: job.applyLink,
      });
    } catch {}
  };

  const handleApply = async () => {
    if (job.isInternal) {
      if (!auth.currentUser) {
        Alert.alert('Login Required', 'Please login to apply for this job.');
        return;
      }
      router.push({
        pathname: '/apply',
        params: {
          title: job.title,
          company: job.company,
        },
      });
    } else {
      try {
        setClickedApply(true);
        const result = await WebBrowser.openBrowserAsync(job.applyLink, {
          toolbarColor: Theme.colors.primary,
          controlsColor: '#000000',
          enableBarCollapsing: true,
          showTitle: true,
        });
        if (result.type === 'dismiss' || result.type === 'cancel') {
          setShowApplyModal(true);
        }
        setClickedApply(false);
      } catch {
        setClickedApply(true);
        await Linking.openURL(job.applyLink);
      }
    }
  };

  const handleAutofillApply = () => {
    router.push({
      pathname: '/apply-browser',
      params: {
        applyLink: job.applyLink,
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        logo: job.logo || '',
      },
    });
  };

  const handleAutoApply = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to use Auto Apply.');
      return;
    }
    if (!aaSettings.enabled || aaSettings.paused) {
      Alert.alert(
        'Auto Apply is OFF',
        'Enable Auto Apply in settings first — it will prioritize jobs matching your chosen preferences.',
        [
          { text: 'Open Settings', onPress: () => router.push('/auto-apply-settings' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setAaBusy(true);
    try {
      const { profile, resume } = await getAutoApplyContext(aaSettings);
      const normalized = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salary: job.salary,
        scheduleType: job.scheduleType,
        source: job.isInternal ? ('internal' as const) : ('external' as const),
        applyUrl: job.applyLink,
        logo: job.logo || undefined,
      };
      let rec = await processJobForAutoApply(normalized, {
        settings: aaSettings,
        profile,
        resume,
        submit: undefined,
      });

      if (job.isInternal && rec.status === 'Manual Apply Required') {
        rec = {
          ...rec,
          status: 'Auto Apply Queued',
          statusColor: '#f59e0b',
          reason: 'Eligible — finish and submit in the official application form.',
        };
      }
      const full = { ...rec, logo: job.logo || undefined };
      await saveAutoApplyRecord(full);
      setAaRecord(full);
      setAaMatch(rec.matchScore);
      if (job.isInternal && full.status === 'Auto Apply Queued') {
        router.push({
          pathname: '/apply',
          params: { title: job.title, company: job.company },
        });
      }
    } catch (e: any) {
      Alert.alert('Auto Apply', e?.message || 'Could not process this job.');
    } finally {
      setAaBusy(false);
    }
  };

  const handleConfirmApplication = async (didApply: boolean) => {
    setShowApplyModal(false);
    if (!didApply) return;

    if (!auth.currentUser) {
      Alert.alert('Authentication Needed', 'Please log in to save this application to your profile.');
      return;
    }

    try {
      updateJobStatus(job.id, 'applied');
      await saveJobApplication({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        logo: job.logo || '',
      });
      Alert.alert('Success 🎉', 'Job marked as Applied! You can track this in Profile -> My Jobs.');
    } catch (error: any) {
      if (error.message?.includes('already applied')) {
        Alert.alert('Already Tracked', 'You have already marked this job as applied.');
      } else {
        console.error('Apply tracking error:', error);
      }
    }
  };

  // Compute initials for logo fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const matchPercent = aaMatch !== null ? aaMatch : 88;
  const matchColor = matchPercent >= 80 ? '#10B981' : matchPercent >= 60 ? '#F59E0B' : '#6B7280';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Ambience */}
      <LinearGradient
        colors={[
          isDark ? 'rgba(253, 167, 88, 0.08)' : 'rgba(253, 167, 88, 0.12)',
          isDark ? 'rgba(87, 51, 83, 0.05)' : 'rgba(87, 51, 83, 0.04)',
          colors.background,
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Modern Top App Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Job Overview</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{job.company}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
            activeOpacity={0.7}
          >
            <Bookmark
              size={18}
              color={isBookmarked ? Theme.colors.primary : colors.text}
              fill={isBookmarked ? Theme.colors.primary : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder, marginLeft: 8 }]}
            activeOpacity={0.7}
          >
            <Share2 size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Executive Hero Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.logoSquircle, { backgroundColor: '#FFFFFF', borderColor: colors.glassBorder }]}>
              {job.logo ? (
                <Image source={{ uri: job.logo }} style={styles.logoImg} resizeMode="contain" />
              ) : (
                <View style={[styles.monogramWrap, { backgroundColor: Theme.colors.primary + '18' }]}>
                  <Text style={[styles.monogramText, { color: Theme.colors.primary }]}>{getInitials(job.company)}</Text>
                </View>
              )}
            </View>

            <View style={styles.heroBadgeRow}>
              <View style={[styles.verifiedPill, { backgroundColor: '#10B98115', borderColor: '#10B98135' }]}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verified Employer</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>{job.postedAt}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.heroJobTitle, { color: colors.text }]}>{job.title}</Text>
          
          <View style={styles.companyLocationRow}>
            <Building2 size={15} color={Theme.colors.primary} />
            <Text style={[styles.heroCompanyText, { color: Theme.colors.primary }]}>{job.company}</Text>
            <Text style={[styles.dotDivider, { color: colors.textMuted }]}>•</Text>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={[styles.heroLocationText, { color: colors.textMuted }]}>{job.location}</Text>
          </View>

          {/* Quick Tag Pills */}
          <View style={styles.tagsRow}>
            <View style={[styles.tagPill, { backgroundColor: isDark ? '#ffffff10' : '#57335308' }]}>
              <Briefcase size={12} color={Theme.colors.secondary} />
              <Text style={[styles.tagText, { color: colors.text }]}>{job.scheduleType}</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: isDark ? '#ffffff10' : '#57335308' }]}>
              <TrendingUp size={12} color="#059669" />
              <Text style={[styles.tagText, { color: colors.text }]}>{job.experience}</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: isDark ? '#ffffff10' : '#57335308' }]}>
              <Award size={12} color="#6366F1" />
              <Text style={[styles.tagText, { color: colors.text }]}>Immediate Joiner</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bento Stat Metric Cards */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.bentoRow}>
          <LinearGradient
            colors={isDark ? ['#1e1b2e', '#161324'] : ['#FFFFFF', '#FDF8F5']}
            style={[styles.bentoCard, { borderColor: colors.glassBorder }]}
          >
            <View style={[styles.bentoIconBg, { backgroundColor: '#10B98118' }]}>
              <IndianRupee size={18} color="#10B981" />
            </View>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>Compensation</Text>
            <Text style={[styles.bentoValue, { color: colors.text }]}>{job.salary}</Text>
            <Text style={[styles.bentoSub, { color: '#10B981' }]}>Top Tier Package</Text>
          </LinearGradient>

          <LinearGradient
            colors={isDark ? ['#1e1b2e', '#161324'] : ['#FFFFFF', '#FDF8F5']}
            style={[styles.bentoCard, { borderColor: colors.glassBorder }]}
          >
            <View style={[styles.bentoIconBg, { backgroundColor: matchColor + '18' }]}>
              <Sparkles size={18} color={matchColor} />
            </View>
            <Text style={[styles.bentoLabel, { color: colors.textMuted }]}>Profile Match</Text>
            <Text style={[styles.bentoValue, { color: matchColor }]}>{matchPercent}% Fit</Text>
            <Text style={[styles.bentoSub, { color: colors.textMuted }]}>Based on Resume</Text>
          </LinearGradient>
        </Animated.View>

        {/* AI Career Copilot Card */}
        <Animated.View entering={FadeInUp.delay(180).duration(450)} style={[styles.copilotCard, { borderColor: Theme.colors.primary + '35' }]}>
          <LinearGradient
            colors={[Theme.colors.primary + '18', Theme.colors.secondary + '12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.copilotHeader}>
            <View style={styles.copilotTitleRow}>
              <View style={styles.copilotIconBadge}>
                <Zap size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.copilotTitle, { color: colors.text }]}>AI Career Boost Tools</Text>
                <Text style={[styles.copilotSub, { color: colors.textMuted }]}>Maximize your chance of getting an interview</Text>
              </View>
            </View>
          </View>

          <View style={styles.copilotActionsRow}>
            <TouchableOpacity
              style={[styles.copilotBtn, { backgroundColor: Theme.colors.primary }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/builder/ats',
                  params: {
                    jobUrl: job.applyLink,
                    autoScan: 'true',
                    autoOptimize: 'true',
                    jobTitle: job.title,
                    company: job.company,
                  },
                })
              }
            >
              <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.copilotBtnText}>Tailor Resume to Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.copilotBtnOutline, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/builder/voice',
                  params: {
                    mode: 'interview',
                    role: job.title,
                    company: job.company,
                    description: job.description,
                  },
                })
              }
            >
              <Mic size={14} color={Theme.colors.secondary} />
              <Text style={[styles.copilotBtnOutlineText, { color: colors.text }]}>AI Mock Interview</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Job Overview Section */}
        <Animated.View entering={FadeInUp.delay(240).duration(450)} style={[styles.contentSection, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionHeadingIcon, { backgroundColor: Theme.colors.primary + '18' }]}>
              <Award size={16} color={Theme.colors.primary} />
            </View>
            <Text style={[styles.sectionHeadingTitle, { color: colors.text }]}>About the Role</Text>
          </View>
          <Text style={[styles.descriptionBody, { color: colors.text }]}>
            {job.description}
          </Text>

          <View style={[styles.workScheduleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(87, 51, 83, 0.04)' }]}>
            <Calendar size={15} color={Theme.colors.primary} />
            <Text style={[styles.scheduleText, { color: colors.text }]}>Working Days: <Text style={{ fontWeight: '800' }}>{job.workDays}</Text></Text>
          </View>
        </Animated.View>

        {/* Perks & Benefits Bento Grid */}
        <Animated.View entering={FadeInUp.delay(300).duration(450)} style={[styles.contentSection, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionHeadingIcon, { backgroundColor: '#10B98118' }]}>
              <Sparkles size={16} color="#10B981" />
            </View>
            <Text style={[styles.sectionHeadingTitle, { color: colors.text }]}>Perks & Employee Benefits</Text>
          </View>

          <View style={styles.benefitsBento}>
            {job.benefits.map((benefit, i) => (
              <View key={i} style={[styles.benefitItem, { backgroundColor: isDark ? '#ffffff08' : '#FDF8F5', borderColor: colors.glassBorder }]}>
                <View style={styles.benefitCheck}>
                  <Check size={11} color="#10B981" />
                </View>
                <Text style={[styles.benefitLabel, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Auto Apply Status Card */}
        <Animated.View entering={FadeInUp.delay(360).duration(450)} style={[styles.contentSection, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionHeadingIcon, { backgroundColor: '#6366F118' }]}>
              <Zap size={16} color="#6366F1" />
            </View>
            <Text style={[styles.sectionHeadingTitle, { color: colors.text }]}>One-Tap Auto Apply Engine</Text>
            <TouchableOpacity
              onPress={() => router.push('/auto-apply-settings' as any)}
              style={styles.settingsLink}
            >
              <Text style={{ color: Theme.colors.primary, fontSize: 12, fontWeight: '800' }}>Preferences</Text>
            </TouchableOpacity>
          </View>

          {aaRecord ? (
            <View style={styles.aaRecordWrap}>
              <AutoApplyBadge status={aaRecord.status} />
              {aaRecord.resumeCustomized && (
                <Text style={[styles.aaSubDetail, { color: '#10B981' }]}>Resume Customized with Relevant Keywords ✓</Text>
              )}
              {!!aaRecord.reason && (
                <Text style={[styles.aaSubDetail, { color: colors.textMuted }]}>{aaRecord.reason}</Text>
              )}
            </View>
          ) : (
            <Text style={[styles.aaExplainer, { color: colors.textMuted }]}>
              {aaSettings.enabled
                ? 'Check ATS compatibility, align resume qualifications with requirements, and submit automatically.'
                : 'Enable Auto Apply in settings to automatically queue matching jobs.'}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.aaActionBtn, { backgroundColor: '#573353', opacity: aaBusy ? 0.6 : 1 }]}
            onPress={handleAutoApply}
            disabled={aaBusy}
            activeOpacity={0.85}
          >
            {aaBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Zap size={15} color="#FDA758" fill="#FDA758" />
                <Text style={styles.aaActionBtnText}>
                  {aaRecord ? 'Re-run Auto Apply' : 'Run Auto Apply & Resume Match'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom Sticky Action Bar */}
      <View
        style={[
          styles.bottomDock,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: isDark ? 'rgba(17, 14, 25, 0.95)' : 'rgba(255, 255, 255, 0.96)',
            borderTopColor: colors.glassBorder,
          },
        ]}
      >
        <View style={styles.dockRow}>
          <TouchableOpacity
            style={[styles.autofillBtn, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
            onPress={handleAutofillApply}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color={Theme.colors.primary} />
            <Text style={[styles.autofillBtnText, { color: colors.text }]}>Autofill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryApplyBtn, { backgroundColor: Theme.colors.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Theme.colors.primary, '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryApplyBtnText}>Apply Now</Text>
              <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Did You Apply Modal */}
      <Modal
        visible={showApplyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={BounceIn.duration(380)} style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: Theme.colors.primary + '18' }]}>
              <Sparkles size={26} color={Theme.colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Application Status</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Did you submit your application for <Text style={{ fontWeight: '800', color: colors.text }}>{job.title}</Text> at{' '}
              <Text style={{ fontWeight: '800', color: Theme.colors.primary }}>{job.company}</Text>?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionSecondary, { borderColor: colors.glassBorder }]}
                onPress={() => handleConfirmApplication(false)}
              >
                <Frown size={16} color={colors.textMuted} />
                <Text style={[styles.modalActionSecondaryText, { color: colors.textMuted }]}>Not Yet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionPrimary, { backgroundColor: Theme.colors.primary }]}
                onPress={() => handleConfirmApplication(true)}
              >
                <Smile size={16} color="#FFFFFF" />
                <Text style={styles.modalActionPrimaryText}>Yes, Track It!</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    zIndex: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  logoSquircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  monogramWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroBadgeRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroJobTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 8,
  },
  companyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  heroCompanyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dotDivider: {
    fontSize: 12,
  },
  heroLocationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bentoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  bentoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bentoValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  bentoSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  copilotCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  copilotHeader: {
    marginBottom: 12,
  },
  copilotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copilotIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copilotTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  copilotSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  copilotActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copilotBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  copilotBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  copilotBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  copilotBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contentSection: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeadingIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeadingTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  settingsLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  descriptionBody: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '400',
  },
  workScheduleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  benefitsBento: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  benefitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  aaRecordWrap: {
    gap: 6,
    marginBottom: 12,
  },
  aaSubDetail: {
    fontSize: 12,
    fontWeight: '600',
  },
  aaExplainer: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  aaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  aaActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autofillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  autofillBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryApplyBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalActionSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  modalActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
