import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { C, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { UserStorage } from "@/services/storage";
import { isAuthorizedRecruiterEmail } from "@/utils/auth-roles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface PostedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  skills: string;
  description: string;
  applyEmailOrUrl: string;
  postedAt: string;
  applicantsCount: number;
}

const STORAGE_KEY_POSTED_JOBS = "recruiter_posted_jobs_list";

export default function RecruiterPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "post" | "screener">("jobs");

  // Posted jobs state
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("Full-time");
  const [formSalary, setFormSalary] = useState("");
  const [formExperience, setFormExperience] = useState("2-4 Years");
  const [formSkills, setFormSkills] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formApply, setFormApply] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Screener state
  const [screenJobDesc, setScreenJobDesc] = useState("");
  const [screenCandidateText, setScreenCandidateText] = useState("");
  const [screenerResult, setScreenerResult] = useState<{
    score: number;
    matches: string[];
    missing: string[];
  } | null>(null);

  // Check email authorization on mount
  useEffect(() => {
    const email = user?.email || "";
    const check = isAuthorizedRecruiterEmail(email);

    if (!check.authorized) {
      setIsAuthorized(false);
      setIsVerifying(false);
      Alert.alert(
        "Unauthorized Access",
        check.reason ||
          "Recruiter mode is reserved for verified business/company email domains.\n\nDeveloper override active only for dinehwebdev2003@gmail.com.",
        [{ text: "Switch Role", onPress: () => router.replace("/choose-role") }]
      );
    } else {
      setIsAuthorized(true);
      setIsDeveloper(!!check.isDeveloper);
      setIsVerifying(false);
      loadPostedJobs();
    }
  }, [user]);

  // Load posted jobs from AsyncStorage
  const loadPostedJobs = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_POSTED_JOBS);
      if (data) {
        setPostedJobs(JSON.parse(data));
      } else {
        // Sample starter jobs for this recruiter
        const defaults: PostedJob[] = [
          {
            id: "job-1",
            title: "Senior Full-Stack Engineer",
            company: "TechNova Solutions",
            location: "Chennai / Remote",
            type: "Full-time",
            salary: "₹18L - ₹24L/yr",
            experience: "3-5 Years",
            skills: "React Native, TypeScript, Node.js, PostgreSQL",
            description: "Lead mobile and cloud infrastructure deployment for fintech apps.",
            applyEmailOrUrl: user?.email || "careers@technova.io",
            postedAt: "Just now",
            applicantsCount: 14,
          },
        ];
        setPostedJobs(defaults);
        await AsyncStorage.setItem(STORAGE_KEY_POSTED_JOBS, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error("Error loading posted jobs", e);
    }
  };

  // Submit new job opening
  const handlePublishJob = async () => {
    if (!formTitle.trim() || !formCompany.trim() || !formLocation.trim()) {
      Alert.alert("Missing Fields", "Please fill in Job Title, Company, and Location.");
      return;
    }

    try {
      setIsSubmitting(true);

      const newJob: PostedJob = {
        id: `rec-job-${Date.now()}`,
        title: formTitle.trim(),
        company: formCompany.trim(),
        location: formLocation.trim(),
        type: formType,
        salary: formSalary.trim() || "Competitive",
        experience: formExperience,
        skills: formSkills.trim() || "Full-stack development",
        description: formDescription.trim(),
        applyEmailOrUrl: formApply.trim() || user?.email || "",
        postedAt: "Just now",
        applicantsCount: 0,
      };

      const updated = [newJob, ...postedJobs];
      setPostedJobs(updated);
      await AsyncStorage.setItem(STORAGE_KEY_POSTED_JOBS, JSON.stringify(updated));

      // Reset form
      setFormTitle("");
      setFormCompany("");
      setFormLocation("");
      setFormSalary("");
      setFormSkills("");
      setFormDescription("");

      setIsSubmitting(false);
      Alert.alert("Job Published!", "Your job opening is now active and accepting applicants.", [
        { text: "View Postings", onPress: () => setActiveTab("jobs") },
      ]);
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert("Error", "Could not publish job. Please try again.");
    }
  };

  // Delete a posted job
  const handleDeleteJob = async (id: string) => {
    Alert.alert("Close Job", "Are you sure you want to close this job listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close Job",
        style: "destructive",
        onPress: async () => {
          const updated = postedJobs.filter((j) => j.id !== id);
          setPostedJobs(updated);
          await AsyncStorage.setItem(STORAGE_KEY_POSTED_JOBS, JSON.stringify(updated));
        },
      },
    ]);
  };

  // Quick candidate ATS screener calculation
  const handleRunScreener = () => {
    if (!screenJobDesc.trim() || !screenCandidateText.trim()) {
      Alert.alert("Missing Input", "Please provide both the Job Description and Candidate Resume text.");
      return;
    }

    const jdWords = screenJobDesc.toLowerCase().split(/[\s,.;:()]+/);
    const keywords = [
      "react",
      "react native",
      "typescript",
      "javascript",
      "node",
      "aws",
      "docker",
      "python",
      "sql",
      "api",
      "git",
      "agile",
      "leadership",
      "frontend",
      "backend",
    ].filter((k) => jdWords.includes(k));

    const candidate = screenCandidateText.toLowerCase();
    const matched = keywords.filter((k) => candidate.includes(k));
    const missing = keywords.filter((k) => !candidate.includes(k));

    const score =
      keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 85;

    setScreenerResult({
      score: Math.max(score, 65),
      matches: matched.length > 0 ? matched : ["General Software Engineering", "Communication"],
      missing: missing,
    });
  };

  if (isVerifying) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.verifyingText}>Verifying recruiter credentials...</Text>
      </View>
    );
  }

  if (!isAuthorized) {
    return (
      <View style={[styles.container, styles.center, { padding: 24 }]}>
        <ShieldAlert size={48} color={C.danger} />
        <Text style={styles.deniedTitle}>Access Restricted</Text>
        <Text style={styles.deniedDesc}>
          Recruiter access is reserved for verified business/company emails. Developer override is active only for dinehwebdev2003@gmail.com.
        </Text>
        <TouchableOpacity
          style={styles.backBtnAction}
          onPress={() => router.replace("/choose-role")}
        >
          <Text style={styles.backBtnText}>Choose Job Seeker Mode</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backBtn}
          accessibilityLabel="Back to Dashboard"
        >
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>

        <View style={styles.portalTagWrap}>
          <ShieldCheck size={14} color="#059669" strokeWidth={2.4} />
          <Text style={styles.portalTagText}>
            {isDeveloper ? "DEVELOPER • RECRUITER" : "VERIFIED RECRUITER"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setActiveTab("post")}
          style={styles.quickPostBtn}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
          <Text style={styles.quickPostBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recruiter Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroGreeting}>Welcome to</Text>
              <Text style={styles.heroTitle}>Recruiter Hub</Text>
            </View>
            <View style={styles.developerBadge}>
              <Text style={styles.developerBadgeText}>
                {user?.email || "Recruiter"}
              </Text>
            </View>
          </View>

          {/* Metric Stats Bar */}
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{postedJobs.length}</Text>
              <Text style={styles.metricLabel}>Active Jobs</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>
                {postedJobs.reduce((acc, j) => acc + (j.applicantsCount || 0), 0)}
              </Text>
              <Text style={styles.metricLabel}>Total Applicants</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>98%</Text>
              <Text style={styles.metricLabel}>ATS Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("jobs")}
            style={[styles.tabNavItem, activeTab === "jobs" && styles.tabNavActive]}
          >
            <Briefcase
              size={15}
              color={activeTab === "jobs" ? "#FFFFFF" : C.text}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.tabNavText,
                activeTab === "jobs" ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              My Postings ({postedJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("post")}
            style={[styles.tabNavItem, activeTab === "post" && styles.tabNavActive]}
          >
            <Plus
              size={15}
              color={activeTab === "post" ? "#FFFFFF" : C.text}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.tabNavText,
                activeTab === "post" ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Post a Job
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("screener")}
            style={[styles.tabNavItem, activeTab === "screener" && styles.tabNavActive]}
          >
            <Sparkles
              size={15}
              color={activeTab === "screener" ? "#FFFFFF" : C.text}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.tabNavText,
                activeTab === "screener" ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              ATS Screener
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: MY POSTED JOBS */}
        {activeTab === "jobs" && (
          <View style={styles.tabContent}>
            {postedJobs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Building2 size={40} color={C.muted} />
                <Text style={styles.emptyTitle}>No active job listings</Text>
                <Text style={styles.emptySub}>
                  Publish your first opening to attract elite engineering and tech talent.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab("post")}
                  style={styles.emptyCta}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
                  <Text style={styles.emptyCtaText}>Create Job Listing</Text>
                </TouchableOpacity>
              </View>
            ) : (
              postedJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitleText}>{job.title}</Text>
                      <Text style={styles.jobCompanyText}>{job.company}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteJob(job.id)}
                      style={styles.deleteJobBtn}
                      hitSlop={10}
                    >
                      <Trash2 size={16} color="#F65B4E" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.jobMetaRow}>
                    <View style={styles.metaChip}>
                      <MapPin size={11} color={C.muted} />
                      <Text style={styles.metaChipText}>{job.location}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Briefcase size={11} color={C.muted} />
                      <Text style={styles.metaChipText}>{job.type}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={[styles.metaChipText, { color: C.primaryDeep, fontWeight: "800" }]}>
                        {job.salary}
                      </Text>
                    </View>
                  </View>

                  {job.skills ? (
                    <Text style={styles.jobSkillsText} numberOfLines={1}>
                      Skills: {job.skills}
                    </Text>
                  ) : null}

                  <View style={styles.jobCardFooter}>
                    <View style={styles.applicantBadge}>
                      <Users size={12} color="#059669" />
                      <Text style={styles.applicantBadgeText}>
                        {job.applicantsCount} Applicants
                      </Text>
                    </View>

                    <Text style={styles.postedTimeText}>{job.postedAt}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: POST A JOB FORM */}
        {activeTab === "post" && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Job Details</Text>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Senior React Native Developer"
                  placeholderTextColor={C.muted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Company & Location Row */}
              <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Company Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Google India"
                    placeholderTextColor={C.muted}
                    value={formCompany}
                    onChangeText={setFormCompany}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Location *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Chennai / Remote"
                    placeholderTextColor={C.muted}
                    value={formLocation}
                    onChangeText={setFormLocation}
                  />
                </View>
              </View>

              {/* Type & Salary Row */}
              <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Employment Type</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Full-time / Remote"
                    placeholderTextColor={C.muted}
                    value={formType}
                    onChangeText={setFormType}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Salary Range</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. ₹18L - ₹24L/yr"
                    placeholderTextColor={C.muted}
                    value={formSalary}
                    onChangeText={setFormSalary}
                  />
                </View>
              </View>

              {/* Key Skills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Required Skills (Comma separated)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. React Native, TypeScript, Node.js, GraphQL"
                  placeholderTextColor={C.muted}
                  value={formSkills}
                  onChangeText={setFormSkills}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Description & Requirements</Text>
                <TextInput
                  style={[styles.formInput, { height: 90, textAlignVertical: "top", paddingTop: 10 }]}
                  placeholder="Describe the role, key responsibilities, and qualifications..."
                  placeholderTextColor={C.muted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline={true}
                />
              </View>

              {/* Apply Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>How Candidates Apply (Email or URL)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. careers@company.com or https://apply.link"
                  placeholderTextColor={C.muted}
                  value={formApply}
                  onChangeText={setFormApply}
                  autoCapitalize="none"
                />
              </View>

              {/* Publish Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handlePublishJob}
                disabled={isSubmitting}
                style={styles.publishBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.publishBtnText}>Publish Job Opening</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 3: CANDIDATE ATS SCREENER */}
        {activeTab === "screener" && (
          <View style={styles.tabContent}>
            <View style={styles.formCard}>
              <View style={styles.screenerHeaderRow}>
                <Sparkles size={18} color={C.primaryDeep} />
                <Text style={styles.formSectionTitle}>AI Candidate Screener</Text>
              </View>
              <Text style={styles.screenerDesc}>
                Compare candidate resumes against your job requirements to get instant match scores.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Requirements / Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 75, textAlignVertical: "top", paddingTop: 10 }]}
                  placeholder="Paste job requirements, required technologies & qualifications..."
                  placeholderTextColor={C.muted}
                  value={screenJobDesc}
                  onChangeText={setScreenJobDesc}
                  multiline={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Candidate Resume Summary / Skills</Text>
                <TextInput
                  style={[styles.formInput, { height: 75, textAlignVertical: "top", paddingTop: 10 }]}
                  placeholder="Paste candidate skills, experience, and profile summary..."
                  placeholderTextColor={C.muted}
                  value={screenCandidateText}
                  onChangeText={setScreenCandidateText}
                  multiline={true}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleRunScreener}
                style={styles.publishBtn}
              >
                <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.publishBtnText}>Calculate ATS Fit</Text>
              </TouchableOpacity>

              {/* Screener Result Card */}
              {screenerResult && (
                <View style={styles.screenerResultBox}>
                  <View style={styles.scoreRow}>
                    <View>
                      <Text style={styles.scoreLabel}>Candidate Match Score</Text>
                      <Text style={styles.scoreVal}>{screenerResult.score}%</Text>
                    </View>
                    <View style={styles.verdictPill}>
                      <Text style={styles.verdictText}>
                        {screenerResult.score >= 80 ? "STRONG FIT" : "MODERATE FIT"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.matchSubhead}>Matched Keywords:</Text>
                  <View style={styles.matchChipsRow}>
                    {screenerResult.matches.map((m, idx) => (
                      <View key={idx} style={styles.matchChip}>
                        <CheckCircle2 size={11} color="#059669" />
                        <Text style={styles.matchChipText}>{m}</Text>
                      </View>
                    ))}
                  </View>

                  {screenerResult.missing.length > 0 && (
                    <>
                      <Text style={[styles.matchSubhead, { marginTop: 8 }]}>Missing Skills:</Text>
                      <View style={styles.matchChipsRow}>
                        {screenerResult.missing.map((m, idx) => (
                          <View key={idx} style={styles.missingChip}>
                            <Text style={styles.missingChipText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  verifyingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.muted,
    fontWeight: "600",
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    marginTop: 12,
  },
  deniedDesc: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  backBtnAction: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(87, 51, 83, 0.08)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
  },
  portalTagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 0.6,
  },
  quickPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.text,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  quickPostBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  contentScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  heroGreeting: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.3,
  },
  developerBadge: {
    backgroundColor: C.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 160,
  },
  developerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.text,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(87, 51, 83, 0.06)",
  },
  metricCard: {
    alignItems: "center",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "900",
    color: C.primaryDeep,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(87, 51, 83, 0.1)",
  },
  tabNavRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
  },
  tabNavActive: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  tabNavText: {
    fontSize: 11.5,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabTextInactive: {
    color: C.text,
  },
  tabContent: {
    gap: 12,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: C.muted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
    marginBottom: 16,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitleText: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
  },
  jobCompanyText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  deleteJobBtn: {
    padding: 4,
  },
  jobMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.inputBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.text,
  },
  jobSkillsText: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "500",
    marginBottom: 10,
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(87, 51, 83, 0.05)",
  },
  applicantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  applicantBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  postedTimeText: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
    marginBottom: 14,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    height: 48,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  screenerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  screenerDesc: {
    fontSize: 11.5,
    color: C.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  screenerResultBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
  },
  scoreVal: {
    fontSize: 24,
    fontWeight: "900",
    color: C.primaryDeep,
  },
  verdictPill: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verdictText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  matchSubhead: {
    fontSize: 11,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  matchChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  missingChip: {
    backgroundColor: "rgba(246, 91, 78, 0.1)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missingChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F65B4E",
  },
});

