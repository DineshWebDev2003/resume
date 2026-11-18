import type { MiddlewareHandler } from "hono";
import type { Env } from "../lib/env";
import { createAuth } from "../lib/auth";
import { verifyFirebaseIdToken } from "../lib/firebaseAuth";
import { ensureAppProfile } from "../lib/db";

type AuthEnv = Env & { MIGRATION_BEARER_TOKEN?: string; MIGRATION_USER_ID?: string };

/**
 * Auth resolution:
 * 1) Firebase ID token (primary, for existing Firebase/Google login)
 * 2) Better Auth session (optional)
 * 3) Explicit migration test token ONLY when both env vars set
 * Default fail-closed.
 */
export const authContext: MiddlewareHandler<{ Bindings: AuthEnv; Variables: { user: any | null } }> = async (c, next) => {
  c.set("user", null);
  const authHeader = c.req.header("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (bearer) {
    const fb = await verifyFirebaseIdToken(bearer, c.env);
    if (fb?.sub) {
      const user = { id: fb.sub, email: fb.email ?? null, name: fb.name ?? null, picture: fb.picture ?? null, provider: "firebase" };
      try { await ensureAppProfile(c.env.DB, user.id, user.email, user.name); } catch {}
      c.set("user", user);
      await next();
      return;
    }
  }

  const auth = createAuth(c.env);
  if (auth) {
    try {
      const session = await (auth.api as any).getSession({ headers: c.req.raw.headers });
      const u = session?.user;
      if (u?.id) c.set("user", { id: String(u.id), email: u.email ?? null, name: u.name ?? null, provider: "better-auth" });
    } catch {}
  }

  if (!c.get("user") && bearer && c.env.MIGRATION_BEARER_TOKEN && c.env.MIGRATION_USER_ID && bearer === c.env.MIGRATION_BEARER_TOKEN) {
    c.set("user", { id: c.env.MIGRATION_USER_ID, email: null, name: "Migration User", provider: "migration" });
  }
  await next();
};
