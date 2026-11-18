import React from "react";
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: "Resumes",
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: "Toolkit",
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
