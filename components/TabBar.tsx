import React from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Plus } from 'lucide-react-native';
import { C } from '@/constants/theme';

type TabBarProps = {
  state?: { index: number; routes: { key: string; name: string }[] };
  navigation?: {
    emit?: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate?: (name: string) => void;
  };
};

const TAB_CONFIG = {
  index: {
    active: require('@/assets/images/tab-icon-home.png'),
    inactive: require('@/assets/images/tab-icon-home-inactive.png'),
    accessibilityLabel: 'Home',
  },
  templates: {
    active: require('@/assets/images/tab-icon-templates.png'),
    inactive: require('@/assets/images/tab-icon-templates-inactive.png'),
    accessibilityLabel: 'Resumes',
  },
  jobs: {
    active: require('@/assets/images/tab-icon-jobs.png'),
    inactive: require('@/assets/images/tab-icon-jobs-inactive.png'),
    accessibilityLabel: 'Jobs',
  },
  profile: {
    active: require('@/assets/images/tab-icon-profile.png'),
    inactive: require('@/assets/images/tab-icon-profile-inactive.png'),
    accessibilityLabel: 'Profile',
  },
};

export default function TabBar(props: any) {
  const { state, navigation } = (props ?? {}) as TabBarProps;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const focusedIndex = state?.index ?? 0;
  const currentRouteName = state?.routes?.[focusedIndex]?.name || 'index';

  const navigateToTab = (targetName: string) => {
    const route = state?.routes?.find((r) => r.name === targetName);
    if (!route) {
      router.push(`/(tabs)/${targetName === 'index' ? '' : targetName}` as any);
      return;
    }
    const event = navigation?.emit?.({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (event?.defaultPrevented) return;

    if (navigation?.navigate) {
      navigation.navigate(route.name);
    } else {
      router.push(`/(tabs)/${targetName === 'index' ? '' : targetName}` as any);
    }
  };

  const handleFabPress = () => {
    navigateToTab('builder');
  };

  // Safe area bottom padding
  const bottomPad = Math.max(insets.bottom, 10);
  const barTop = 22; // Top horizontal edge of the white bar
  const barHeight = 58;
  const totalHeight = barTop + barHeight + bottomPad;

  // Center bite curve mathematics
  const cx = width / 2;
  const biteDepth = 36;
  const biteBottom = barTop + biteDepth; // 58
  const p1x = cx - 56;
  const c1x = cx - 36;
  const c2x = cx - 26;
  const c3x = cx + 26;
  const c4x = cx + 36;
  const p2x = cx + 56;

  const svgPath = `
    M 0 ${barTop}
    L ${p1x} ${barTop}
    C ${c1x} ${barTop}, ${c2x} ${biteBottom}, ${cx} ${biteBottom}
    C ${c3x} ${biteBottom}, ${c4x} ${barTop}, ${p2x} ${barTop}
    L ${width} ${barTop}
    L ${width} ${totalHeight}
    L 0 ${totalHeight}
    Z
  `;

  return (
    <View style={[styles.wrap, { height: totalHeight }]} pointerEvents="box-none">
      {/* SVG Bitten Rectangle Background */}
      <View style={[StyleSheet.absoluteFill, styles.svgShadow]} pointerEvents="none">
        <Svg width={width} height={totalHeight} style={StyleSheet.absoluteFill}>
          <Path
            d={svgPath}
            fill="#FFFFFF"
            stroke="rgba(87, 51, 83, 0.08)"
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* Floating Orange Ball in the Center Bite */}
      <View style={[styles.centerFabWrap, { left: cx - 27.5 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resume Action"
          onPress={handleFabPress}
          style={({ pressed }) => [
            styles.fab,
            {
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      </View>

      {/* 4 Interactive Navigation Slots (No Text Labels) */}
      <View style={[styles.row, { top: barTop + 6, bottom: bottomPad }]} pointerEvents="box-none">
        {/* Slot 0: Home */}
        <Pressable
          style={styles.slot}
          onPress={() => navigateToTab('index')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={TAB_CONFIG.index.accessibilityLabel}
        >
          {({ pressed }) => {
            const isActive = currentRouteName === 'index';
            return (
              <View style={[styles.tabContent, { opacity: pressed ? 0.7 : 1 }]}>
                <Image
                  source={isActive ? TAB_CONFIG.index.active : TAB_CONFIG.index.inactive}
                  style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}
                  resizeMode="contain"
                />
              </View>
            );
          }}
        </Pressable>

        {/* Slot 1: Resumes */}
        <Pressable
          style={styles.slot}
          onPress={() => navigateToTab('templates')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={TAB_CONFIG.templates.accessibilityLabel}
        >
          {({ pressed }) => {
            const isActive = currentRouteName === 'templates';
            return (
              <View style={[styles.tabContent, { opacity: pressed ? 0.7 : 1 }]}>
                <Image
                  source={isActive ? TAB_CONFIG.templates.active : TAB_CONFIG.templates.inactive}
                  style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}
                  resizeMode="contain"
                />
              </View>
            );
          }}
        </Pressable>

        {/* Middle Spacer for the Center Bite Notch */}
        <View style={styles.centerSpacer} pointerEvents="none" />

        {/* Slot 2: Jobs */}
        <Pressable
          style={styles.slot}
          onPress={() => navigateToTab('jobs')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={TAB_CONFIG.jobs.accessibilityLabel}
        >
          {({ pressed }) => {
            const isActive = currentRouteName === 'jobs';
            return (
              <View style={[styles.tabContent, { opacity: pressed ? 0.7 : 1 }]}>
                <Image
                  source={isActive ? TAB_CONFIG.jobs.active : TAB_CONFIG.jobs.inactive}
                  style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}
                  resizeMode="contain"
                />
              </View>
            );
          }}
        </Pressable>

        {/* Slot 3: Profile */}
        <Pressable
          style={styles.slot}
          onPress={() => navigateToTab('profile')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={TAB_CONFIG.profile.accessibilityLabel}
        >
          {({ pressed }) => {
            const isActive = currentRouteName === 'profile';
            return (
              <View style={[styles.tabContent, { opacity: pressed ? 0.7 : 1 }]}>
                <Image
                  source={isActive ? TAB_CONFIG.profile.active : TAB_CONFIG.profile.inactive}
                  style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}
                  resizeMode="contain"
                />
              </View>
            );
          }}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    elevation: 12,
    zIndex: 9999,
  },
  svgShadow: {
    shadowColor: '#573353',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  centerFabWrap: {
    position: 'absolute',
    top: -2,
    width: 55,
    alignItems: 'center',
    zIndex: 10000,
  },
  fab: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerSpacer: {
    width: 72,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 32,
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(87, 51, 83, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#573353',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(87, 51, 83, 0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#573353',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(87, 51, 83, 0.55)',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  continueDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  latestBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  latestBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: C.primary,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(87, 51, 83, 0.1)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#573353',
  },
  choiceDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(87, 51, 83, 0.55)',
    marginTop: 2,
  },
});
