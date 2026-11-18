import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { Sparkles } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { C } from "@/constants/theme";

const { height } = Dimensions.get("window");

interface CustomSplashScreenProps {
  isLoading: boolean; // Whether authentication state is still resolving
  onFinish: () => void; // Callback when splash exit animation completes
}

export default function CustomSplashScreen({
  isLoading,
  onFinish,
}: CustomSplashScreenProps) {
  // Animation shared values
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);
  const progress = useSharedValue(0);

  // Exit animation shared values
  const containerTranslateY = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // Track internal animation completion
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // 1. Hide the native splash screen immediately when this custom layout mounts
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        // Safe to ignore in dev
      }
    };
    hideNativeSplash();

    // 2. Smooth logo entrance (gentle spring & fade-in, no awkward rotate or harsh box)
    logoScale.value = withSpring(1, {
      damping: 14,
      stiffness: 90,
    });
    logoOpacity.value = withTiming(1, { duration: 500 });

    // 3. Fade and slide up brand content
    contentOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 600 })
    );
    contentTranslateY.value = withDelay(
      250,
      withSpring(0, { damping: 16, stiffness: 100 })
    );

    // 4. Progress loader animation
    progress.value = withTiming(1, { duration: 1500 }, (finished) => {
      if (finished) {
        runOnJS(setAnimationComplete)(true);
      }
    });
  }, []);

  // 5. Watch for both auth resolution & animation completion before exiting
  useEffect(() => {
    if (!isLoading && animationComplete) {
      containerOpacity.value = withTiming(0, { duration: 400 });
      containerTranslateY.value = withTiming(-height, { duration: 450 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }
  }, [isLoading, animationComplete]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle as any]}>
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
      {/* Ambient background decoration */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <View style={styles.centerContent}>
        {/* Floating Transparent Logo - No background card, no white box border */}
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle as any]}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated Brand Content */}
        <Animated.View style={[styles.brandContainer, contentAnimatedStyle as any]}>
          {/* Main Title */}
          <Text style={styles.heroText}>
            ELEVATE{"\n"}
            <Text style={{ color: C.primary }}>YOUR CAREER.</Text>
          </Text>

          {/* Clean Pill Badge */}
          <View style={styles.brandBadge}>
            <Text style={styles.brandTitle}>
              Resume <Text style={{ color: C.primary }}>Elite</Text>
            </Text>
            <View style={styles.aiTag}>
              <Sparkles size={11} color="#573353" />
              <Text style={styles.aiTagText}>AI-POWERED</Text>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subHeroText}>
            Build ATS-optimized resumes and unlock top opportunities effortlessly.
          </Text>

          {/* Smooth Rounded Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarOuter}>
              <Animated.View
                style={[
                  styles.progressBarInner,
                  progressAnimatedStyle as any,
                ]}
              />
            </View>
            <Text style={styles.loadingText}>
              {!isLoading ? "Optimizing templates..." : "Syncing credentials..."}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Elegant minimalist footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>AI Resume Builder • Smart ATS Matcher</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Platform.OS === "ios" ? 60 : 50,
    backgroundColor: "#FFF8F5", // Warm Habit App cream background
    overflow: "hidden",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(253, 167, 88, 0.12)",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -100,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(87, 51, 83, 0.05)",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 28,
  },
  // Clean floating logo wrapper without background boxes, borders, or harsh shadow
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    backgroundColor: "transparent",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandContainer: {
    alignItems: "center",
    width: "100%",
  },
  heroText: {
    fontFamily: "PoppinsBold",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    color: "#573353", // Deep Plum
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(87, 51, 83, 0.08)",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 18,
    gap: 8,
  },
  brandTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    fontWeight: "800",
    color: "#573353",
    letterSpacing: -0.2,
  },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(253, 167, 88, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  aiTagText: {
    fontFamily: "PoppinsBold",
    fontSize: 9,
    fontWeight: "800",
    color: "#573353",
    letterSpacing: 0.4,
  },
  subHeroText: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(87, 51, 83, 0.65)",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  // Smooth Rounded Progress Bar
  progressContainer: {
    width: "100%",
    maxWidth: 240,
    alignItems: "center",
  },
  progressBarOuter: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(87, 51, 83, 0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: "#FDA758",
    borderRadius: 999,
  },
  loadingText: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(87, 51, 83, 0.55)",
    marginTop: 10,
    letterSpacing: -0.1,
  },
  footerContainer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  footerText: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(87, 51, 83, 0.4)",
    letterSpacing: 0.2,
  },
});
