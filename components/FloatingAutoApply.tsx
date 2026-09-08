import { Colors, Theme } from '@/constants/theme';
import { MAX_AUTO_APPLY_PER_DAY } from '@/constants/autoApply';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/services/firebase';
import { getAutoApplyRecords } from '@/services/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BOX_W = 176;
const BOX_H = 92;

function isToday(d: any): boolean {
  const dt = d instanceof Date ? d : new Date(d);
  const now = new Date();
  return (
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate()
  );
}

/**
 * Global floating Auto Apply box — visible on every screen while
 * Auto Apply is ON. Draggable (seekable), tap to open settings,
 * live matched/applied counts + daily progress bar.
 */
export default function FloatingAutoApply() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = (colorScheme === 'dark' ? Colors.dark : Colors.light) as any;
  const { settings } = useAutoApplySettings();

  const [matched, setMatched] = useState(0);
  const [applied, setApplied] = useState(0);
  const [todayApplied, setTodayApplied] = useState(0);
  const [hidden, setHidden] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const translateX = useSharedValue(12);
  const translateY = useSharedValue(SCREEN_H - 340);
  const startX = useRef(12);
  const startY = useRef(SCREEN_H - 340);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (!settings.enabled || !auth.currentUser) return;
    let live = true;
    const load = async () => {
      try {
        const records: any[] = await getAutoApplyRecords();
        if (!live) return;
        setMatched(records.filter((r) => r.status === 'Matched').length);
        const done = records.filter((r) => r.status === 'Applied');
        setApplied(done.length);
        setTodayApplied(done.filter((r) => r.appliedAt && isToday(r.appliedAt)).length);
      } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [settings.enabled, settings.updatedAt]);

  const animatedStyle = useAnimatedStyle<any>(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));
  const animatedPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        startX.current = translateX.value;
        startY.current = translateY.value;
      },
      onPanResponderMove: (_, g) => {
        translateX.value = startX.current + g.dx;
        translateY.value = startY.current + g.dy;
      },
      onPanResponderRelease: (_, g) => {
        setIsDragging(false);
        const isTap = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
        if (isTap) {
          router.push('/auto-apply-settings' as any);
          return;
        }
        const nx = Math.max(6, Math.min(startX.current + g.dx, SCREEN_W - BOX_W - 6));
        const ny = Math.max(6, Math.min(startY.current + g.dy, SCREEN_H - BOX_H - 6));
        translateX.value = withSpring(nx);
        translateY.value = withSpring(ny);
      },
    }),
  ).current;

  if (!settings.enabled || settings.paused || !auth.currentUser || hidden) return null;

  const progress = Math.min(1, todayApplied / MAX_AUTO_APPLY_PER_DAY);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.drag as any, animatedStyle]} {...panResponder.panHandlers}>
        <Animated.View style={animatedPulse}>
          <LinearGradient
            colors={[Theme.colors.primary, '#5b21b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.box, { borderColor: colors.glassBorder }]}
          >
            <TouchableOpacity
              style={styles.close}
              onPress={() => setHidden(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Zap size={16} color="#fff" fill="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Auto Apply ON</Text>
                <Text style={styles.counts}>
                  {matched} matched • {applied} applied
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.sub}>
              {todayApplied}/{MAX_AUTO_APPLY_PER_DAY} today — tap to manage
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drag: { position: 'absolute', top: 0, left: 0, zIndex: 9998 },
  box: {
    width: BOX_W,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    paddingTop: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  close: { position: 'absolute', top: 4, right: 6, zIndex: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 10 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 12, fontWeight: '900' },
  counts: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', marginTop: 1 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.28)',
    marginTop: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#10b981' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '600', marginTop: 5 },
});
