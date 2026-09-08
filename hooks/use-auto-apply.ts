/**
 * Auto Apply settings hook — Firestore is the source of truth,
 * AsyncStorage is a per-user offline cache.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import {
  getAutoApplySettings,
  saveAutoApplySettings,
} from '@/services/firestore';
import { DEFAULT_AUTO_APPLY_SETTINGS } from '@/constants/autoApply';
import type { AutoApplySettings } from '@/constants/autoApply';

const cacheKey = () => {
  const uid = (auth as any)?.currentUser?.uid || 'anon';
  return `auto_apply_settings_${uid}`;
};

export function useAutoApplySettings() {
  const [settings, setSettings] = useState<AutoApplySettings>(
    DEFAULT_AUTO_APPLY_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await AsyncStorage.getItem(cacheKey());
      if (cached) {
        setSettings({ ...DEFAULT_AUTO_APPLY_SETTINGS, ...JSON.parse(cached) });
        setLoading(false);
      }
    } catch {}
    // Skip remote load when logged out (cold start before auth restores).
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const remote = await getAutoApplySettings();
      setSettings(remote);
      await AsyncStorage.setItem(cacheKey(), JSON.stringify(remote)).catch(
        () => {},
      );
    } catch (e) {
      console.warn('[AutoApply] Settings load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-load once auth resolves — fixes cold-start race where settings
  // loaded pre-login and stayed OFF forever.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth as any, (user) => {
      if (user) {
        console.log('[AutoApply] Auth resolved, reloading settings.');
        refresh();
      }
    });
    return unsub;
  }, [refresh]);

  const update = useCallback(
    async (patch: Partial<AutoApplySettings>) => {
      const optimistic = { ...settings, ...patch };
      // Enforce: max 3 roles.
      if (optimistic.roles) optimistic.roles = optimistic.roles.filter(Boolean).slice(0, 3);
      setSettings(optimistic);
      setSaving(true);
      try {
        const saved = await saveAutoApplySettings(patch);
        setSettings(saved);
        await AsyncStorage.setItem(cacheKey(), JSON.stringify(saved)).catch(
          () => {},
        );
        return saved;
      } catch (e) {
        console.warn('[AutoApply] Settings save failed:', e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [settings],
  );

  const toggleEnabled = useCallback(
    (on: boolean) => update({ enabled: on, paused: on ? false : settings.paused }),
    [update, settings.paused],
  );

  return { settings, loading, saving, update, toggleEnabled, refresh };
}
