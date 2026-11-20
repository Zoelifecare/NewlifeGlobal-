import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; error?: string }> }) {
  if (!isSupabaseConfigured) redirect("/admin/setup");
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Staff sign in</h1>
      <p className="mb-8 mt-2 text-sm text-muted">For authorised New Life Global staff only.</p>
      {sp.error && (
        <p role="alert" className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {sp.error === "expired" ? "That email link has expired or was already used. Request a new one below." : "That sign-in link didn't work. Request a new one below."}
        </p>
      )}
      <LoginForm next={sp.next ?? "/admin"} startWithReset={sp.reset === "1"} />
    </>
  );
}
