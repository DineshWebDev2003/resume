import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { saveJobApplication } from '@/services/firestore';
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
  Zap
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const job = {
    title: params.title || 'Job Title',
    company: params.company || 'Company Name',
    location: params.location || 'Location',
    salary: params.salary || '₹12L - ₹15L',
    logo: params.logo || null,
    description: params.description || "We are looking for a talented individual to join our growing team. You will be responsible for building innovative solutions and collaborating with cross-functional teams to deliver high-quality products.",
    benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Gym Membership'],
    workDays: 'Mon - Fri (9 AM - 6 PM)',
    applyLink: params.applyLink || 'https://google.com/jobs',
    isInternal: params.isInternal === 'true'
  };

  const handleApply = async () => {
    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please login to apply for jobs.");
      return;
    }

    try {
      if (job.isInternal) {
        router.push({
            pathname: '/apply',
            params: {
                title: job.title,
                company: job.company
            }
        });
      } else {
        await Linking.openURL(job.applyLink as string);
      }
      
      // Track the application in Firestore
      await saveJobApplication({
        id: params.id as string,
        title: job.title as string,
        company: job.company as string,
        location: job.location as string,
        logo: job.logo as string
      });
      
      Alert.alert("Success", "Application tracked successfully!");
    } catch (error: any) {
      if (error.message?.includes('already applied')) {
        Alert.alert("Notice", error.message);
      } else {
        console.error("Apply error:", error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[Theme.colors.primary + '10', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn}>
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Company Logo & Hero */}
        <View style={styles.heroSection}>
        <View style={[styles.logoBox, { backgroundColor: isDark ? colors.surface : '#fff', borderColor: colors.glassBorder }]}>
            {job.logo ? (
              <Image source={{ uri: job.logo as string }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Building2 size={40} color={Theme.colors.primary} />
            )}
          </View>
          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
          <Text style={[styles.companyName, { color: colors.textMuted }]}>{job.company}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={Theme.colors.secondary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Briefcase size={14} color={Theme.colors.primary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>Full-time</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <IndianRupee size={20} color={Theme.colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Salary</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.salary}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Calendar size={20} color={Theme.colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Schedule</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.workDays}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {job.description}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benefits</Text>
          <View style={styles.benefitsList}>
            {job.benefits.map((benefit, i) => (
              <View key={i} style={styles.benefitItem}>
                <CheckCircle2 size={16} color={Theme.colors.secondary} />
                <Text style={[styles.benefitText, { color: colors.textMuted }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, borderTopColor: colors.glassBorder, backgroundColor: colors.background + 'f0' }]}>
        <View style={styles.footerActionRow}>
          <TouchableOpacity 
            style={[styles.applyBtn, { flex: 2, flexDirection: 'row', gap: 8 }]}
            onPress={() => router.push({
              pathname: '/builder/ats',
              params: { jobUrl: job.applyLink, autoScan: 'true' }
            })}
          >
            <Zap size={18} color="#FFF" fill="#FFF" />
            <Text style={styles.applyBtnText}>Optimize & Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.outlineBtn, { flex: 1.2 }]}
            onPress={handleApply}
          >
            <Text style={[styles.outlineBtnText, { color: colors.text }]}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
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
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  applyBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  outlineBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
