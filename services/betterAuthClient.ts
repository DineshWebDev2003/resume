import { API_CONFIG } from "@/constants/config";

function baseUrl() {
  return (API_CONFIG.CLOUDFLARE_API_BASE_URL || "").replace(/\/$/, "");
}

function authBase() {
  return `${baseUrl()}/api/auth`;
}

async function authFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${authBase()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `Auth request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function betterAuthGetSession() {
  return authFetch("/get-session", { method: "GET" });
}

export async function betterAuthSignUpEmail(email: string, password: string, name: string) {
  return authFetch("/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function betterAuthSignInEmail(email: string, password: string) {
  return authFetch("/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function betterAuthSignOut() {
  return authFetch("/sign-out", { method: "POST", body: JSON.stringify({}) });
}

export async function betterAuthGoogleSignIn() {
  // For native/Expo, Better Auth's social flow may need provider-specific redirect/expo-linking handling.
  // This calls the standard endpoint shape; adjust to the exact Better Auth version response/redirect.
  return authFetch("/sign-in/social", {
    method: "POST",
    body: JSON.stringify({ provider: "google", callbackURL: `${baseUrl()}/auth/callback` }),
  });
}
