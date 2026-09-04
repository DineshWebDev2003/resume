import { TemplatePreviewModal } from "@/components/TemplatePreviewModal";
import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getResumes, UserResume } from "@/utils/storage";
import { useFocusEffect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import {
    ChevronRight,
    FileSearch,
    MessageCircle,
    Mic,
    Pen,
    Sparkles
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BuilderLanding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const screenWidth = Dimensions.get("window").width;
  const railCardWidth = (screenWidth - 52) / 2;

  const [myResumes, setMyResumes] = useState<UserResume[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  useFocusEffect(
    React.useCallback(() => {
      getResumes().then(setMyResumes);
    }, []),
  );

  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  const shake = useSharedValue(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      shake.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-6, { duration: 80 }),
        withTiming(6, { duration: 80 }),
        withTiming(-4, { duration: 80 }),
        withTiming(4, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const animatedShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shake.value }],
    };
  });

  const handleOptionPress = (navAction: () => void) => {
    navAction();
  };

  const smartOptions = [
    {
      title: "Voice Assistant",
      description: "Just speak and let AI structure your experience live.",
      icon: Mic,
      color: Theme.colors.secondary,
      mode: "voice",
      image: require("../../assets/images/quick-action/microphone.webp"),
    },
    {
      title: "ATS AI Score",
      description:
        "Check your resume compatibility score and get improvement tips.",
      icon: FileSearch,
      color: "#10b981",
      mode: "ats",
      image: require("../../assets/images/quick-action/hiring.webp"),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 20, 60),
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.header,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              Smart Resume Builder
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Select an AI-powered creation method
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              handleOptionPress(() => router.push("/builder/text-chat"))
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.filterBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Animated.View style={animatedButtonStyle}>
                <MessageCircle size={20} color={colors.text} />
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.railWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railPad}
            decelerationRate="fast"
          >
          {smartOptions.map((option, index) => (
            <Animated.View
              key={option.mode}
              entering={FadeInDown.delay(100 + index * 150)}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.railCard,
                  {
                    width: railCardWidth,
                    backgroundColor: colors.surface,
                    borderColor: option.color + "45",
                  },
                ]}
                onPress={() => {
                  handleOptionPress(() => {
                    if (option.mode === "ats") router.push("/builder/ats");
                    else if (option.mode === "voice")
                      router.push("/builder/voice");
                    else if (option.mode === "ai-interview")
                      router.push("/builder/ai-interview");
                    else
                      router.push({
                        pathname: "/builder/chat",
                        params: { initialMode: option.mode },
                      });
                  });
                }}
              >
                <View
                  style={[
                    styles.railIcon,
                    { backgroundColor: option.color + "18" },
                  ]}
                >
                  {option.image ? (
                    <ExpoImage
                      source={option.image}
                      style={{ width: 72, height: 72 }}
                      contentFit="contain"
                    />
                  ) : (option as any).lottie ? (
                    <LottieView
                      source={(option as any).lottie}
                      autoPlay
                      loop
                      style={{ width: 72, height: 72 }}
                    />
                  ) : (
                    <option.icon size={30} color={option.color} />
                  )}
                </View>

                <Text
                  style={[styles.railTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {option.title}
                </Text>
                <Text
                  style={[styles.railDesc, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {option.description}
                </Text>

                <View style={styles.railFooter}>
                  <View
                    style={[
                      styles.railArrow,
                      { backgroundColor: option.color },
                    ]}
                  >
                    <ChevronRight size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          </ScrollView>
        </View>



        {/* My Resumes - Home Screen Style */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Resumes
            </Text>
            <TouchableOpacity onPress={() => router.push("/my-resumes")}>
              <Text style={{ color: Theme.colors.primary, fontWeight: "700", fontSize: 14 }}>Manage All</Text>
            </TouchableOpacity>
          </View>
          {myResumes.length > 0 ? (
            myResumes.slice(0, 2).map((resume, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(100 * i)}>
                <TouchableOpacity
                  style={[styles.chatCard, { backgroundColor: colors.surface }]}
                  onPress={() =>
                    router.push(
                      resume.type === "ats"
                        ? "/builder/ats"
                        : ({ pathname: "/builder/manual", params: { resumeId: resume.id } } as any),
                    )
                  }
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={styles.resumeIconBox}>
                      <ExpoImage
                        source={require("@/assets/images/cv.webp")}
                        style={styles.resumeIcon}
                        contentFit="contain"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                        {resume.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        {resume.type === "ats" ? (
                          <View style={[styles.badgeContainer, { backgroundColor: isDark ? "rgba(34, 191, 192, 0.15)" : "rgba(26, 158, 159, 0.1)" }]}>
                            <Text style={[styles.badgeText, { color: isDark ? "#22BFC0" : "#1A9E9F" }]}>
                              ATS {resume.score}%
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.badgeContainer, { backgroundColor: isDark ? "rgba(137, 196, 244, 0.15)" : "rgba(137, 196, 244, 0.1)" }]}>
                            <Text style={[styles.badgeText, { color: "#89C4F4" }]}>Manual</Text>
                          </View>
                        )}
                        <Text style={[styles.chatMessage, { color: colors.textMuted }]}>
                          {resume.type === "ats" ? "Checked" : `Modified ${resume.date}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>😔</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No resumes found
              </Text>
              <TouchableOpacity
                style={styles.createBtnInline}
                onPress={() => router.push("/builder/manual")}
              >
                <Text style={styles.createBtnInlineText}>
                  Create your first resume
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TemplatePreviewModal
        visible={!!selectedTemplateId}
        templateId={selectedTemplateId || ""}
        onClose={() => setSelectedTemplateId(null)}
        onSelect={(id) => {
          setSelectedTemplateId(null);
          router.push({ pathname: "/builder/manual", params: { theme: id } });
        }}
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 110,
            right: 20,
            zIndex: 9999,
          },
          animatedShakeStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/builder/manual")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 30,
            backgroundColor: Theme.colors.primary,
            shadowColor: Theme.colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Pen size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
            Manual Entry
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  header: { marginBottom: 32 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
  },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 16, marginTop: 6 },
  railWrap: {
    marginHorizontal: -20,
    marginBottom: 8,
  },
  railPad: {
    paddingHorizontal: 20,
    gap: 12,
  },
  railCard: {
    height: 228,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.2,
    ...Theme.shadow,
  },
  railIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  railTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  railDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    flex: 1,
  },
  railFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  railArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  neoGrid: { gap: 16 },
  neoItemFull: { width: "100%", height: 120 },

  neoCard: {
    flex: 1,
    padding: 20,
    borderRadius: 28,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "space-between",
  },
  neoCardCompact: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  neoIconBoxLarge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  neoTextSectionLeft: { flex: 1, justifyContent: "center" },
  neoTitleLarge: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  neoDescLeft: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  neoArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  cardMainCompact: { alignItems: "center", justifyContent: "center" },
  neoAnimationSmall: {
    width: 50,
    height: 50,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieSmall: { width: 80, height: 80 },
  neoTitleSmall: { fontSize: 14, fontWeight: "800", textAlign: "center" },

  cardIndex: {
    position: "absolute",
    right: -5,
    top: -5,
    fontSize: 60,
    fontWeight: "900",
  },
  cardMain: { flex: 1, alignItems: "center", justifyContent: "center" },
  neoAnimation: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  neoLottie: { width: 90, height: 90, marginLeft: -15 },
  neoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  neoTextSection: { alignItems: "center" },
  neoTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  neoDesc: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  neoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  neoActionText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  neoArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  manualEntry: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 12,
  },
  manualText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  recentSection: { marginTop: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
  templateList: { gap: 16, paddingRight: 20 },
  templateCard: {
    width: 140,
    padding: 12,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  templatePreview: {
    width: "100%",
    aspectRatio: 1 / 1.4142,
    borderRadius: 10,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    marginBottom: 12,
    overflow: "hidden",
  },
  templateName: { fontSize: 14, fontWeight: "700" },
  resumeIconBox: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  resumeIcon: {
    width: "100%",
    height: "100%",
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: Theme.border.width,
    borderColor: Theme.border.color,
    ...Theme.shadow,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "800",
  },
  chatMessage: {
    fontSize: 12,
    fontWeight: "500",
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  createBtnInline: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnInlineText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  bannerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "transparent",
    paddingBottom: 4,
  },
});
