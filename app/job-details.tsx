import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Alert, AppState, Modal, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { saveJobApplication } from '@/services/firestore';
import { saveAutoApplyRecord } from '@/services/firestore';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
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
  CheckCircle2, 
  Building2,
  Share2,
  Zap,
  Globe,
  Award,
  Sparkles,
  Smile,
  Frown,
  ExternalLink
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn, Layout, BounceIn } from 'react-native-reanimated';

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [showApplyModal, setShowApplyModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const [clickedApply, setClickedApply] = useState(false);

  // Auto Apply (extension — existing apply flow untouched).
  const { settings: aaSettings } = useAutoApplySettings();
  const [aaMatch, setAaMatch] = useState<number | null>(null);
  const [aaRecord, setAaRecord] = useState<ApplicationRecord | null>(null);
  const [aaBusy, setAaBusy] = useState(false);

  const job = {
    id: (params.id || params.jobId || `${params.title}-${params.company}`) as string,
    title: params.title || 'Job Title',
    company: params.company || 'Company Name',
    location: params.location || 'Location',
    salary: params.salary || '₹12L - ₹15L',
    logo: params.logo || null,
    description: params.description || "We are looking for a talented individual to join our growing team. You will be responsible for building innovative solutions and collaborating with cross-functional teams to deliver high-quality products.",
    benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Gym Membership', 'Learning Stipend'],
    workDays: 'Mon - Fri (9 AM - 6 PM)',
    applyLink: params.applyLink || 'https://google.com/jobs',
    isInternal: params.isInternal === 'true'
  };

  useEffect(() => {
    // If navigated with autoApply parameter, trigger handleApply automatically
    if (params.autoApply === 'true') {
      // Small timeout to let screen render and prevent navigation races
      setTimeout(() => {
        handleApply();
      }, 500);
    }
  }, [params.autoApply]);

  // Auto Apply: live match preview from the existing profile + resume.
  useEffect(() => {
    let live = true;
    (async () => {
      if (!auth.currentUser) return;
      try {
        const { profile } = await getAutoApplyContext(aaSettings);
        const score = calculateMatchScore(
          {
            id: job.id as string,
            title: job.title as string,
            company: job.company as string,
            location: job.location as string,
            description: job.description as string,
            salary: job.salary as string,
            scheduleType: 'Full-time',
            source: job.isInternal ? 'internal' : 'external',
            applyUrl: job.applyLink as string,
          },
          profile,
          aaSettings,
        );
        if (live) setAaMatch(score);
      } catch {}
    })();
    return () => { live = false; };
  }, [aaSettings]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // User returns to the app from background/external browser
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        clickedApply
      ) {
        // Show confirmation popup
        setShowApplyModal(true);
        setClickedApply(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [clickedApply]);

  const handleApply = async () => {
    if (job.isInternal) {
      if (!auth.currentUser) {
        Alert.alert("Login Required", "Please login to apply for jobs.");
        return;
      }
      router.push({
        pathname: '/apply',
        params: {
          title: job.title,
          company: job.company
        }
      });
    } else {
      // In-app Chromium (Chrome Custom Tab): keeps session + password manager,
      // no laptop / app-switch needed. Dismiss -> ask to track.
      try {
        setClickedApply(true);
        const result = await WebBrowser.openBrowserAsync(job.applyLink as string, {
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
        await Linking.openURL(job.applyLink as string);
      }
    }
  };

  const handleAutofillApply = () => {
    // WebView apply browser with resume autofill injection.
    router.push({
      pathname: '/apply-browser',
      params: {
        applyLink: job.applyLink as string,
        id: job.id as string,
        title: job.title as string,
        company: job.company as string,
        location: job.location as string,
        logo: (job.logo as string) || '',
      },
    });
  };

  const handleAutoApply = async () => {
    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please login to use Auto Apply.");
      return;
    }
    if (!aaSettings.enabled || aaSettings.paused) {
      Alert.alert(
        "Auto Apply is OFF",
        "Enable Auto Apply in settings first — it only touches jobs matching your preferences.",
        [
          { text: "Open Settings", onPress: () => router.push('/auto-apply-settings' as any) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    setAaBusy(true);
    try {
      const { profile, resume } = await getAutoApplyContext(aaSettings);
      const normalized = {
        id: job.id as string,
        title: job.title as string,
        company: job.company as string,
        location: job.location as string,
        description: job.description as string,
        salary: job.salary as string,
        scheduleType: 'Full-time',
        source: job.isInternal ? 'internal' : 'external',
        applyUrl: job.applyLink as string,
        logo: (job.logo as string) || undefined,
      };
      let rec = await processJobForAutoApply(normalized, {
        settings: aaSettings,
        profile,
        resume,
        // No external auto-submission: only official/allowed flows.
        submit: undefined,
      });
      // In-app postings: queue honestly — the user submits in the form.
      if (job.isInternal && rec.status === 'Manual Apply Required') {
        rec = {
          ...rec,
          status: 'Auto Apply Queued',
          statusColor: '#f59e0b',
          reason: 'Eligible — finish and submit in the official application form.',
        };
      }
      const full = { ...rec, logo: (job.logo as string) || undefined };
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
      Alert.alert("Auto Apply", e?.message || "Could not process this job.");
    } finally {
      setAaBusy(false);
    }
  };

  const handleConfirmApplication = async (didApply: boolean) => {
    setShowApplyModal(false);
    if (!didApply) return;

    if (!auth.currentUser) {
      Alert.alert("Authentication Needed", "Please log in to save this application to your profile.");
      return;
    }

    try {
      await saveJobApplication({
        id: job.id,
        title: job.title as string,
        company: job.company as string,
        location: job.location as string,
        logo: job.logo as string
      });
      Alert.alert("Success 🎉", "Job marked as Applied! You can track this in your Profile under My Jobs.");
    } catch (error: any) {
      if (error.message?.includes('already applied')) {
        Alert.alert("Already Tracked", "You have already marked this job as applied.");
      } else {
        console.error("Apply tracking error:", error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[Theme.colors.primary + '15', Theme.colors.secondary + '05', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Job Detail</Text>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Company Logo & Hero */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroSection}>
          <View style={[styles.logoBox, { backgroundColor: '#fff', borderColor: colors.glassBorder }]}>
            {job.logo ? (
              <Image source={{ uri: job.logo as string }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Building2 size={44} color={Theme.colors.primary} />
            )}
          </View>
          
          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.companyName, { color: Theme.colors.primary }]}>{job.company}</Text>
          
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <MapPin size={12} color={Theme.colors.secondary} />
              <Text style={[styles.metaText, { color: colors.text }]}>{job.location}</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Briefcase size={12} color={Theme.colors.primary} />
              <Text style={[styles.metaText, { color: colors.text }]}>Full-time</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info Grid */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.infoGrid}>
          <LinearGradient
            colors={[colors.surface, colors.surface + 'dd']}
            style={[styles.infoCard, { borderColor: colors.glassBorder }]}
          >
            <IndianRupee size={22} color={Theme.colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Salary Package</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.salary}</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={[colors.surface, colors.surface + 'dd']}
            style={[styles.infoCard, { borderColor: colors.glassBorder }]}
          >
            <Calendar size={22} color={Theme.colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Working Hours</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.workDays}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={[styles.section, styles.glassSection, { backgroundColor: colors.surface + '80', borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeader}>
            <Award size={18} color={Theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Job Overview</Text>
          </View>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {job.description}
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInUp.delay(300).duration(450)} style={[styles.section, styles.glassSection, { backgroundColor: colors.surface + '80', borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={Theme.colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Perks & Benefits</Text>
          </View>
          <View style={styles.benefitsGrid}>
            {job.benefits.map((benefit, i) => (
              <View key={i} style={[styles.benefitCard, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}>
                <CheckCircle2 size={15} color="#10b981" />
                <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
        {/* Auto Apply */}
        <Animated.View entering={FadeInUp.delay(350).duration(450)} style={[styles.section, styles.glassSection, { backgroundColor: colors.surface + '80', borderColor: colors.glassBorder }]}>
          <View style={styles.sectionHeader}>
            <Zap size={18} color={Theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Auto Apply</Text>
            <TouchableOpacity
              onPress={() => router.push('/auto-apply-settings' as any)}
              style={{ marginLeft: 'auto' }}
            >
              <Text style={{ color: Theme.colors.primary, fontSize: 12, fontWeight: '800' }}>Settings</Text>
            </TouchableOpacity>
          </View>
          {aaMatch !== null && (
            <Text style={[styles.aaMatchText, { color: colors.text }]}>
              Match: {aaMatch}%{aaRecord?.atsScore ? `  •  ATS Score: ${aaRecord.atsScore}%` : ''}
            </Text>
          )}
          {aaRecord ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              <AutoApplyBadge status={aaRecord.status} />
              {aaRecord.resumeCustomized && (
                <Text style={[styles.aaLine, { color: colors.text }]}>Resume Customized ✓</Text>
              )}
              {!!aaRecord.reason && (
                <Text style={[styles.aaLine, { color: colors.textMuted }]}>{aaRecord.reason}</Text>
              )}
              {aaRecord.status === 'Applied' && (
                <Text style={[styles.aaLine, { color: '#10b981', fontWeight: '800' }]}>Application: Applied ✓</Text>
              )}
            </View>
          ) : (
            <Text style={[styles.aaLine, { color: colors.textMuted }]}>
              {aaSettings.enabled
                ? 'Check eligibility, customize your resume for this job, and auto-apply where supported.'
                : 'Turn on Auto Apply to process this job automatically.'}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.aaBtn, { backgroundColor: Theme.colors.primary, opacity: aaBusy ? 0.6 : 1 }]}
            onPress={handleAutoApply}
            disabled={aaBusy}
          >
            <Zap size={15} color="#fff" fill="#fff" />
            <Text style={styles.aaBtnText}>
              {aaBusy ? 'Processing…' : aaRecord ? 'Re-check Auto Apply' : 'Check & Auto Apply'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.glassBorder, backgroundColor: colors.background + 'f5' }]}>
        <View style={styles.footerActionRow}>
          <TouchableOpacity 
            style={[styles.applyBtn, { flex: 1, flexDirection: 'row', gap: 8 }]}
            onPress={() => router.push({
              pathname: '/builder/ats',
              params: { 
                jobUrl: job.applyLink, 
                autoScan: 'true',
                jobTitle: job.title,
                company: job.company
              }
            })}
          >
            <Zap size={16} color="#fff" fill="#fff" />
            <Text style={styles.applyBtnText}>ATS Optimize</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.outlineBtn, { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: Theme.colors.secondary }]}
            onPress={handleApply}
          >
            <ExternalLink size={16} color="#fff" />
            <Text style={styles.outlineBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.outlineBtn, { flexDirection: 'row', gap: 6, backgroundColor: Theme.colors.primary, marginTop: 10 }]}
          onPress={handleAutofillApply}
        >
          <ExternalLink size={15} color="#fff" />
          <Text style={[styles.outlineBtnText, { color: '#fff' }]}>Quick Apply — Autofill in App</Text>
        </TouchableOpacity>
      </View>

      {/* Attractive Apply Confirmation Modal */}
      <Modal
        visible={showApplyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={BounceIn.duration(400)} style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <LinearGradient
              colors={[Theme.colors.primary + '20', 'transparent']}
              style={styles.modalGradient}
            />
            
            <View style={styles.celebrationBadge}>
              <Sparkles size={28} color={Theme.colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Did you apply?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              We hope your application for <Text style={{ fontWeight: '800', color: colors.text }}>{job.title}</Text> at <Text style={{ fontWeight: '800', color: Theme.colors.primary }}>{job.company}</Text> went smoothly!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalNoBtn, { borderColor: colors.glassBorder }]}
                onPress={() => handleConfirmApplication(false)}
              >
                <Frown size={18} color={colors.textMuted} />
                <Text style={[styles.modalNoText, { color: colors.textMuted }]}>Not Yet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalYesBtn, { backgroundColor: Theme.colors.primary }]}
                onPress={() => handleConfirmApplication(true)}
              >
                <Smile size={18} color="#fff" />
                <Text style={styles.modalYesText}>Yes, Applied!</Text>
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
    paddingHorizontal: 20,
    zIndex: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 140,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 15,
    marginBottom: 25,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  section: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  glassSection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  applyBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  outlineBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  outlineBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  aaMatchText: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  aaLine: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  aaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  aaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 30,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  celebrationBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalNoBtn: {
    borderWidth: 1.2,
  },
  modalNoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalYesBtn: {
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  modalYesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
