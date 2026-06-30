import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp, SlideInDown } from "react-native-reanimated";
import { signInWithGoogle } from "@/services/auth";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LogIn, Sparkles, ShieldCheck, Zap, FileText, Briefcase,
  Star, Target, Award
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const DECORATIVE_ICONS = [
  { Icon: Star, x: 0.08, y: 0.12, size: 20, opacity: 0.15 },
  { Icon: Award, x: 0.85, y: 0.08, size: 24, opacity: 0.12 },
  { Icon: Target, x: 0.78, y: 0.22, size: 16, opacity: 0.1 },
  { Icon: Briefcase, x: 0.12, y: 0.28, size: 18, opacity: 0.1 },
  { Icon: Sparkles, x: 0.9, y: 0.38, size: 14, opacity: 0.15 },
  { Icon: FileText, x: 0.05, y: 0.45, size: 22, opacity: 0.08 },
];

const DECORATIVE_DOTS = [
  { x: 0.2, y: 0.05, size: 8, opacity: 0.12 },
  { x: 0.7, y: 0.15, size: 12, opacity: 0.08 },
  { x: 0.3, y: 0.35, size: 6, opacity: 0.15 },
  { x: 0.88, y: 0.5, size: 10, opacity: 0.1 },
  { x: 0.15, y: 0.55, size: 14, opacity: 0.06 },
  { x: 0.6, y: 0.06, size: 5, opacity: 0.2 },
];

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      console.log("Successfully signed in to Firebase");
    } catch (e) {
      console.error("Login Error:", e);
      Alert.alert(
        "Sign In Options",
        "Google Sign-In is not fully configured or supported in this development build. Would you like to enter as a guest/developer?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue as Guest", 
            onPress: () => {
              router.replace("/(tabs)");
            }
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#fff0eb', '#fff8f5', '#fff']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="dark" />

      {/* Decorative Elements */}
      {DECORATIVE_ICONS.map(({ Icon: IconCmp, x, y, size, opacity }, idx) => (
        <View key={`icon-${idx}`} style={[styles.decorIcon, { left: `${x * 100}%`, top: `${y * 100}%` }]}>
          <IconCmp size={size} color="#8b5cf6" opacity={opacity} />
        </View>
      ))}
      {DECORATIVE_DOTS.map(({ x, y, size, opacity }, idx) => (
        <View key={`dot-${idx}`} style={[styles.decorDot, { left: `${x * 100}%`, top: `${y * 100}%`, width: size, height: size, opacity }]} />
      ))}

      {/* Top decorative curve */}
      <View style={styles.topCurve} />

      {/* Logo + Brand */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.brandSection}>
        <View style={styles.logoOuter}>
          <View style={styles.logoGlow} />
          <View style={styles.logoWrap}>
            <Image source={require("@/assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
        <Text style={styles.brandName}>
          Resume <Text style={{ color: "#8b5cf6" }}>Elite</Text>
        </Text>
        <Text style={styles.tagline}>AI-Powered Resume Builder</Text>

      </Animated.View>

      {/* Feature cards */}
      <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <View style={[styles.featIcon, { backgroundColor: "#8b5cf612" }]}>
            <Zap size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.featTitle}>AI Voice</Text>
          <Text style={styles.featDesc}>Speak your resume</Text>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featIcon, { backgroundColor: "#8b5cf612" }]}>
            <ShieldCheck size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.featTitle}>ATS Scan</Text>
          <Text style={styles.featDesc}>Pass any filter</Text>
        </View>
        <View style={styles.featureCard}>
          <View style={[styles.featIcon, { backgroundColor: "#8b5cf612" }]}>
            <Sparkles size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.featTitle}>Export</Text>
          <Text style={styles.featDesc}>PDF / DOCX</Text>
        </View>
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View entering={SlideInDown.delay(500).springify().damping(22)} style={styles.bottomSection}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleGoogleLogin} style={styles.googleBtn}>
          <LogIn color="#fff" size={20} />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={() => router.push("/terms")}>Terms</Text>
          {' & '}
          <Text style={styles.link} onPress={() => router.push("/privacy")}>Privacy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  decorIcon: {
    position: "absolute",
  },
  decorDot: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#8b5cf6",
  },
  topCurve: {
    position: "absolute",
    top: -height * 0.1,
    right: -60,
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: 200,
    backgroundColor: "#8b5cf606",
  },
  brandSection: {
    alignItems: "center",
    paddingTop: height * 0.07,
  },
  logoOuter: {
    position: "relative",
    marginBottom: 22,
  },
  logoGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: "#8b5cf615",
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#f0e8ff",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    padding: 14,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 38,
    fontWeight: "900",
    color: "#3d3352",
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9a8aaa",
    marginBottom: 14,
  },

  featureGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f0e8ff",
    padding: 16,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3d3352",
    marginBottom: 2,
  },
  featDesc: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9a8aaa",
  },
  bottomSection: {
    marginBottom: 10,
  },
  googleBtn: {
    backgroundColor: "#8b5cf6",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    marginBottom: 16,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  googleBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  footer: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9a8aaa",
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    color: "#8b5cf6",
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});
