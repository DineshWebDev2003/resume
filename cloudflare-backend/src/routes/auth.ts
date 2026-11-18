import { Hono } from "hono";
import type { Env } from "../lib/env";
import { createAuth } from "../lib/auth";

export const authRoutes = new Hono<{ Bindings: Env }>();

async function handle(c: any) {
  const auth = createAuth(c.env);
  if (!auth) {
    return c.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "Better Auth is not configured. Set BETTER_AUTH_SECRET and BETTER_AUTH_URL.",
        },
      },
      501,
    );
  }
  return auth.handler(c.req.raw);
}

// Better Auth default basePath is /api/auth/*; also accept /auth/* for flexibility.
authRoutes.on(["GET", "POST"], "/api/auth/*", handle);
authRoutes.on(["GET", "POST"], "/auth/*", handle);
