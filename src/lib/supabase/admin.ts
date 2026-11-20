import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * SERVICE-ROLE client. Bypasses RLS — use ONLY for super-admin user management
 * (inviting staff, deleting auth users), and only after requireRole('super_admin').
 * The key is read from a non-public env var and this module is server-only.
 */
export function createSupabaseServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const isServiceRoleConfigured = () => Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
