import type { Env } from "./env";

export async function enforceSingleDevice(env: Env, userId: string, email: string | null | undefined, headers: Headers) {
  // Disabled by default. Enable after payment/policy decision: SINGLE_DEVICE_ENFORCEMENT=true
  if ((env as any).SINGLE_DEVICE_ENFORCEMENT !== "true") return { ok: true as const };
  const deviceId = (headers.get("x-device-id") || "").trim();
  if (!deviceId) return { ok: false as const, status: 400, code: "DEVICE_ID_REQUIRED", message: "Device ID required" };

  const now = new Date().toISOString();
  const ip = headers.get("cf-connecting-ip") || null;
  const ua = (headers.get("user-agent") || "").slice(0, 300);

  await env.DB.prepare(
    `INSERT INTO device_registrations (device_id, user_id, email, first_seen_at, last_seen_at, last_ip, user_agent, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
     ON CONFLICT(device_id) DO UPDATE SET user_id=excluded.user_id, email=COALESCE(excluded.email,email), last_seen_at=excluded.last_seen_at, last_ip=excluded.last_ip, user_agent=excluded.user_agent`
  ).bind(deviceId, userId, email ?? null, now, now, ip, ua).run();

  const binding = await env.DB.prepare(`SELECT * FROM account_device_bindings WHERE user_id=?`).bind(userId).first<any>();
  if (!binding) {
    // If any other active account is already bound to this device, block to reduce multi-account abuse on one device.
    const other = await env.DB.prepare(`SELECT user_id FROM account_device_bindings WHERE primary_device_id=? AND user_id!=? LIMIT 1`).bind(deviceId, userId).first<any>();
    if (other) return { ok: false as const, status: 403, code: "DEVICE_ALREADY_BOUND", message: "This device is already linked to another account" };
    await env.DB.prepare(`INSERT INTO account_device_bindings (user_id, primary_device_id, bound_at, updated_at) VALUES (?, ?, ?, ?)`).bind(userId, deviceId, now, now).run();
    return { ok: true as const };
  }

  if (binding.primary_device_id !== deviceId) {
    return { ok: false as const, status: 403, code: "ACCOUNT_DEVICE_MISMATCH", message: "This account is linked to a different device" };
  }
  await env.DB.prepare(`UPDATE account_device_bindings SET updated_at=? WHERE user_id=?`).bind(now, userId).run();
  return { ok: true as const };
}
