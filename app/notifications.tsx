import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Bell, ChevronLeft, Briefcase, User, Info, CheckCircle2, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/glass-card';
import { FadeInRight } from 'react-native-reanimated';
import ReanimatedAnimated, { FadeInUp } from 'react-native-reanimated';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Job Match!',
    message: 'A Senior Frontend Developer role at Google matches your profile.',
    time: '2 hours ago',
    type: 'job',
    isRead: false,
  },
  {
    id: '2',
    title: 'ATS Score Improved',
    message: 'Your recent summary update boosted your ATS score by 5%.',
    time: '5 hours ago',
    type: 'account',
    isRead: false,
  },
  {
    id: '3',
    title: 'Application Viewed',
    message: 'Meta has viewed your application for the UI Designer position.',
    time: '1 day ago',
    type: 'job',
    isRead: true,
  },
  {
    id: '4',
    title: 'Profile Verified',
    message: 'Successfully verified your LinkedIn credentials.',
    time: '2 days ago',
    type: 'system',
    isRead: true,
  },
  {
    id: '5',
    title: 'Template Update',
    message: 'New "Modern Pro" template is now available in the builder.',
    time: '3 days ago',
    type: 'system',
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase size={20} color={Theme.colors.primary} />;
      case 'account': return <User size={20} color={Theme.colors.secondary} />;
      default: return <Info size={20} color="#64748b" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity >
          <Text style={{ color: Theme.colors.primary, fontWeight: '600' }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATIONS.length > 0 ? (
          NOTIFICATIONS.map((notif, index) => (
            <ReanimatedAnimated.View 
              key={notif.id}
              entering={FadeInUp.delay(index * 100).duration(400)}
            >
              <TouchableOpacity activeOpacity={0.7} style={styles.notifWrapper}>
                <GlassCard style={[
                  styles.notifCard, 
                  { 
                    backgroundColor: notif.isRead ? colors.surface : colors.background,
                    borderColor: notif.isRead ? colors.glassBorder : Theme.colors.primary + '30',
                    borderWidth: 1,
                  }
                ]}>
                  <View style={styles.notifContent}>
                    <View style={[styles.iconContainer, { backgroundColor: notif.isRead ? colors.background : Theme.colors.primary + '10' }]}>
                      {getIcon(notif.type)}
                    </View>
                    <View style={styles.textContent}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: colors.text }]}>{notif.title}</Text>
                        {!notif.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={[styles.notifMessage, { color: colors.textMuted }]} numberOfLines={2}>
                        {notif.message}
                      </Text>
                      <View style={styles.timeRow}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>{notif.time}</Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </ReanimatedAnimated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
              <Bell size={40} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              We'll let you know when something important happens!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  notifWrapper: {
    marginBottom: 12,
  },
  notifCard: {
    padding: 16,
    borderRadius: 20,
  },
  notifContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
