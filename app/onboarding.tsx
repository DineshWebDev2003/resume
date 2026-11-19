import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp, FadeInDown, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  Cpu,
  X,
  Sparkles,
  Link as LinkIcon,
  Star,
  Home,
  RotateCcw,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateUserProfile } from "@/services/firestore";
import { UserStorage } from "@/services/storage";
import { useAuth } from "@/hooks/use-auth";
import * as Linking from "expo-linking";
import { Theme } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const COMMON_IT_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Engineer",
  "Data Scientist", "DevOps Engineer", "UX/UI Designer", "Product Manager",
  "React Developer", "Mobile App Developer", "Cloud Engineer",
];

const COMMON_NON_IT_ROLES = [
  "Marketing Manager", "Sales Executive", "HR Manager",
  "Financial Analyst", "Operations Manager", "Customer Success", "Project Manager",
  "Business Development", "Content Strategist", "Accountant",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isIT, setIsIT] = useState<boolean | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [manualRole, setManualRole] = useState("");
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);
  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [deepSeekKey, setDeepSeekKey] = useState("");
  const [hasExistingSetup, setHasExistingSetup] = useState(false);

  // ─── Pre-populate Existing Profile Data (Allow Onboarding to be Re-fillable) ───
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedGroq, savedGemini, savedDeepSeek, completedFlag] = await Promise.all([
          UserStorage.getGroqKey(),
          UserStorage.getGeminiKey(),
          UserStorage.getDeepSeekKey(),
          AsyncStorage.getItem("onboarding_completed"),
        ]);

        if (savedGroq) setGroqKey(savedGroq);
        if (savedGemini) setGeminiKey(savedGemini);
        if (savedDeepSeek) setDeepSeekKey(savedDeepSeek);
        if (completedFlag === "true") setHasExistingSetup(true);

        // Fetch user profile from hook or AsyncStorage cache
        let profile = userProfile;
        if (!profile && user?.uid) {
          const cached = await AsyncStorage.getItem(`user_profile_${user.uid}`);
          if (cached) profile = JSON.parse(cached);
        }
        if (!profile) {
          const fallback = await AsyncStorage.getItem("user_profile_local");
          if (fallback) profile = JSON.parse(fallback);
        }

        if (isMounted && profile) {
          if (typeof profile.isIT === "boolean") {
            setIsIT(profile.isIT);
          }
          if (Array.isArray(profile.jobRoles) && profile.jobRoles.length > 0) {
            setRoles(profile.jobRoles);
            setPrimaryRole(profile.primaryRole || profile.jobRoles[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load existing onboarding data:", err);
      } finally {
        if (isMounted) setIsLoadingExisting(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, userProfile]);

  const handleNextStep = () => {
    if (step === 1 && isIT === null) {
      Alert.alert("Selection Required", "Please select your professional field, or tap 'Skip to Home' to configure later.");
      return;
    }
    if (step === 2 && roles.length === 0) {
      Alert.alert("Role Selection", "Please add at least one role, or tap 'Skip to Home' to proceed to the main app.");
      return;
    }
    if (step === 2 && !primaryRole && roles.length > 0) {
      setPrimaryRole(roles[0]);
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // Step 1: User wants to exit onboarding
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    }
  };

  const handleAddRole = (roleToAdd?: string | any) => {
    const role = (typeof roleToAdd === "string" ? roleToAdd : manualRole).trim();
    if (!role) return;
    if (roles.length >= 3) {
      Alert.alert("Limit Reached", "You can add up to 3 roles maximum.");
      return;
    }
    if (roles.includes(role)) {
      setManualRole("");
      return;
    }
    const newRoles = [...roles, role];
    setRoles(newRoles);
    if (!primaryRole) setPrimaryRole(role);
    setManualRole("");
  };

  const removeRole = (roleToRemove: string) => {
    const updatedRoles = roles.filter((r) => r !== roleToRemove);
    setRoles(updatedRoles);
    if (primaryRole === roleToRemove) {
      setPrimaryRole(updatedRoles.length > 0 ? updatedRoles[0] : null);
    }
  };

  // ─── Skip Handler: Always navigates straight to Home Screen ───
  const handleSkip = async () => {
    try {
      setIsUpdating(true);
      await AsyncStorage.setItem("onboarding_completed", "true");

      // Preserve any partial information the user entered
      const partialData: any = { onboardingCompleted: true };
      if (isIT !== null) partialData.isIT = isIT;
      if (roles.length > 0) {
        partialData.jobRoles = roles;
        partialData.primaryRole = primaryRole || roles[0];
      }

      if (groqKey.trim()) await UserStorage.saveGroqKey(groqKey.trim());
      if (geminiKey.trim()) await UserStorage.saveGeminiKey(geminiKey.trim());
      if (deepSeekKey.trim()) await UserStorage.saveDeepSeekKey(deepSeekKey.trim());

      // Save locally for guest or authenticated users
      try {
        const localCached = await AsyncStorage.getItem("user_profile_local");
        const existing = localCached ? JSON.parse(localCached) : {};
        await AsyncStorage.setItem(
          "user_profile_local",
          JSON.stringify({ ...existing, ...partialData, updatedAt: new Date().toISOString() })
        );
      } catch {}

      try {
        await updateUserProfile(partialData);
      } catch (e) {
        // Suppress any remote permission or offline error
      }
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Complete Handler: Save all answers & navigate to Home Screen ───
  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      await AsyncStorage.setItem("onboarding_completed", "true");

      // Save API keys locally on device
      if (groqKey.trim()) await UserStorage.saveGroqKey(groqKey.trim());
      if (geminiKey.trim()) await UserStorage.saveGeminiKey(geminiKey.trim());
      if (deepSeekKey.trim()) await UserStorage.saveDeepSeekKey(deepSeekKey.trim());

      const profileData: any = {
        isIT: isIT !== null ? isIT : true,
        jobRoles: roles,
        primaryRole: primaryRole || roles[0] || "",
        onboardingCompleted: true,
      };

      try {
        const localCached = await AsyncStorage.getItem("user_profile_local");
        const existing = localCached ? JSON.parse(localCached) : {};
        await AsyncStorage.setItem(
          "user_profile_local",
          JSON.stringify({ ...existing, ...profileData, updatedAt: new Date().toISOString() })
        );
      } catch {}

      try {
        await updateUserProfile(profileData);
      } catch (e) {
        // Gracefully ignore cloud permission error
      }
      router.replace("/(tabs)");
    } catch (error) {
      console.warn("Onboarding finish fallback:", error);
      router.replace("/(tabs)");
    } finally {
      setIsUpdating(false);
    }
  };

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={["#fff0eb", "#fff8f5", "#fff"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="dark" />

      {/* Header Bar with Back navigation, Title, Steps, and Skip to Home */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevStep}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {step > 1 ? (
            <View style={styles.backBtnInner}>
              <ArrowLeft size={16} color="#573353" />
              <Text style={styles.backBtnText}>Back</Text>
            </View>
          ) : hasExistingSetup ? (
            <View style={styles.backBtnInner}>
              <X size={18} color="#573353" />
              <Text style={styles.backBtnText}>Close</Text>
            </View>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </TouchableOpacity>

        {/* Step Progress Pills - Tappable for quick re-filling */}
        <View style={styles.stepTabsRow}>
          {[1, 2, 3].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStep(s)}
              activeOpacity={0.7}
              style={[
                styles.stepTabPill,
                step === s && styles.stepTabPillActive,
                step > s && styles.stepTabPillCompleted,
              ]}
            >
              <Text
                style={[
                  styles.stepTabPillText,
                  step === s && styles.stepTabPillTextActive,
                  step > s && styles.stepTabPillTextCompleted,
                ]}
              >
                {s === 1 ? "1. Field" : s === 2 ? "2. Roles" : "3. AI"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Skip to Home Action Button */}
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.headerSkipBtn}
          activeOpacity={0.7}
          disabled={isUpdating}
        >
          <Home size={13} color="#573353" />
          <Text style={styles.headerSkipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoadingExisting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FDA758" />
              <Text style={styles.loadingText}>Loading setup...</Text>
            </View>
          ) : (
            <>
              {/* STEP 1 — Professional Field */}
              {step === 1 && (
                <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepOneContainer}>
                  <View style={styles.stepOneTop}>
                    <Text style={styles.questionTitle}>What's your field?</Text>
                    <Text style={styles.questionDesc}>
                      We tailor resume optimization, ATS suggestions, and job matching to your industry.
                    </Text>

                    <ExpoImage
                      source={require("@/assets/images/onboard-field-career.png")}
                      style={styles.stepImage}
                      contentFit="contain"
                    />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsIT(true)}
                      style={[styles.optionCard, isIT === true && styles.optionCardSelected]}
                    >
                      <View style={styles.optionRow}>
                        <View style={[styles.optionIconBg, { backgroundColor: "rgba(253, 167, 88, 0.15)" }]}>
                          <Cpu size={24} color="#FDA758" />
                        </View>
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionTitle}>IT / Tech</Text>
                          <Text style={styles.optionDesc}>Software Engineering, Data, Cloud, QA, DevOps</Text>
                        </View>
                        {isIT === true && <Check size={20} color="#FDA758" />}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsIT(false)}
                      style={[styles.optionCard, isIT === false && styles.optionCardSelected]}
                    >
                      <View style={styles.optionRow}>
                        <View style={[styles.optionIconBg, { backgroundColor: "rgba(253, 167, 88, 0.15)" }]}>
                          <Briefcase size={24} color="#FDA758" />
                        </View>
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionTitle}>Non-IT</Text>
                          <Text style={styles.optionDesc}>Management, Marketing, Sales, Finance, Operations</Text>
                        </View>
                        {isIT === false && <Check size={20} color="#FDA758" />}
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonFooter}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { opacity: isIT === null ? 0.5 : 1 }]}
                      onPress={handleNextStep}
                      disabled={isIT === null}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <ArrowRight size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Bottom Direct Skip to Home */}
                    <TouchableOpacity
                      style={styles.bottomSkipBtn}
                      onPress={handleSkip}
                      activeOpacity={0.7}
                      disabled={isUpdating}
                    >
                      <Text style={styles.bottomSkipText}>Skip setup & go to Home</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* STEP 2 — Target Roles */}
              {step === 2 && (
                <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                  <Text style={styles.questionTitle}>Your Target Roles</Text>
                  <Text style={styles.questionDesc}>
                    Add up to 3 roles you are targeting. Tap a role anytime to set it as Primary.
                  </Text>

                  <ExpoImage
                    source={require("@/assets/images/onboard-target-roles.png")}
                    style={styles.stepImage}
                    contentFit="contain"
                  />

                  {/* Selected Roles List */}
                  <View style={styles.selectedRolesContainer}>
                    {roles.map((role, idx) => {
                      const isPrimary = primaryRole === role;
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() => setPrimaryRole(role)}
                          style={styles.roleCard}
                        >
                          <View style={[styles.roleAccent, isPrimary && styles.roleAccentPrimary]} />
                          <View style={styles.roleCardBody}>
                            <View style={styles.roleCardRow}>
                              <Text style={[styles.roleCardText, isPrimary && styles.roleCardTextPrimary]}>
                                {role}
                              </Text>
                              {isPrimary && (
                                <View style={styles.roleCardBadge}>
                                  <Star size={10} color="#fff" fill="#fff" />
                                  <Text style={styles.roleCardBadgeText}>PRIMARY</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.roleCardHint}>
                              {isPrimary ? "Primary role for job feed & ATS" : "Tap to make primary"}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => removeRole(role)}
                            style={styles.roleRemove}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <X size={14} color="#FDA758" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Add Manual Role */}
                  {roles.length < 3 && (
                    <>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. React Developer or HR Executive"
                          placeholderTextColor="#c0b0d0"
                          value={manualRole}
                          onChangeText={setManualRole}
                          onSubmitEditing={() => handleAddRole()}
                        />
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddRole()}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Suggestions list based on IT / Non-IT */}
                      <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>
                          {isIT ? "Recommended IT Roles" : "Recommended Non-IT Roles"}
                        </Text>
                        <View style={styles.suggestionsList}>
                          {(isIT ? COMMON_IT_ROLES : COMMON_NON_IT_ROLES).map((role, idx) => {
                            const isAdded = roles.includes(role);
                            return (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => handleAddRole(role)}
                                disabled={isAdded}
                                style={[styles.suggestionChip, isAdded && styles.suggestionChipAdded]}
                              >
                                <Text
                                  style={[
                                    styles.suggestionChipText,
                                    isAdded && { color: "#c0b0d0" },
                                  ]}
                                >
                                  {isAdded ? "✓ " : "+ "}
                                  {role}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </>
                  )}

                  {roles.length >= 3 && (
                    <Text style={styles.limitText}>Maximum 3 roles reached. You can tap any role to make it Primary.</Text>
                  )}

                  <View style={styles.buttonFooter}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { opacity: roles.length === 0 ? 0.5 : 1 }]}
                      onPress={handleNextStep}
                      disabled={roles.length === 0}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <ArrowRight size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Bottom Direct Skip to Home */}
                    <TouchableOpacity
                      style={styles.bottomSkipBtn}
                      onPress={handleSkip}
                      activeOpacity={0.7}
                      disabled={isUpdating}
                    >
                      <Text style={styles.bottomSkipText}>Skip setup & go to Home</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* STEP 3 — API Keys (Optional) */}
              {step === 3 && (
                <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                  <Text style={styles.questionTitle}>Supercharge AI (Optional)</Text>
                  <Text style={styles.questionDesc}>
                    Add free API keys for unlimited zero-queue resume generations and live copilot chat. You can skip or update this anytime in Settings.
                  </Text>

                  <ExpoImage
                    source={require("@/assets/images/ats-scanner-transparent.png")}
                    style={styles.stepImage}
                    contentFit="contain"
                  />

                  <View style={styles.apiCard}>
                    <View style={styles.apiHeader}>
                      <Text style={styles.apiTitle}>Groq API Key (Recommended - Free & Fast)</Text>
                      <TouchableOpacity
                        style={styles.apiLink}
                        onPress={() => openLink("https://console.groq.com/keys")}
                      >
                        <LinkIcon size={12} color="#FDA758" />
                        <Text style={styles.apiLinkText}>GET KEY</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="gsk_..."
                      placeholderTextColor="#c0b0d0"
                      value={groqKey}
                      onChangeText={setGroqKey}
                      secureTextEntry
                    />
                  </View>

                  <View style={[styles.apiCard, { marginTop: 14 }]}>
                    <View style={styles.apiHeader}>
                      <Text style={styles.apiTitle}>Gemini API Key (Google AI Studio)</Text>
                      <TouchableOpacity
                        style={styles.apiLink}
                        onPress={() => openLink("https://aistudio.google.com/app/apikey")}
                      >
                        <LinkIcon size={12} color="#FDA758" />
                        <Text style={styles.apiLinkText}>GET KEY</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="AIza..."
                      placeholderTextColor="#c0b0d0"
                      value={geminiKey}
                      onChangeText={setGeminiKey}
                      secureTextEntry
                    />
                  </View>

                  <View style={[styles.apiCard, { marginTop: 14 }]}>
                    <View style={styles.apiHeader}>
                      <Text style={styles.apiTitle}>DeepSeek API Key (V3 & R1)</Text>
                      <TouchableOpacity
                        style={styles.apiLink}
                        onPress={() => openLink("https://platform.deepseek.com/api_keys")}
                      >
                        <LinkIcon size={12} color="#FDA758" />
                        <Text style={styles.apiLinkText}>GET KEY</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="sk-..."
                      placeholderTextColor="#c0b0d0"
                      value={deepSeekKey}
                      onChangeText={setDeepSeekKey}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={handleSkip}
                      disabled={isUpdating}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.skipButtonText}>Skip to Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}
                      onPress={handleComplete}
                      disabled={isUpdating}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryButtonText}>
                        {hasExistingSetup ? "Save Changes" : "Finish & Save"}
                      </Text>
                      <Sparkles size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  backBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#573353",
  },
  stepTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(87, 51, 83, 0.06)",
    padding: 4,
    borderRadius: 20,
  },
  stepTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  stepTabPillActive: {
    backgroundColor: "#FDA758",
  },
  stepTabPillCompleted: {
    backgroundColor: "rgba(253, 167, 88, 0.18)",
  },
  stepTabPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(87, 51, 83, 0.6)",
  },
  stepTabPillTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  stepTabPillTextCompleted: {
    color: "#FDA758",
    fontWeight: "700",
  },
  headerSkipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(87, 51, 83, 0.08)",
  },
  headerSkipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#573353",
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(87, 51, 83, 0.6)",
  },
  stepContainer: { minHeight: 300 },
  stepOneContainer: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: height - 190,
  },
  stepOneTop: { flex: 1 },
  questionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#573353",
    marginBottom: 6,
  },
  questionDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(87, 51, 83, 0.65)",
    lineHeight: 20,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: "#FDA758",
    borderWidth: 2,
    backgroundColor: "#FFF6ED",
  },
  stepImage: {
    width: "100%",
    height: 200,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  optionInfo: { flex: 1 },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#573353",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(87, 51, 83, 0.6)",
  },
  buttonFooter: {
    marginTop: 18,
    alignItems: "center",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#FDA758",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    width: "100%",
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  bottomSkipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomSkipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(87, 51, 83, 0.65)",
    textDecorationLine: "underline",
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f0ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#573353",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    height: 46,
  },
  addButton: {
    backgroundColor: "#FDA758",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 46,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  selectedRolesContainer: {
    gap: 10,
    marginBottom: 14,
  },
  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roleAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#e0d0f0",
  },
  roleAccentPrimary: {
    backgroundColor: "#FDA758",
  },
  roleCardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#573353",
  },
  roleCardTextPrimary: {
    color: "#FDA758",
  },
  roleCardBadge: {
    backgroundColor: "#FDA758",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleCardBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  roleCardHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#c0b0d0",
    marginTop: 2,
  },
  roleRemove: {
    backgroundColor: "#f5f0ff",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  limitText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: 10,
  },
  suggestionsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(87, 51, 83, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
  },
  suggestionChipAdded: {
    backgroundColor: "#f5f0ff",
    borderColor: "#e0d0f0",
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FDA758",
  },
  apiCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  apiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  apiTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#573353",
    flex: 1,
    marginRight: 8,
  },
  apiLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(253, 167, 88, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  apiLinkText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FDA758",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  skipButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.15)",
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(87, 51, 83, 0.65)",
  },
});
