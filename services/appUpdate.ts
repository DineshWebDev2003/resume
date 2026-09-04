/**
 * In-app updates — two channels:
 * 1. OTA (EAS Update): JS-only fixes, applied in seconds, no store visit.
 *    Needs `npx expo install expo-updates` + a dev/prod rebuild once.
 * 2. Store version: native bumps (versionCode) checked against a Firestore
 *    doc you control: settings/app_config { latestVersion, storeUrl }.
 * Both degrade gracefully when the native module / doc is missing.
 */
import Constants from 'expo-constants';
import { Linking } from 'react-native';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export type UpdateKind = 'ota' | 'store';

export interface UpdateInfo {
  kind: UpdateKind;
  /** e.g. "1.0.3" (store) or the OTA update id (truncated for display). */
  version?: string;
}

const currentVersion = (): string =>
  Constants.expoConfig?.version || '1.0.0';

function isNewer(remote: string, local: string): boolean {
  const pa = remote.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = local.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const a = pa[i] || 0;
    const b = pb[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

function loadUpdatesModule(): any | null {
  try {
    // Dynamic require: Expo Go / builds without expo-updates won't crash.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-updates');
  } catch {
    return null;
  }
}

/** OTA check — silent null when unsupported or up to date. */
export async function checkOtaUpdate(): Promise<UpdateInfo | null> {
  try {
    const Updates = loadUpdatesModule();
    if (!Updates?.checkForUpdateAsync) return null;
    if (__DEV__) return null; // OTA never applies in dev — skip noise.
    const res = await Updates.checkForUpdateAsync();
    if (res?.isAvailable) return { kind: 'ota' };
  } catch (e) {
    console.log('[Update] OTA check failed:', e);
  }
  return null;
}

/** Downloads + restarts into the OTA update ("Apply Update" button). */
export async function applyOtaUpdate(): Promise<void> {
  const Updates = loadUpdatesModule();
  if (!Updates?.fetchUpdateAsync) {
    throw new Error('Update module not available in this build.');
  }
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
}

/** Store check via Firestore settings/app_config (you edit this per release). */
export async function checkStoreUpdate(): Promise<(UpdateInfo & { storeUrl: string }) | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'app_config'));
    if (!snap.exists()) return null;
    const cfg = snap.data() as any;
    const latest = String(cfg.latestVersion || '');
    if (!latest || !isNewer(latest, currentVersion())) return null;
    return {
      kind: 'store',
      version: latest,
      storeUrl:
        cfg.storeUrl ||
        'https://play.google.com/store/apps/details?id=com.resumeelite.app',
    };
  } catch (e) {
    console.log('[Update] Store check failed:', e);
    return null;
  }
}

export async function openStore(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.log('[Update] openStore failed:', e);
  }
}

/** OTA first (one-tap apply), store version second. Returns the winner. */
export async function checkForAppUpdate(): Promise<(UpdateInfo & { storeUrl?: string }) | null> {
  const ota = await checkOtaUpdate();
  if (ota) return ota;
  return await checkStoreUpdate();
}
