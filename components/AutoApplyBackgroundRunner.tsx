import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAutoApplySettings } from '@/hooks/use-auto-apply';
import { auth } from '@/services/firebase';
import { runBackgroundAutoApplyPass } from '@/services/autoApplyBackground';
import {
  clearAutoApplyNotification,
  ensureNotifierSetup,
  refreshAutoApplyNotification,
} from '@/services/autoApplyNotifier';

const FIRST_RUN_DELAY = 20_000;
const INTERVAL = 10 * 60_000;
const MIN_GAP = 5 * 60_000; // never run two passes closer than this (re-arm safe)
let lastPassAt = 0;

/**
 * Invisible runner — mount once at root. While Auto Apply is ON it runs a
 * tracked pass on mount + every 10 min (foreground or backgrounded app).
 * Every step logs [AutoApply BG] to the console. Force-killed apps need a
 * native module (expo-background-fetch + EAS build) — not included here.
 */
export default function AutoApplyBackgroundRunner() {
  const { settings } = useAutoApplySettings();
  const router = useRouter();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const runningRef = useRef(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      if ((res.notification.request.content.data as any)?.screen === 'auto-apply-settings') {
        router.push('/auto-apply-settings' as any);
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let first: ReturnType<typeof setTimeout> | null = null;

    const tick = async (why: string) => {
      const s = settingsRef.current;
      if (!s.enabled || s.paused || !auth.currentUser || runningRef.current) return;
      if (AppState.currentState !== 'active') {
        console.log('[AutoApply BG] Tick skipped: app not active.');
        return;
      }
      if (Date.now() - lastPassAt < MIN_GAP) {
        console.log('[AutoApply BG] Tick skipped: recent pass already done.');
        return;
      }
      runningRef.current = true;
      try {
        console.log(`[AutoApply BG] Tick (${why}).`);
        await refreshAutoApplyNotification('scanning');
        await runBackgroundAutoApplyPass(s);
        lastPassAt = Date.now();
        await refreshAutoApplyNotification('done');
      } catch (e: any) {
        console.log('[AutoApply BG] Pass crashed:', e?.message || e);
      } finally {
        runningRef.current = false;
      }
    };

    if (settings.enabled && !settings.paused) {
      console.log('[AutoApply BG] Runner armed (first pass in 20s, then every 10 min).');
      ensureNotifierSetup().then((ok) => {
        if (ok) refreshAutoApplyNotification('idle');
      });
      first = setTimeout(() => tick('initial'), FIRST_RUN_DELAY);
      timer = setInterval(() => tick('interval'), INTERVAL);
    } else {
      console.log('[AutoApply BG] Runner idle (Auto Apply OFF or paused).');
      clearAutoApplyNotification();
    }
    return () => {
      if (first) clearTimeout(first);
      if (timer) clearInterval(timer);
    };
  }, [settings.enabled, settings.paused]);

  return null;
}
