import type { Env } from "./env";

type FirebaseTokenPayload = {
  user_id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
};

function b64urlToUint8(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += "=".repeat(pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToJson(s: string) { return JSON.parse(new TextDecoder().decode(b64urlToUint8(s))); }

let jwksCache: { keys: any[]; exp: number } | null = null;
async function getGoogleJwks() {
  const now = Date.now();
  if (jwksCache && jwksCache.exp > now) return jwksCache.keys;
  const res = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", { cf: { cacheTtl: 3600, cacheEverything: true } } as any);
  if (!res.ok) throw new Error("JWKS_FETCH_FAILED");
  const data: any = await res.json();
  jwksCache = { keys: data.keys || [], exp: now + 55 * 60 * 1000 };
  return jwksCache.keys;
}

export async function verifyFirebaseIdToken(token: string, env: Env): Promise<FirebaseTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = b64urlToJson(parts[0]);
    const payload = b64urlToJson(parts[1]) as FirebaseTokenPayload;
    const projectId = env.FIREBASE_PROJECT_ID;
    if (!projectId) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub) return null;
    if (payload.exp && payload.exp < now - 60) return null;
    if (payload.iat && payload.iat > now + 300) return null;

    const keys = await getGoogleJwks();
    const jwk = keys.find((k: any) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = b64urlToUint8(parts[2]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig as any, data);
    return ok ? payload : null;
  } catch {
    return null;
  }
}
