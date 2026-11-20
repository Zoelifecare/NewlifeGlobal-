import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/** Cookie-aware client for Server Components, Server Actions and Route Handlers (acts as the signed-in user). */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; the proxy refreshes the session.
        }
      },
    },
  });
}

/** Anonymous client with no cookies — for cached public reads and public form inserts. */
export function createSupabaseAnonClient() {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  return createPlainClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
