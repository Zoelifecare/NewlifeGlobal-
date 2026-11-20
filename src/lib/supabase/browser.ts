"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client (anon key + the user's own session cookie). Used by admin uploads and login. */
export function getSupabaseBrowserClient() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
