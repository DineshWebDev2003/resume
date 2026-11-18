import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Compass,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";

import { C, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { UserStorage } from "@/services/storage";
import { isAuthorizedRecruiterEmail } from "@/utils/auth-roles";

const TRACKING = { letterSpacing: -0.3 };

export default function ChooseRoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const sc = Math.min(width / 414, 1.25);
  const p = (n: number) => Math.round(n * sc);

  const [currentRole, setCurrentRole] = useState<"job_seeker" | "recruiter">("job_seeker");
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");

  useEffect(() => {
    UserStorage.getUserRole().then((r) => {
      if (r) setCurrentRole(r);
    });
  }, []);

  const handleSelectJobSeeker = async () => {
    await UserStorage.saveUserRole("job_seeker");
    setCurrentRole("job_seeker");
    router.replace("/(tabs)");
  };

  const handleSelectRecruiter = async () => {
    const email = user?.email || "";
    const check = isAuthorizedRecruiterEmail(email);

    if (!check.authorized) {
      setRestrictionReason(
        check.reason ||
          "Recruiter access requires a verified corporate email domain (e.g. name@company.com).\n\nDeveloper override active only for dinehwebdev2003@gmail.com."
      );
      setShowRestrictedModal(true);
      return;
    }

    await UserStorage.saveUserRole("recruiter");
    setCurrentRole("recruiter");
    router.replace("/recruiter");
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <StatusBar style="dark" />

      {/* Full Cover Background Illustration (Same pattern as login screen) */}
      <Image
        source={require("@/assets/images/onboard-choose-role.png")}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          width: width,
          height: height * 0.72,
        }}
        resizeMode="cover"
      />

      {/* Smooth Fade to Cream Gradient */}
      <LinearGradient
        colors={[
          "rgba(255,243,233,0)",
          "rgba(255,243,233,0.35)",
          "rgba(255,243,233,0.9)",
          "#FFF3E9",
          "#FFF3E9",
        ]}
        locations={[0.2, 0.42, 0.62, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header Bar with Back Button */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
          accessibilityLabel="Back to Profile"
        >
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>

        <View style={styles.brandPill}>
          <Sparkles size={12} color={C.primaryDeep} />
          <Text style={styles.brandPillText}>ACCOUNT MODE</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Center Hero Heading */}
      <View style={styles.centerHero}>
        <Text style={[styles.heroSuper, TRACKING]}>RESUME ELITE</Text>
        <Text style={[styles.heroTitle, TRACKING]}>Choose Your{"\n"}Path</Text>
        <Text style={[styles.heroSubtitle, TRACKING]}>
          Select how you want to experience the platform today.
        </Text>
      </View>

      {/* Bottom Clickable Role Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Button 1: I'm a Job Seeker */}
        <Pressable
          onPress={handleSelectJobSeeker}
          style={({ pressed }) => [
            styles.roleButton,
            styles.jobSeekerBtn,
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.roleBtnIconBoxJob}>
            <Compass size={24} color="#FFFFFF" strokeWidth={2.4} />
          </View>

          <View style={styles.roleBtnContent}>
            <View style={styles.roleTitleRow}>
              <Text style={styles.roleBtnTitle}>I'm a Job Seeker</Text>
              {currentRole === "job_seeker" && (
                <View style={styles.currentActiveBadge}>
                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.currentActiveBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.roleBtnSub}>
              Build ATS resumes, practice AI interviews &amp; apply to jobs
            </Text>
          </View>

          <ArrowRight size={18} color={C.text} strokeWidth={2.4} />
        </Pressable>

        {/* Button 2: I'm a Recruiter */}
        <Pressable
          onPress={handleSelectRecruiter}
          style={({ pressed }) => [
            styles.roleButton,
            styles.recruiterBtn,
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.roleBtnIconBoxRecruiter}>
            <Building2 size={24} color="#FFFFFF" strokeWidth={2.2} />
          </View>

          <View style={styles.roleBtnContent}>
            <View style={styles.roleTitleRow}>
              <Text style={styles.roleBtnTitle}>I'm a Recruiter</Text>
              {currentRole === "recruiter" && (
                <View style={[styles.currentActiveBadge, { backgroundColor: C.primary }]}>
                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.currentActiveBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.roleBtnSub}>
              Post job openings, source verified candidates &amp; screen resumes
            </Text>
          </View>

          <ArrowRight size={18} color={C.text} strokeWidth={2.4} />
        </Pressable>

        {/* Footnote */}
        <Text style={[styles.footerNote, TRACKING]}>
          You can switch your role anytime from Account Settings.
        </Text>
      </View>

      {/* Restricted Corporate Email Dialog Modal */}
      <Modal
        visible={showRestrictedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRestrictedModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.restrictedModalCard}>
            <View style={styles.restrictedIconWrap}>
              <ShieldAlert size={32} color="#F65B4E" />
            </View>

            <Text style={styles.restrictedModalTitle}>Company Email Required</Text>
            <Text style={styles.restrictedModalDesc}>{restrictionReason}</Text>

            <View style={styles.currentEmailPill}>
              <Mail size={12} color={C.muted} />
              <Text style={styles.currentEmailText}>
                Signed in as: {user?.email || "No email"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowRestrictedModal(false)}
              style={styles.modalDismissBtn}
            >
              <Text style={styles.modalDismissText}>Continue as Job Seeker</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.primaryDeep,
    letterSpacing: 0.8,
  },
  centerHero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    marginTop: -20,
  },
  heroSuper: {
    fontSize: 13,
    fontWeight: "900",
    color: C.primaryDeep,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: C.muted,
    marginTop: 10,
    maxWidth: 300,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  jobSeekerBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(253, 167, 88, 0.4)",
  },
  recruiterBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(87, 51, 83, 0.18)",
  },
  roleBtnIconBoxJob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  roleBtnIconBoxRecruiter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  roleBtnContent: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBtnTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
  },
  currentActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#059669",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentActiveBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  roleBtnSub: {
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  footerNote: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: C.muted,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 22, 37, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  restrictedModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  restrictedIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(246, 91, 78, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  restrictedModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
    marginBottom: 8,
  },
  restrictedModalDesc: {
    fontSize: 12.5,
    color: C.muted,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 14,
  },
  currentEmailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  currentEmailText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.text,
  },
  modalDismissBtn: {
    width: "100%",
    height: 46,
    backgroundColor: C.text,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDismissText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
