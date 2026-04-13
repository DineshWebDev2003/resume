import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  FileText, 
  CheckCircle2, 
  Clock,
  Briefcase,
  User,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ApplyScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [availability, setAvailability] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const RESUMES = [
    { 
      id: 1, 
      role: 'Senior Product Manager',
      summary: 'Dynamic Product Manager with 8+ years experience in scaling SaaS products and leading cross-functional teams in AI-driven environments.',
      skills: ['Agile', 'Product Roadmap', 'Data Analytics', 'Market Research'],
      exp: '2020-Present: Lead PM @ TechScale',
      edu: 'MBA, Stanford University'
    },
    { 
      id: 2, 
      role: 'UI/UX Designer',
      summary: 'Passionate Designer focused on creating intuitive, user-centered digital experiences for mobile and web platforms.',
      skills: ['Figma', 'Prototyping', 'User Testing', 'Visual Design'],
      exp: '2021-Present: Senior Designer @ CreativeHub',
      edu: 'B.Des, National Institute of Design'
    },
    { 
      id: 3, 
      role: 'Frontend Developer',
      summary: 'Result-oriented Developer specialized in building high-performance, scalable React and React Native applications.',
      skills: ['React Native', 'TypeScript', 'Redux', '性能优化'],
      exp: '2019-Present: Senior Dev @ CodeCraft',
      edu: 'B.Tech, IIT Madras'
    }
  ];

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
    }, 2000);
  };

  const selectedResume = RESUMES.find(r => r.id === selectedResumeId);

  if (applied) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View entering={FadeInUp} style={styles.successBox}>
          <CheckCircle2 size={80} color={Theme.colors.secondary} />
          <Text style={[styles.successTitle, { color: colors.text }]}>Application Submitted!</Text>
          <Text style={[styles.successSub, { color: colors.textMuted }]}>
            Your application for {params.title} has been sent to {params.company}.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/jobs')}>
            <Text style={styles.backBtnText}>View More Jobs</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Apply Now</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>1. When are you available to start?</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <Clock size={20} color={Theme.colors.primary} />
            <TextInput 
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Immediately or 2 weeks notice"
              placeholderTextColor={colors.textMuted}
              value={availability}
              onChangeText={setAvailability}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>2. Select Resume to Preview</Text>
          <View style={styles.resumeList}>
            {RESUMES.map((res) => (
              <TouchableOpacity 
                key={res.id}
                onPress={() => setSelectedResumeId(res.id)}
                style={[
                  styles.resumeCard, 
                  { backgroundColor: colors.surface, borderColor: colors.glassBorder },
                  selectedResumeId === res.id && { borderColor: Theme.colors.primary, borderWidth: 2 }
                ]}
              >
                <FileText size={20} color={selectedResumeId === res.id ? Theme.colors.primary : colors.textMuted} />
                <Text style={[styles.resumeName, { color: colors.text }]}>{res.role}</Text>
                {selectedResumeId === res.id && <CheckCircle2 size={18} color={Theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedResume && (
          <Animated.View entering={SlideInRight} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>3. Full Resume Layout Preview</Text>
            <View style={[styles.fullResume, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              {/* Profile Header */}
              <View style={styles.resumeHeader}>
                <View style={styles.avatarPlaceholder}>
                    <User size={30} color={Theme.colors.primary} />
                </View>
                <View>
                    <Text style={[styles.userName, { color: colors.text }]}>{selectedResume.role}</Text>
                    <View style={styles.contactRow}>
                        <Mail size={12} color={colors.textMuted} />
                        <Text style={[styles.contactText, { color: colors.textMuted }]}>user@example.com</Text>
                    </View>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.resumePart}>
                <Text style={[styles.partTitle, { color: Theme.colors.primary }]}>PROFESSIONAL SUMMARY</Text>
                <Text style={[styles.partContent, { color: colors.textMuted }]}>{selectedResume.summary}</Text>
              </View>

              {/* Work Experience */}
              <View style={styles.resumePart}>
                <Text style={[styles.partTitle, { color: Theme.colors.primary }]}>WORK EXPERIENCE</Text>
                <View style={styles.expItem}>
                    <Briefcase size={14} color={colors.text} />
                    <Text style={[styles.partContent, { color: colors.text, fontWeight: '700' }]}>{selectedResume.exp}</Text>
                </View>
              </View>

              {/* Skills */}
              <View style={styles.resumePart}>
                <Text style={[styles.partTitle, { color: Theme.colors.primary }]}>TECHNICAL SKILLS</Text>
                <View style={styles.skillCloud}>
                    {selectedResume.skills.map((s,i) => (
                        <View key={i} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{s}</Text>
                        </View>
                    ))}
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, borderTopColor: colors.glassBorder }]}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedResumeId || !availability) && { opacity: 0.5 }]}
          disabled={!selectedResumeId || !availability || applying}
          onPress={handleApply}
        >
          {applying ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={styles.submitBtnText}>Confirm & Submit Application</Text>
              <ArrowRight size={20} color="#000" />
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  resumeList: {
    gap: 12,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  resumeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  fullResume: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  resumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resumePart: {
    marginBottom: 20,
  },
  partTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  partContent: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  expItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  successBox: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  backBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
  }
});
