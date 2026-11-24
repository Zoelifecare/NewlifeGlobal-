"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminUrl } from "@/lib/site-url";

export interface AuthState { error?: string; message?: string }

function safeNext(next: unknown) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/admin") && !n.startsWith("//") ? n : "/admin";
}

export async function signIn(_prev: AuthState | null, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "The database is not connected yet." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Generic message: never reveal whether an account exists.
  if (error) return { error: error.status === 429 ? "Too many attempts. Please wait a few minutes." : "Incorrect email or password." };
  redirect(safeNext(fd.get("next")));
}

export async function requestPasswordReset(_prev: AuthState | null, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "The database is not connected yet." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  const origin = adminUrl();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/admin/auth/callback?next=/admin/auth/set-password` });
  return { message: "If that email belongs to a staff account, a reset link is on its way." };
}

export async function setPassword(_prev: AuthState | null, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The passwords don't match." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Could not update the password. The link may have expired — request a new one." };
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
