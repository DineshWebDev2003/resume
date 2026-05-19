import { Tabs } from 'expo-router';
import React from 'react';
import { Theme, Colors } from '@/constants/theme';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LayoutDashboard, FileText, PenTool, Briefcase, UserCircle } from 'lucide-react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeColor = isDark ? '#22BFC0' : '#1A9E9F';

  const TabVectorIcon = ({ Icon, focused }: { Icon: any; focused: boolean }) => {
    const inactiveIconColor = isDark ? '#A0AEC0' : '#718096';

    return (
      <View style={[
        styles.iconPill,
        focused && { backgroundColor: activeColor }
      ]}>
        <Icon 
          size={focused ? 28 : 26} 
          color={focused ? '#FFFFFF' : inactiveIconColor} 
        />
      </View>
    );
  };

  const barHeight = 64;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: isDark ? '#A0AEC0' : '#718096',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: barHeight + insets.bottom,
          backgroundColor: isDark ? '#1E2638' : '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(185, 202, 214, 0.3)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 10,
          elevation: 12,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 0,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          height: barHeight,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabVectorIcon Icon={LayoutDashboard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ focused }) => <TabVectorIcon Icon={FileText} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => <TabVectorIcon Icon={PenTool} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused }) => <TabVectorIcon Icon={Briefcase} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabVectorIcon Icon={UserCircle} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 48,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
