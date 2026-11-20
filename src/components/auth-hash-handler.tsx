"use client";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Supabase dashboard emails (magic link, recovery, invite with default templates) land on the Site URL with
 * the session in the URL hash (#access_token=…&refresh_token=…&type=…), which the server never sees.
 * This picks it up on any page, stores the session cookie, clears the hash and sends staff to the admin.
 */
export function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || (!hash.includes("access_token=") && !hash.includes("error_code="))) return;
    const p = new URLSearchParams(hash.slice(1));
    if (p.get("error_code")) {
      window.location.replace(`/admin/login?error=${p.get("error_code") === "otp_expired" ? "expired" : "link"}`);
      return;
    }
    const access_token = p.get("access_token"), refresh_token = p.get("refresh_token"), type = p.get("type");
    if (!access_token || !refresh_token) return;
    getSupabaseBrowserClient().auth.setSession({ access_token, refresh_token }).then(({ error }: { error: unknown }) => {
      if (error) return window.location.replace("/admin/login?error=link");
      window.location.replace(type === "recovery" || type === "invite" ? "/admin/auth/set-password" : "/admin");
    });
  }, []);
  return null;
}
