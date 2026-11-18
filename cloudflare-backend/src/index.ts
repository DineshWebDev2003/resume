import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./lib/env";
import { authContext } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { createGraphQLYoga } from "./graphql/server";

type AppVars = { user: { id: string } | null };
const app = new Hono<{ Bindings: Env; Variables: AppVars }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*", // tighten to app origins in production
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use("*", authContext);

app.get("/", (c) => c.json({ ok: true, service: "resume-ats-cloudflare-backend", mode: "no-r2-d1-graphql" }));
app.get("/health", (c) => c.json({ ok: true }));

app.route("/", authRoutes);
app.route("/", adminRoutes);

app.on(["GET", "POST", "OPTIONS"], "/graphql", async (c) => {
  const user = c.get("user") as any;
  const yoga = createGraphQLYoga(c.env, user?.id ?? null, user, c.req.raw);
  return yoga.fetch(c.req.raw, { env: c.env });
});

export default {
  fetch: app.fetch,
};
