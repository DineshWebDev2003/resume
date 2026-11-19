import { API_CONFIG } from "@/constants/config";
import { cloudflareGraphQL } from "@/services/cloudflareBackend";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppEntitlements = {
  id: string;
  email?: string | null;
  name?: string | null;
  isPro: boolean;
  isPremium: boolean;
  resumeLimit: number;
  plan?: string | null;
  onboardingCompleted?: boolean;
};

export const PREMIUM_EMAILS = [
  "dinesh.mahi.dev@gmail.com",
  "dineshmahi02@gmail.com",
];

export function isPremiumUserEmail(email?: string | null) {
  if (!email) return false;
  return PREMIUM_EMAILS.includes(email.toLowerCase().trim());
}

export function applyLocalPremiumOverride<T extends Partial<AppEntitlements>>(ent: T, email?: string | null): T & AppEntitlements {
  const premium = isPremiumUserEmail(email ?? ent.email);
  return {
    ...ent,
    id: ent.id || "",
    email: email ?? ent.email ?? null,
    isPro: premium ? true : !!ent.isPro,
    isPremium: premium ? true : !!ent.isPremium,
    resumeLimit: premium ? 999999 : (typeof ent.resumeLimit === "number" ? ent.resumeLimit : 3),
    plan: premium ? "premium_unlimited" : (ent.plan ?? "free"),
  } as T & AppEntitlements;
}

export async function getCachedAuthUser() {
  try {
    const raw = await AsyncStorage.getItem("auth_user_v1");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function fetchCloudflareEntitlements(): Promise<AppEntitlements | null> {
  if ((API_CONFIG as any).AUTH_PROVIDER !== "better-auth" && API_CONFIG.API_PROVIDER !== "cloudflare") return null;
  const data = await cloudflareGraphQL<{ me: AppEntitlements | null }>(`
    query Me {
      me { id email name isPro isPremium resumeLimit plan }
    }
  `);
  if (!data.me) return null;
  return applyLocalPremiumOverride(data.me, data.me.email);
}
