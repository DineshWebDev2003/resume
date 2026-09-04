import React, { useState } from "react";
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
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp, FadeInDown, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { ArrowRight, Check, Briefcase, Cpu, X, Sparkles, Link as LinkIcon, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateUserProfile } from "@/services/firestore";
import * as Linking from "expo-linking";
import { Theme } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const COMMON_IT_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Engineer",
  "Data Scientist", "DevOps Engineer", "UX/UI Designer", "Product Manager",
];

const COMMON_NON_IT_ROLES = [
  "Marketing Manager", "Sales Executive", "HR Manager",
  "Financial Analyst", "Operations Manager", "Customer Success", "Project Manager",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isIT, setIsIT] = useState<boolean | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [manualRole, setManualRole] = useState("");
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);
  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const handleNextStep = () => {
    if (step === 1 && isIT === null) {
      Alert.alert("Selection Required", "Please select your professional field.");
      return;
    }
    if (step === 2 && roles.length === 0) {
      Alert.alert("Roles Required", "Please add at least one role to continue.");
      return;
    }
    if (step === 2 && !primaryRole && roles.length > 0) {
      setPrimaryRole(roles[0]);
    }
    setStep(step + 1);
  };

  const handleAddRole = (roleToAdd?: string | any) => {
    const role = (typeof roleToAdd === "string" ? roleToAdd : manualRole).trim();
    if (!role) return;
    if (roles.length >= 3) {
      Alert.alert("Limit Reached", "You can add up to 3 roles maximum.");
      return;
    }
    if (roles.includes(role)) { setManualRole(""); return; }
    const newRoles = [...roles, role];
    setRoles(newRoles);
    if (!primaryRole) setPrimaryRole(role);
    setManualRole("");
  };

  const removeRole = (roleToRemove: string) => {
    const updatedRoles = roles.filter(r => r !== roleToRemove);
    setRoles(updatedRoles);
    if (primaryRole === roleToRemove) setPrimaryRole(updatedRoles.length > 0 ? updatedRoles[0] : null);
  };

  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      const profileData: any = {
        isIT: isIT || false,
        jobRoles: roles,
        primaryRole: primaryRole || roles[0] || "",
        onboardingCompleted: true,
      };
      if (groqKey.trim()) profileData.groqKey = groqKey.trim();
      if (geminiKey.trim()) profileData.geminiKey = geminiKey.trim();
      await updateUserProfile(profileData);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Something went wrong saving your profile.");
      console.error(error);
      setIsUpdating(false);
    }
  };

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <LinearGradient
        colors={['#fff0eb', '#fff8f5', '#fff']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Setup</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {step}/3</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* STEP 1 — Field */}
          {step === 1 && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepOneContainer}>
              <View style={styles.stepOneTop}>
                <Text style={styles.questionTitle}>What's your field?</Text>
                <Text style={styles.questionDesc}>We tailor your resume optimization based on your professional background.</Text>

                <ExpoImage source={require('@/assets/step-1.webp')} style={styles.stepImage} contentFit="contain" />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsIT(true)}
                  style={[styles.optionCard, isIT === true && styles.optionCardSelected]}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.optionIconBg, { backgroundColor: '#8b5cf615' }]}>
                      <Cpu size={24} color="#8b5cf6" />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>IT / Tech</Text>
                      <Text style={styles.optionDesc}>Software, Data, Cloud, etc.</Text>
                    </View>
                    {isIT === true && <Check size={20} color="#8b5cf6" />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsIT(false)}
                  style={[styles.optionCard, isIT === false && styles.optionCardSelected]}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.optionIconBg, { backgroundColor: '#8b5cf615' }]}>
                      <Briefcase size={24} color="#8b5cf6" />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>Non-IT</Text>
                      <Text style={styles.optionDesc}>Business, Healthcare, Arts, etc.</Text>
                    </View>
                    {isIT === false && <Check size={20} color="#8b5cf6" />}
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { opacity: isIT === null ? 0.5 : 1 }]}
                onPress={handleNextStep}
                disabled={isIT === null}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* STEP 2 — Roles */}
          {step === 2 && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
              <Text style={styles.questionTitle}>Your roles</Text>
              <Text style={styles.questionDesc}>Add up to 3 roles you're targeting. Tap a role to set it as Primary.</Text>

              <ExpoImage source={require('@/assets/step-2.webp')} style={styles.stepImage} contentFit="contain" />

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
                          <Text style={[styles.roleCardText, isPrimary && styles.roleCardTextPrimary]}>{role}</Text>
                          {isPrimary && (
                            <View style={styles.roleCardBadge}>
                              <Star size={10} color="#fff" fill="#fff" />
                              <Text style={styles.roleCardBadgeText}>PRIMARY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roleCardHint}>{isPrimary ? "Tap to change" : "Tap to make primary"}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeRole(role)} style={styles.roleRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={14} color="#8b5cf6" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {roles.length < 3 && (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Frontend Developer"
                      placeholderTextColor="#c0b0d0"
                      value={manualRole}
                      onChangeText={setManualRole}
                      onSubmitEditing={() => handleAddRole()}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddRole()}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Suggestions</Text>
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
                            <Text style={[styles.suggestionChipText, isAdded && { color: '#c0b0d0' }]}>+ {role}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}
              {roles.length >= 3 && <Text style={styles.limitText}>Maximum 3 roles reached.</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, { opacity: roles.length === 0 ? 0.5 : 1 }]}
                onPress={handleNextStep}
                disabled={roles.length === 0}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* STEP 3 — API Keys */}
          {step === 3 && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
              <Text style={styles.questionTitle}>Supercharge AI</Text>
              <Text style={styles.questionDesc}>Paste your API keys for advanced resume generation and interview prep.</Text>

              <ExpoImage source={require('@/assets/step3.webp')} style={styles.stepImage} contentFit="contain" />

              <View style={styles.apiCard}>
                <View style={styles.apiHeader}>
                  <Text style={styles.apiTitle}>Groq API Key</Text>
                  <TouchableOpacity style={styles.apiLink} onPress={() => openLink("https://console.groq.com/keys")}>
                    <LinkIcon size={12} color="#8b5cf6" />
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

              <View style={[styles.apiCard, { marginTop: 16 }]}>
                <View style={styles.apiHeader}>
                  <Text style={styles.apiTitle}>Gemini API Key</Text>
                  <TouchableOpacity style={styles.apiLink} onPress={() => openLink("https://aistudio.google.com/app/apikey")}>
                    <LinkIcon size={12} color="#8b5cf6" />
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

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.skipButton} onPress={handleComplete} disabled={isUpdating}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginTop: 0 }]} onPress={handleComplete} disabled={isUpdating}>
                  <Text style={styles.primaryButtonText}>Finish</Text>
                  <Sparkles size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4a3f6b",
  },
  stepBadge: {
    backgroundColor: "#8b5cf615",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8b5cf6",
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: { minHeight: 300 },
  stepOneContainer: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: height - 200,
  },
  stepOneTop: { flex: 1 },
  questionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3d3352",
    marginBottom: 6,
  },
  questionDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9a8aaa",
    lineHeight: 20,
    marginBottom: 22,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f0e8ff",
    padding: 20,
    marginBottom: 14,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  optionCardSelected: {
    borderColor: "#8b5cf6",
    borderWidth: 2,
    backgroundColor: "#faf5ff",
  },
  stepImage: {
    width: '100%',
    height: 240,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  optionInfo: { flex: 1 },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3d3352",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9a8aaa",
  },
  primaryButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
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
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#3d3352",
    borderWidth: 1,
    borderColor: "#f0e8ff",
    height: 44,
  },
  addButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 44,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  selectedRolesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0e8ff",
    shadowColor: "#8b5cf6",
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
    backgroundColor: "#8b5cf6",
  },
  roleCardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  roleCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3d3352",
  },
  roleCardTextPrimary: {
    color: "#8b5cf6",
  },
  roleCardBadge: {
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginTop: 4,
    marginBottom: 14,
  },
  suggestionsTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9a8aaa",
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
    borderColor: "#f0e8ff",
  },
  suggestionChipAdded: {
    backgroundColor: "#f5f0ff",
    borderColor: "#e0d0f0",
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8b5cf6",
  },
  apiCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f0e8ff",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  apiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  apiTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3d3352",
  },
  apiLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8b5cf615",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  apiLinkText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8b5cf6",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  skipButton: {
    backgroundColor: "#fff",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#f0e8ff",
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#9a8aaa",
  },
});
