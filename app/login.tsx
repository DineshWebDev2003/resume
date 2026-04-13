import { Theme, Colors } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Github, LogIn } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { signInWithGoogle } from "@/services/auth";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

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
      <LinearGradient
        colors={isDark ? ["#000", "#1a1a2e", "#16213e"] : [colors.background, "#f0f0f0"]}
        style={styles.gradient}
      />

      {/* Abstract Background Shapes */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(1000)}
        style={[styles.shape1, { backgroundColor: Theme.colors.primary }]}
      />
      <Animated.View
        entering={FadeInUp.delay(400).duration(1000)}
        style={[styles.shape2, { backgroundColor: Theme.colors.secondary }]}
      />

      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.logoContainer}
        >
          <View style={styles.logoBadge}>
            <Image 
              source={require("@/assets/images/icon.png")} 
              style={{ width: "100%", height: "100%", borderRadius: 24 }} 
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Resume Elite</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Elevate your career with AI-powered resumes
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.buttonContainer}
        >
          <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={[styles.glassButton, { borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
              <LogIn color={colors.text} size={20} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Continue with Google</Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity style={styles.secondaryButton}>
            <Github color={colors.textMuted} size={18} />
            <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>Login with GitHub</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(700)}
          style={[styles.footerText, { color: colors.textMuted }]}
        >
          By continuing, you agree to our Terms and Privacy Policy
        </Animated.Text>
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
  shape1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
  },
  shape2: {
    position: "absolute",
    bottom: 50,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoBadge: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  glassButton: {
    borderRadius: Theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footerText: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
  },
});


