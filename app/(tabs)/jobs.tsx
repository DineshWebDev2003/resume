import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, TextInput, Dimensions } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/glass-card';
import { Briefcase, MapPin, Search, Star, Zap, ChevronRight, Globe, SlidersHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const JobAdContainer = ({ colors }: any) => (
  <Animated.View entering={FadeInUp}>
    <GlassCard style={[styles.adCard, { backgroundColor: colors.surface + '80', borderColor: colors.glassBorder }]}>
      <View style={styles.adHeader}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>SPONSORED</Text>
        </View>
        <Text style={[styles.adTitle, { color: colors.text }]}>Boost Your Career with AI</Text>
      </View>
      <Text style={[styles.adBody, { color: colors.textMuted }]}>
        Join 10,000+ professionals using our AI tools to land interviews at top tech companies.
      </Text>
      <TouchableOpacity style={[styles.adButton, { backgroundColor: Theme.colors.primary }]}>
        <Text style={styles.adButtonText}>Try Professional Plan</Text>
      </TouchableOpacity>
    </GlassCard>
  </Animated.View>
);

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<'Google' | 'Throne'>('Google');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Tamil Nadu');
  const [query, setQuery] = useState('software jobs');

  const LOCATIONS = ['Tamil Nadu', 'Chennai', 'Coimbatore', 'Madurai', 'Trichy'];

  const THRONE_JOBS = [
    { 
      id: 't1', 
      title: 'Senior Product Designer', 
      company: 'AppThrone Inc', 
      loc: 'Chennai (On-site)', 
      type: 'Immediate', 
      salary: '₹12L - ₹18L',
      hot: true,
      postedBy: 'Verified Recruiter'
    },
    { 
      id: 't2', 
      title: 'Full Stack Developer', 
      company: 'Creative Studio', 
      loc: 'Remote', 
      type: 'Full-time', 
      salary: '₹8L - ₹15L',
      hot: false,
      postedBy: 'HR @ Creative'
    },
    { 
      id: 't3', 
      title: 'AI Solutions Architect', 
      company: 'Neural Edge', 
      loc: 'Bangalore', 
      type: 'Direct Hire', 
      salary: '₹25L+',
      hot: true,
      postedBy: 'Tech Lead'
    }
  ];

  const translateTerm = (text: string) => {
    if (!text) return text;
    const lower = text.toLowerCase();
    if (lower.includes('toàn thời gian')) return 'Full Time';
    return text.replace(/[^\x00-\x7F]/g, "").trim() || text; 
  };

  const fetchJobs = (searchStr: string, loc: string = selectedLocation) => {
    if (activeTab === 'Throne') return;
    setLoading(true);
    const API_KEY = 'c4ac0c4c3bf946f49c3a6b1251ebcdbe790be3978ae298102dfb6598ce9e7f2d';
    const SEARCH_QUERY = `${searchStr.trim()} in ${loc}`; 

    fetch(`https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(SEARCH_QUERY)}&api_key=${API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs_results || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'Google') {
        fetchJobs(query, selectedLocation);
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topFixed, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Job Search</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {activeTab === 'Google' ? 'Sourced via Google Jobs' : 'Premium App-Only Listings'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
            <SlidersHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <TouchableOpacity 
            onPress={() => setActiveTab('Google')}
            style={[styles.tab, activeTab === 'Google' && { backgroundColor: Theme.colors.primary }]}
          >
            <Globe size={16} color={activeTab === 'Google' ? '#000' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'Google' ? '#000' : colors.textMuted }]}>Google Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('Throne')}
            style={[styles.tab, activeTab === 'Throne' && { backgroundColor: Theme.colors.primary }]}
          >
            <Star size={16} color={activeTab === 'Throne' ? '#000' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'Throne' ? '#000' : colors.textMuted }]}>Throne Choice</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Google' ? (
          <Animated.View entering={FadeInUp}>
            <GlassCard style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Search size={20} color={colors.textMuted} />
              <TextInput 
                style={[styles.searchInput, { color: colors.text }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search software, design..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => fetchJobs(query)}
                returnKeyType="search"
              />
            </GlassCard>

            <View style={{ marginBottom: 24 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity 
                    key={loc}
                    onPress={() => {
                      setSelectedLocation(loc);
                      fetchJobs(query, loc);
                    }}
                    style={[
                      styles.locChip,
                      { backgroundColor: colors.surface, borderColor: colors.glassBorder },
                      selectedLocation === loc && { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary }
                    ]}
                  >
                    <Text style={[styles.locChipText, { color: colors.text }, selectedLocation === loc && { color: '#fff' }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
              </View>
            ) : (
              jobs.map((job, idx) => (
                <React.Fragment key={job.job_id || idx}>
                  {idx > 0 && idx % 3 === 0 && <JobAdContainer colors={colors} />}
                  <GlassCard style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                    <TouchableOpacity 
                      onPress={() => router.push({
                        pathname: '/job-details',
                        params: {
                          title: job.title,
                          company: job.company_name,
                          location: job.location,
                          logo: job.thumbnail,
                          applyLink: job.apply_options?.[0]?.link || job.share_link,
                          salary: job.detected_extensions?.salary || job.salary || 'Competitive'
                        }
                      })}
                    >
                      <View style={styles.jobHeader}>
                        <View style={[styles.logoContainer, { backgroundColor: '#fff' }]}>
                            {job.thumbnail ? (
                                <Image source={{ uri: job.thumbnail }} style={styles.logo} resizeMode="contain" />
                            ) : (
                                <Briefcase size={22} color="#000" />
                            )}
                        </View>
                        <View style={styles.jobInfo}>
                          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                          <Text style={[styles.companyName, { color: colors.textMuted }]}>{job.company_name}</Text>
                        </View>
                      </View>
                      <View style={styles.tagRow}>
                        <View style={[styles.tag, { backgroundColor: Theme.colors.secondary + '10' }]}>
                            <MapPin size={10} color={Theme.colors.secondary} />
                            <Text style={[styles.tagText, { color: Theme.colors.secondary }]}>{job.location || 'Anywhere'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.applyBtn}
                      onPress={() => Linking.openURL(job.apply_options?.[0]?.link || job.share_link)}
                    >
                      <Text style={styles.applyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                  </GlassCard>
                </React.Fragment>
              ))
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInRight}>
            {THRONE_JOBS.map((job, idx) => (
              <React.Fragment key={job.id}>
                {idx > 0 && idx % 2 === 0 && <JobAdContainer colors={colors} />}
                <TouchableOpacity 
                  style={[styles.throneCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                  onPress={() => router.push({
                      pathname: '/job-details',
                      params: {
                          title: job.title,
                          company: job.company,
                          location: job.loc,
                          salary: job.salary,
                          applyLink: 'https://google.com',
                          isInternal: 'true'
                      }
                  })}
                >
                  {job.hot && (
                      <View style={styles.hotBadge}>
                          <Zap size={10} color="#000" fill="#000" />
                          <Text style={styles.hotText}>HOT JOB</Text>
                      </View>
                  )}
                  <View style={styles.throneTop}>
                      <View style={[styles.throneLogo, { backgroundColor: Theme.colors.primary + '20' }]}>
                          <Briefcase size={24} color={Theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={[styles.throneTitle, { color: colors.text }]}>{job.title}</Text>
                          <Text style={[styles.throneCompany, { color: colors.textMuted }]}>{job.company}</Text>
                      </View>
                      <ChevronRight size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.throneMeta}>
                      <View style={styles.metaItem}>
                          <MapPin size={14} color={colors.textMuted} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.loc}</Text>
                      </View>
                      <View style={styles.metaItem}>
                          <Text style={[styles.salaryText, { color: Theme.colors.secondary }]}>{job.salary}</Text>
                      </View>
                  </View>
                  <View style={[styles.postedBy, { borderTopColor: colors.glassBorder }]}>
                      <Text style={[styles.postedText, { color: colors.textMuted }]}>Posted by: <Text style={{ color: colors.text, fontWeight: '700' }}>{job.postedBy}</Text></Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topFixed: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  locChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  locChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  logoContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  companyName: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  applyBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    fontWeight: '800',
    fontSize: 15,
  },
  throneCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  hotBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotText: {
    fontSize: 9,
    fontWeight: '900',
  },
  throneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  throneLogo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  throneTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  throneCompany: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  throneMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  salaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  postedBy: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  postedText: {
    fontSize: 12,
  },
  adCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  adBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  adBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  adButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  adButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
});
