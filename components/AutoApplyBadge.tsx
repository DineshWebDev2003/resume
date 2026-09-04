/**
 * AutoApplyBadge — tiny status pill reusing the app Theme.
 * Used in job cards / details / tracker without redesigning them.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AUTO_APPLY_STATUS_COLORS } from '@/constants/autoApply';
import type { AutoApplyStatus } from '@/constants/autoApply';

export function AutoApplyBadge({ status }: { status: AutoApplyStatus }) {
  const color = AUTO_APPLY_STATUS_COLORS[status] || '#9a8aaa';
  const applied = status === 'Applied';
  return (
    <View style={[styles.pill, { backgroundColor: color + '15' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {applied ? 'Applied ✓' : status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
  },
});
