import { Tabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, PenTool, Briefcase, UserCircle, FileText, Sparkles } from 'lucide-react-native';
import { Theme, Colors } from '@/constants/theme';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary, // Yellow
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 65 + insets.bottom,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="resumes"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color }) => <PenTool size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButtonContainer}>
              <LinearGradient
                colors={focused ? [Theme.colors.secondary, Theme.colors.accent] : [Theme.colors.primary, Theme.colors.secondary]}
                style={styles.centerButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={24} color={focused ? '#fff' : '#fff'} />
              </LinearGradient>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '800',
            color: Theme.colors.primary,
            marginTop: 18,
          },
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <Briefcase size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserCircle size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    top: -10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ rotate: '45deg' }],
  },
});
