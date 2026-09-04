import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BriefcaseBusiness,
  FileText,
  House,
  SlidersHorizontal,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BAR_HEIGHT = 76;

function TabBarBackground() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.backgroundContainer}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.glassBorder,
          },
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const bottomInset = Math.max(insets.bottom, 8);
  const activeColor = Theme.colors.primary;
  const inactiveColor = colors.textMuted;

  const renderIcon =
    (Icon: any) =>
    ({
      focused,
    }: {
      focused: boolean;
    }) => {
      return (
        <View style={styles.iconWrapper}>
          <Icon
            size={24}
            color={focused ? activeColor : inactiveColor}
            strokeWidth={focused ? 2.5 : 2}
          />
        </View>
      );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,

        tabBarStyle: {
          position: "absolute",

          left: 12,
          right: 12,
          bottom: 0,

          height: BAR_HEIGHT,

          backgroundColor: "transparent",

          borderTopWidth: 0,
          borderWidth: 0,

          elevation: 0,
          shadowOpacity: 0,

          paddingTop: 8,
          paddingBottom: bottomInset,
        },

        tabBarBackground: () => <TabBarBackground />,

        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: renderIcon(House),
        }}
      />

      {/* RESUMES */}
      <Tabs.Screen
        name="templates"
        options={{
          title: "Resumes",
          tabBarIcon: renderIcon(FileText),
        }}
      />

      {/* TOOLKIT */}
      <Tabs.Screen
        name="builder"
        options={{
          title: "Toolkit",
          tabBarIcon: renderIcon(SlidersHorizontal),
        }}
      />

      {/* JOBS */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: renderIcon(BriefcaseBusiness),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: renderIcon(User),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    overflow: "hidden",
  },

  bar: {
    flex: 1,

    borderWidth: 1,

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    overflow: "hidden",
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
