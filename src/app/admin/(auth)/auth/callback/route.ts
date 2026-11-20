import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Handles invite / password-reset / magic links from Supabase Auth emails. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/admin";
  const next = rawNext.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";
  const supabase = await createSupabaseServerClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  if (!ok) return NextResponse.redirect(`${origin}/admin/login?error=link`);
  const dest = type === "invite" || type === "recovery" ? "/admin/auth/set-password" : next;
  return NextResponse.redirect(`${origin}${dest}`);
}
