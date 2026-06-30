import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  useColorScheme,
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
import { Theme, Colors } from "@/constants/theme";
import { Sparkles } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface CustomSplashScreenProps {
  isLoading: boolean; // Whether the authentication state is still resolving
  onFinish: () => void; // Callback when the splash exit animation finishes
}

export default function CustomSplashScreen({
  isLoading,
  onFinish,
}: CustomSplashScreenProps) {
  // Animation shared values
  const logoScale = useSharedValue(0.3);
  const logoRotate = useSharedValue(-15);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const progress = useSharedValue(0);

  // Exit animation shared values
  const containerTranslateY = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // Local state to track when internal animations are complete
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // 1. Hide the native splash screen immediately when the custom layout mounts
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.log("Expo SplashScreen hide error (can be ignored in dev):", error);
      }
    };
    hideNativeSplash();

    // 2. Trigger logo entry animation (Spring scale & rotation)
    logoScale.value = withSpring(1, {
      damping: 10,
      stiffness: 80,
    });
    logoRotate.value = withSpring(-3, {
      damping: 12,
      stiffness: 70,
    });

    // 3. Fade and slide up content (Title, subtext, progress bar)
    contentOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600 })
    );
    contentTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 90 })
    );

    // 4. Fill progress loader from 0% to 100% over 1.6 seconds
    progress.value = withTiming(1, { duration: 1600 }, (finished) => {
      if (finished) {
        runOnJS(setAnimationComplete)(true);
      }
    });
  }, []);

  // 5. Watch for both loading to end (Firebase auth ready) and entry animations to complete
  useEffect(() => {
    if (!isLoading && animationComplete) {
      // Execute exit transition: slide up and fade out
      containerOpacity.value = withTiming(0, { duration: 450 });
      containerTranslateY.value = withTiming(-height, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }
  }, [isLoading, animationComplete]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { rotate: `${logoRotate.value}deg` },
      ] as any,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        containerAnimatedStyle as any,
      ]}
    >
      <View style={styles.centerContent}>
        {/* Animated Logo Badge */}
        <Animated.View style={[styles.logoBadge, styles.brutalShadowLime, logoAnimatedStyle as any]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Animated Brand Content */}
        <Animated.View style={[styles.brandContainer, contentAnimatedStyle as any]}>
          {/* Main Title with highlights */}
          <Text style={styles.heroText}>
            ELEVATE{"\n"}
            <Text style={{ color: "#A3E635" }}>YOUR CAREER.</Text>
          </Text>

          {/* Neo-Brutalism Logo Header Card */}
          <View style={[styles.cardHeader, styles.brutalShadowSmallLime]}>
            <Text style={styles.brandTitle}>
              Resume <Text style={{ color: "#A3E635" }}>Elite</Text>
            </Text>
            <View style={styles.taglineBadge}>
              <Sparkles size={12} color="#000" />
              <Text style={styles.taglineText}>AI-POWERED</Text>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subHeroText}>
            Create an ATS-friendly, premium resume in minutes and land your dream job faster.
          </Text>

          {/* Neo-Brutalist Progress Loader */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarOuter, styles.brutalShadowTinyLime]}>
              <Animated.View
                style={[
                  styles.progressBarInner,
                  { backgroundColor: "#A3E635" },
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

      {/* Decorative footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>AI Resume Builder &bull; ATS Optimizer</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // Ensure it sits on top of all stack navigation
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: "#000000", // Solid black background
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 30,
  },
  // Neo-Brutalism Styles with White Borders and Lime Shadows for Dark Mode
  brutalShadowLime: {
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#A3E635",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  brutalShadowSmallLime: {
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#A3E635",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  brutalShadowTinyLime: {
    borderWidth: 1.5,
    borderColor: "#ffffff",
    shadowColor: "#A3E635",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  logoBadge: {
    width: 95,
    height: 95,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    marginBottom: 30,
    overflow: "hidden",
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
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    textAlign: "center",
    color: "#ffffff", // Solid white text
    textTransform: "uppercase",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000000", // Black inner card
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
    maxWidth: 280,
    marginBottom: 25,
  },
  brandTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff", // White text
  },
  taglineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A3E635", // Vibrant green badge
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#000000",
    gap: 3,
  },
  taglineText: {
    fontFamily: "PoppinsBold",
    fontSize: 8,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  subHeroText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff", // White text
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  // Progress Bar
  progressContainer: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
  },
  progressBarOuter: {
    width: "100%",
    height: 16,
    backgroundColor: "#000000", // Black track
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 4,
  },
  loadingText: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff", // White loading text
    marginTop: 12,
    opacity: 0.8,
  },
  footerContainer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff", // White footer text
    opacity: 0.7,
  },
});
