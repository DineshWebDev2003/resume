import { Theme, Colors } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { LogIn, ShieldCheck, Zap, Sparkles } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { signInWithGoogle } from "@/services/auth";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      console.log("Successfully signed in to Firebase");
    } catch (e) {
      console.error("Login Error:", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Dynamic Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={isDark ? ["#050505", "#0a0a1a", "#101025"] : ["#ffffff", "#f5f7fa", "#e4e9f2"]}
          style={styles.gradient}
        />
        
        {/* Animated Orbs */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(2000)}
          style={[styles.orb, styles.orb1, { backgroundColor: Theme.colors.primary + '30' }]}
        />
        <Animated.View
          entering={FadeInDown.delay(400).duration(2500)}
          style={[styles.orb, styles.orb2, { backgroundColor: Theme.colors.secondary + '20' }]}
        />
      </View>

      <View style={styles.containerInner}>
        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.heroSection}
        >
          <View style={[styles.logoBadge, { shadowColor: Theme.colors.primary }]}>
            <Image 
              source={require("@/assets/images/icon.png")} 
              style={styles.logoImage} 
            />
          </View>
          
          <View style={styles.brandContainer}>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Resume <Text style={{ color: Theme.colors.primary }}>Elite</Text></Text>
            <View style={[styles.taglineBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Sparkles size={12} color={Theme.colors.primary} />
              <Text style={[styles.taglineText, { color: colors.textMuted }]}>AI-POWERED PRECISION</Text>
            </View>
          </View>

          <Text style={[styles.mainHeadline, { color: colors.text }]}>
            Craft Your Future with Professional Excellence
          </Text>
        </Animated.View>

        {/* Features Minimal List */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.featuresContainer}
        >
          <View style={styles.featureItem}>
            <ShieldCheck size={18} color={Theme.colors.primary} />
            <Text style={[styles.featureText, { color: colors.textMuted }]}>Enterprise Grade Security</Text>
          </View>
          <View style={styles.featureItem}>
            <Zap size={18} color={Theme.colors.primary} />
            <Text style={[styles.featureText, { color: colors.textMuted }]}>Instant PDF Generation</Text>
          </View>
        </Animated.View>

        {/* Action Section */}
        <Animated.View
          entering={FadeInDown.delay(700)}
          style={styles.actionSection}
        >
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handleGoogleLogin}
            style={styles.primaryButtonContainer}
          >
            <LinearGradient
              colors={[Theme.colors.primary, "#ffc107"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <LogIn color="#000" size={20} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Sign In with Google</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.secondaryInfo, { color: colors.textMuted }]}>
            Available on all your devices
          </Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(1000)}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            By continuing, you agree to our{"\n"}
            <Text 
              style={styles.linkText} 
              onPress={() => router.push("/terms")}
            >
              Terms of Service
            </Text>
            {" "} & {" "}
            <Text 
              style={styles.linkText} 
              onPress={() => router.push("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    borderRadius: 1000,
    filter: 'blur(60px)',
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  orb2: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  containerInner: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "space-between",
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    padding: 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
    marginBottom: 25,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  taglineBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  mainHeadline: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: -20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionSection: {
    width: "100%",
    alignItems: "center",
  },
  primaryButtonContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 12,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryInfo: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 20,
    opacity: 0.6,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  linkText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});


