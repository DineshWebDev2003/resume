import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert, Sparkles } from "lucide-react-native";
import { auth, signInWithGoogle, signOut } from "@/services/auth";

// Pixel True — Habit App Design Tokens
const C = {
  bg: "#FFF3E9",
  surface: "#FFFFFF",
  text: "#573353",
  muted: "rgba(87, 51, 83, 0.55)",
  faint: "rgba(87, 51, 83, 0.1)",
  primary: "#FDA758",
  primaryDeep: "#FC9D45",
  inputBg: "#FFF6ED",
  white: "#FFFFFF",
};

const TRACKING = { letterSpacing: -0.3 };

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sc = Math.min(width / 414, 1.25);
  const p = (n: number) => Math.round(n * sc);

  const [busy, setBusy] = useState(false);

  const handleGoogleLogin = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await signInWithGoogle();
      console.log("Successfully authenticated with Google");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.warn("Google Sign-In Notice:", e?.message || e);
      // Fallback for development / Expo Go where native Google module isn't linked
      Alert.alert(
        "Development Sign-In",
        "Google Sign-In native module requires a custom development client build. Continue to app?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue to App",
            onPress: () => {
              router.replace("/(tabs)");
            },
          },
        ]
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <StatusBar style="dark" />

      {/* Full Cover Background Illustration (Fresh modern vector artwork) */}
      <Image
        source={require("@/assets/images/login-illustration-new.png")}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          width: width,
          height: height * 0.68,
        }}
        resizeMode="cover"
      />

      {/* Smooth Fade to Cream Gradient */}
      <LinearGradient
        colors={[
          "rgba(255,243,233,0)",
          "rgba(255,243,233,0.45)",
          "rgba(255,243,233,0.92)",
          "#FFF3E9",
          "#FFF3E9",
        ]}
        locations={[0.15, 0.38, 0.6, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header Tag */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.brandPill}>
          <Sparkles size={13} color={C.primaryDeep} />
          <Text style={styles.brandPillText}>AI RESUME &amp; ATS CAREER HUB</Text>
        </View>
      </View>

      {/* Center Welcome Title */}
      <View style={styles.centerHero}>
        <Text style={[styles.welcomeSuper, TRACKING]}>WELCOME TO</Text>
        <Text style={[styles.welcomeTitle, TRACKING]}>Resume{"\n"}Elite</Text>
        <Text style={[styles.welcomeSubtitle, TRACKING]}>
          Build recruiter-certified ATS resumes and discover verified high-paying roles.
        </Text>
      </View>

      {/* Bottom Actions Container (Google Auth Only) */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Google Sign-In Button */}
        <Pressable
          onPress={handleGoogleLogin}
          disabled={busy}
          style={({ pressed }) => [
            styles.googleBtn,
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: busy ? 0.8 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={C.text} />
          ) : (
            <View style={styles.googleIconBox}>
              <Text style={styles.googleIconG}>G</Text>
            </View>
          )}

          <Text style={[styles.googleBtnText, TRACKING]}>
            {busy ? "Signing in..." : "Continue with Google"}
          </Text>
        </Pressable>

        {/* Terms & Privacy Footnote */}
        <View style={styles.termsRow}>
          <Text style={[styles.termsText, TRACKING]}>
            {"By continuing, you agree to our "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/terms")}
            >
              Terms
            </Text>
            {" & "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topHeader: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
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
  welcomeSuper: {
    fontSize: 14,
    fontWeight: "900",
    color: C.primaryDeep,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: C.muted,
    marginTop: 12,
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    width: "100%",
  },
  googleBtn: {
    height: 56,
    backgroundColor: C.surface,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.1)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  googleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EA4335",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconG: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },
  termsRow: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: C.muted,
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    textDecorationLine: "underline",
    color: C.text,
    fontWeight: "700",
  },
});
