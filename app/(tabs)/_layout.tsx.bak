import { Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = React.memo(
  ({ focused, source }: { focused: boolean; source: any }) => {
    const activeVal = useSharedValue(focused ? 1 : 0);

    React.useEffect(() => {
      activeVal.value = withSpring(focused ? 1 : 0, {
        damping: 15,
        stiffness: 120,
      });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        activeVal.value,
        [0, 1],
        ["transparent", Theme.colors.primary],
      );
      const scale = interpolate(activeVal.value, [0, 1], [0.95, 1.05]);

      return {
        backgroundColor,
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View style={[styles.iconPill, animatedStyle]}>
        <Image
          source={source}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      </Animated.View>
    );
  },
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeColor = isDark ? "#171717" : "#171717"; // Tab active icon color

  const barHeight = 76;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: isDark ? "#A0AEC0" : "#718096",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: barHeight,
          backgroundColor: "#FFFFFF", // White background as requested
          borderWidth: Theme.border.width,
          borderColor: Theme.border.color,
          borderRadius: 18, // Boxed edge, little curve enough
          position: "absolute",
          bottom: insets.bottom > 0 ? insets.bottom + 10 : 20,
          left: 12, // Position from left
          right: 12, // Position from right
          marginHorizontal: 12, // Force margin to prevent touching the screen edges
          paddingBottom: 0, // Reset default padding
          ...Theme.shadow,
        },
        tabBarItemStyle: {
          height: barHeight,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              source={require("@/assets/images/nav-icons/house.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: "Templates",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              source={require("@/assets/images/nav-icons/templates.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: "Create",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              source={require("@/assets/images/nav-icons/edit.png")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} source={require("@/assets/case.png")} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              source={require("@/assets/images/nav-icons/panda.png")}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 52,
    height: 52,
    borderRadius: 12, // Matching boxed curve aesthetic
    justifyContent: "center",
    alignItems: "center",
  },
});
