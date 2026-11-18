import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function jsonError(c: Context, status: ContentfulStatusCode, message: string, code = "ERROR") {
  return c.json({ error: { code, message } }, status);
}

export function getAuthUserId(c: Context): string | null {
  const user = c.get("user") as { id?: string } | undefined;
  return user?.id ?? null;
}
