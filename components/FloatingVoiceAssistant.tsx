import { Theme } from '@/constants/theme';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_SIZE = 55;
const OFFSET_X = 20;
const OFFSET_Y = SCREEN_H - 200;

export default function FloatingVoiceAssistant() {
  const { isMinimized, data, restore, dismiss } = useVoiceAssistant();
  const router = useRouter();

  const [isDragging, setIsDragging] = useState(false);
  const translateX = useSharedValue(OFFSET_X);
  const translateY = useSharedValue(OFFSET_Y);
  const startX = useRef(OFFSET_X);
  const startY = useRef(OFFSET_Y);

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (isMinimized) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
        true,
      );
    }
  }, [isMinimized]);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const animatedStyle = useAnimatedStyle<any>(() => {
    return {
      transform: [{ translateX: translateX.value, translateY: translateY.value }],
    };
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        startX.current = translateX.value;
        startY.current = translateY.value;
      },
      onPanResponderMove: (_, gesture) => {
        translateX.value = startX.current + gesture.dx;
        translateY.value = startY.current + gesture.dy;
      },
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false);
        const isTap = Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5;
        if (isTap) {
          restore();
          router.push({ pathname: '/builder/voice', params: { fromMinimized: 'true' } });
          return;
        }
        const newX = startX.current + gesture.dx;
        const newY = startY.current + gesture.dy;
        const binCY = SCREEN_H - 30;
        const binCX = SCREEN_W / 2;
        if (
          newY + BUBBLE_SIZE / 2 > binCY - 40 &&
          Math.abs(newX + BUBBLE_SIZE / 2 - binCX) < 50
        ) {
          dismiss();
          return;
        }
        const clampedX = Math.max(5, Math.min(newX, SCREEN_W - BUBBLE_SIZE - 5));
        const clampedY = Math.max(5, Math.min(newY, SCREEN_H - BUBBLE_SIZE - 5));
        translateX.value = withSpring(clampedX);
        translateY.value = withSpring(clampedY);
      },
    })
  ).current;

  if (!isMinimized || !data) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {isDragging && (
        <View style={styles.binArea}>
          <View style={styles.binCircle}>
            <Trash2 size={28} color="#ef4444" />
          </View>
          <Text style={styles.binLabel}>Drop to close</Text>
        </View>
      )}

      <Animated.View
        style={[styles.dragContainer as any, animatedStyle]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[styles.pulseRing, animatedPulse]}>
          <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.secondary]}
            style={styles.gradientBg}
          />
        </Animated.View>

        <Animated.View style={styles.bubble}>
          <ExpoImage
            source={require('@/assets/voic-chat.webp')}
            style={styles.bubbleImage}
            contentFit="cover"
          />
        </Animated.View>

        {data.conversation.length > 0 && !isDragging && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.conversation.length}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dragContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  pulseRing: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBg: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    position: 'absolute',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  binArea: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 9998,
  },
  binCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef444420',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  binLabel: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
  },
});
