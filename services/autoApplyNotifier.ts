import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { MAX_AUTO_APPLY_PER_DAY } from '@/constants/autoApply';
import { getAutoApplyRecords } from './firestore';

const STATUS_ID = 'auto-apply-status';
const CHANNEL_ID = 'auto-apply';

let setupDone = false;

/** Handler + channel + permission. Idempotent, safe to call often. */
export async function ensureNotifierSetup(): Promise<boolean> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Auto Apply status',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#8b5cf6',
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') {
        console.log('[AutoApply Notify] Permission denied — status bar card off.');
        return false;
      }
    }
    setupDone = true;
    return true;
  } catch (e: any) {
    console.log('[AutoApply Notify] Setup failed:', e?.message || e);
    return false;
  }
}

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
 * Attractive persistent status-bar card, exactly like a push notification:
 * sticky (non-swipeable), updated in place by stable identifier.
 */
export async function refreshAutoApplyNotification(
  phase: 'scanning' | 'idle' | 'done' = 'idle',
): Promise<void> {
  try {
    const ok = setupDone ? true : await ensureNotifierSetup();
    if (!ok) return;
    const records: any[] = await getAutoApplyRecords().catch(() => []);
    const matched = records.filter((r) => r.status === 'Matched').length;
    const appliedList = records.filter((r) => r.status === 'Applied');
    const today = appliedList.filter((r) => r.appliedAt && isToday(r.appliedAt)).length;
    const title =
      phase === 'scanning' ? '⚡ Auto Apply scanning…' : '⚡ Auto Apply running';
    await Notifications.scheduleNotificationAsync({
      identifier: STATUS_ID,
      content: {
        title,
        body:
          `${matched} matched • ${appliedList.length} applied • ` +
          `${today}/${MAX_AUTO_APPLY_PER_DAY} today`,
        data: { screen: 'auto-apply-settings' },
        sticky: true,
        autoDismiss: false,
        color: '#8b5cf6',
      },
      trigger: null,
    });
    console.log('[AutoApply Notify] Status card updated.');
  } catch (e: any) {
    console.log('[AutoApply Notify] Update failed:', e?.message || e);
  }
}

/** Remove the status-bar card (Auto Apply OFF / logged out). */
export async function clearAutoApplyNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(STATUS_ID);
  } catch {}
}
