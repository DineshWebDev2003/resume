import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Env } from "./env";

let _auth: ReturnType<typeof betterAuth> | null = null;
let _key = "";

/**
 * Self-hosted Better Auth on Cloudflare Workers + D1.
 *
 * Notes:
 * - Requires dependencies installed in cloudflare-backend (`npm install`): better-auth, kysely, kysely-d1.
 * - D1 migrations must include Better Auth tables (run Better Auth CLI migrate for your version if schema differs).
 * - Auth routes are mounted at /api/auth/* and /auth/* (see routes/auth.ts).
 * - For existing Firebase users (0 currently reported), use fresh Better Auth accounts or implement account linking.
 */
export function createAuth(env: Env) {
  if (!env.BETTER_AUTH_SECRET || !env.BETTER_AUTH_URL) return null;
  const key = `${env.BETTER_AUTH_URL}|${env.BETTER_AUTH_SECRET}|${env.GOOGLE_CLIENT_ID ?? ""}`;
  if (_auth && _key === key) return _auth;

  const db = new Kysely<any>({ dialect: new D1Dialect({ database: env.DB }) });

  _auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: {
      db,
      type: "sqlite",
    } as any,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : undefined,
    trustedOrigins: [env.BETTER_AUTH_URL, "exp://", "resume://", "http://localhost:8081", "http://127.0.0.1:8081"],
  } as any);
  _key = key;
  return _auth;
}

export async function getSessionUser(auth: ReturnType<typeof createAuth>, request: Request): Promise<{ id: string } | null> {
  if (!auth) return null;
  try {
    const session = await (auth.api as any).getSession({ headers: request.headers });
    const id = session?.user?.id ?? session?.session?.userId;
    return id ? { id: String(id) } : null;
  } catch {
    return null;
  }
}
