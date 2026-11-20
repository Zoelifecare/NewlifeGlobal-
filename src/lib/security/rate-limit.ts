import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Hash the client IP (never stored in clear) with a server-side salt. */
export function clientKey(headers: Headers, scope: string) {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "nlg-dev-salt";
  return `${scope}:${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)}`;
}

/** Database-backed fixed-window limiter (public.check_rate_limit). Returns true when allowed. */
export async function allowRequest(db: SupabaseClient, key: string, max: number, windowSeconds: number) {
  const { data, error } = await db.rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) throw new Error(`rate limit check failed: ${error.message}`);
  return data === true;
}

/** Minimum time a human needs to fill a form (ms). */
export const MIN_FILL_MS = 2500;
