import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { isPremiumUserEmail } from './entitlements';
import { UserStorage } from './storage';
import { API_CONFIG } from '@/constants/config';
import { RemoteConfigService } from './remote-config';

export const FREE_EXPORT_LIMIT = 2;
export const FREE_ATS_SCAN_LIMIT = 2;

const STORAGE_KEY_EXPORTS = 'app_free_export_count_v2';
const STORAGE_KEY_ATS_SCANS = 'app_free_ats_scan_count_v2';
const STORAGE_KEY_PRO_OVERRIDE = 'app_pro_subscription_active_v2';

/** Check if user currently has Pro / Unlimited access */
export async function isProUser(): Promise<boolean> {
  try {
    // 1. Check local pro override
    const override = await AsyncStorage.getItem(STORAGE_KEY_PRO_OVERRIDE);
    if (override === 'true') return true;

    // 2. Check cached auth user
    const rawAuth = await AsyncStorage.getItem('auth_user_v1');
    if (rawAuth) {
      const u = JSON.parse(rawAuth);
      if (u.isPro || u.isPremium) return true;
      if (isPremiumUserEmail(u.email)) return true;
      if ((u.resumeLimit ?? 0) >= 999999) return true;
    }

    // 3. Check cached resume limit
    const cachedLimit = await AsyncStorage.getItem('cached_resume_limit');
    if (cachedLimit && parseInt(cachedLimit, 10) >= 999999) return true;

    // 4. Check firebase user cached profile if available
    try {
      const { auth } = require('./firebase');
      const u = auth?.currentUser;
      if (u) {
        if (isPremiumUserEmail(u.email)) return true;
        const cachedProf = await AsyncStorage.getItem(`user_profile_${u.uid}`);
        if (cachedProf) {
          const p = JSON.parse(cachedProf);
          if (p.isPro || p.isPremium || (p.resumeLimit ?? 0) >= 999999) return true;
        }
      }
    } catch {}
  } catch (e) {
    console.log('Error checking pro status:', e);
  }
  return false;
}

export async function setProUser(active: boolean) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PRO_OVERRIDE, active ? 'true' : 'false');
  } catch {}
}

/** Check if export is allowed */
export async function canExportResume(): Promise<{ allowed: boolean; count: number; limit: number; isPro: boolean }> {
  const pro = await isProUser();
  if (pro) {
    return { allowed: true, count: 0, limit: 999999, isPro: true };
  }
  const raw = await AsyncStorage.getItem(STORAGE_KEY_EXPORTS);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  return {
    allowed: count < FREE_EXPORT_LIMIT,
    count,
    limit: FREE_EXPORT_LIMIT,
    isPro: false,
  };
}

/** Increment export count */
export async function recordResumeExport(): Promise<number> {
  const pro = await isProUser();
  if (pro) return 0;
  const raw = await AsyncStorage.getItem(STORAGE_KEY_EXPORTS);
  const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
  await AsyncStorage.setItem(STORAGE_KEY_EXPORTS, String(next));
  return next;
}

/** Check if ATS scan is allowed */
export async function canPerformAtsScan(): Promise<{ allowed: boolean; count: number; limit: number; isPro: boolean }> {
  const pro = await isProUser();
  if (pro) {
    return { allowed: true, count: 0, limit: 999999, isPro: true };
  }
  const raw = await AsyncStorage.getItem(STORAGE_KEY_ATS_SCANS);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  return {
    allowed: count < FREE_ATS_SCAN_LIMIT,
    count,
    limit: FREE_ATS_SCAN_LIMIT,
    isPro: false,
  };
}

/** Increment ATS scan count */
export async function recordAtsScan(): Promise<number> {
  const pro = await isProUser();
  if (pro) return 0;
  const raw = await AsyncStorage.getItem(STORAGE_KEY_ATS_SCANS);
  const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
  await AsyncStorage.setItem(STORAGE_KEY_ATS_SCANS, String(next));
  return next;
}

/** Check if any valid AI API key is configured */
export async function hasConfiguredAiApiKey(): Promise<boolean> {
  try {
    // 1. User keys in storage
    const groqKey = await UserStorage.getGroqKey();
    if (groqKey && !groqKey.startsWith('YOUR_') && groqKey.trim().length > 5) return true;

    const geminiKey = await UserStorage.getGeminiKey();
    if (geminiKey && !geminiKey.startsWith('YOUR_') && geminiKey.trim().length > 5) return true;

    const openRouter = await UserStorage.getOpenRouterKey();
    if (openRouter && !openRouter.startsWith('YOUR_') && openRouter.trim().length > 5) return true;

    const cerebras = await UserStorage.getCerebrasKey();
    if (cerebras && !cerebras.startsWith('YOUR_') && cerebras.trim().length > 5) return true;

    // 2. Remote / system keys
    try {
      const remote = await RemoteConfigService.getKeys();
      if (remote.groq_key && !remote.groq_key.startsWith('YOUR_') && remote.groq_key.trim().length > 5) return true;
      if (remote.gemini_key && !remote.gemini_key.startsWith('YOUR_') && remote.gemini_key.trim().length > 5) return true;
    } catch {}

    if (API_CONFIG.GROQ_API_KEY && !API_CONFIG.GROQ_API_KEY.startsWith('YOUR_') && API_CONFIG.GROQ_API_KEY.trim().length > 5) return true;
    if (API_CONFIG.GEMINI_API_KEY && !API_CONFIG.GEMINI_API_KEY.startsWith('YOUR_') && API_CONFIG.GEMINI_API_KEY.trim().length > 5) return true;
  } catch (e) {
    console.log('Error checking AI key:', e);
  }
  return false;
}

/** UI Alert Prompts */
export function promptPremiumForExport(currentCount: number = FREE_EXPORT_LIMIT) {
  Alert.alert(
    "Free Export Limit Reached (2/2) 🔒",
    `Free accounts can export up to ${FREE_EXPORT_LIMIT} resumes.\n\nUpgrade to Elite Pro to unlock Unlimited PDF Exports, ATS Scans, and all Premium templates!`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upgrade to Pro 👑",
        style: "default",
        onPress: () => {
          router.push({ pathname: '/(tabs)/profile', params: { modal: 'Premium' } });
        },
      },
    ]
  );
}

export function promptPremiumForAts(currentCount: number = FREE_ATS_SCAN_LIMIT) {
  Alert.alert(
    "Free ATS Scan Limit Reached (2/2) 🔒",
    `You have used your ${FREE_ATS_SCAN_LIMIT} free ATS scans.\n\nUpgrade to Elite Pro for Unlimited ATS Scans, keyword matchers, and neural tailoring!`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upgrade to Pro 👑",
        style: "default",
        onPress: () => {
          router.push({ pathname: '/(tabs)/profile', params: { modal: 'Premium' } });
        },
      },
    ]
  );
}

export function promptMissingApiKey() {
  Alert.alert(
    "AI API Key Required 🔑",
    "To use AI resume scanning & tailoring, please configure your free Groq or Google Gemini API key.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Configure API Key ⚙️",
        style: "default",
        onPress: () => {
          router.push({ pathname: '/(tabs)/profile', params: { modal: 'API Configuration' } });
        },
      },
    ]
  );
}

