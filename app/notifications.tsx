import { GlassCard } from "@/components/glass-card";
import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/services/firebase";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    writeBatch,
} from "firebase/firestore";
import {
    Bell,
    Briefcase,
    ChevronLeft,
    Clock,
    Info,
    User
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import ReanimatedAnimated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Query without orderBy to avoid composite index requirement
        // Sort client-side instead
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            // Sort by createdAt descending (newest first)
            const aTime = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
            return bTime - aTime;
          });
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.isRead) {
          const notifRef = doc(db, "notifications", notif.id);
          batch.update(notifRef, { isRead: true });
        }
      });
      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job":
        return <Briefcase size={20} color={Theme.colors.primary} />;
      case "account":
        return <User size={20} color={Theme.colors.secondary} />;
      default:
        return <Info size={20} color="#64748b" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={{ color: Theme.colors.primary, fontWeight: "600" }}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            color={Theme.colors.primary}
            style={{ marginTop: 100 }}
          />
        ) : notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <ReanimatedAnimated.View
              key={notif.id}
              entering={FadeInUp.delay(index * 100).duration(400)}
            >
              <TouchableOpacity activeOpacity={0.7} style={styles.notifWrapper}>
                <GlassCard
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: notif.isRead
                        ? colors.surface
                        : colors.background,
                      borderColor: notif.isRead
                        ? colors.glassBorder
                        : Theme.colors.primary + "30",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.notifContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: notif.isRead
                            ? colors.background
                            : Theme.colors.primary + "10",
                        },
                      ]}
                    >
                      {getIcon(notif.type)}
                    </View>
                    <View style={styles.textContent}>
                      <View style={styles.notifHeader}>
                        <Text
                          style={[styles.notifTitle, { color: colors.text }]}
                        >
                          {notif.title}
                        </Text>
                        {!notif.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text
                        style={[
                          styles.notifMessage,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={2}
                      >
                        {notif.message}
                      </Text>
                      <View style={styles.timeRow}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text
                          style={[styles.timeText, { color: colors.textMuted }]}
                        >
                          {notif.time || "recently"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </ReanimatedAnimated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surface },
              ]}
            >
              <Bell size={40} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications yet
            </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
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
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
