import type { Metadata } from "next";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GivingTabs } from "@/components/admin/giving-tabs";

export const metadata: Metadata = { title: "Giving" };

/** Finance area: super admins and finance managers only (RLS enforces the same rule in the database). */
export default async function GivingLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("finance");
  const supabase = await createSupabaseServerClient();
  const [p, f] = await Promise.all([
    supabase.from("giving_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notification_log").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);
  return (
    <>
      <GivingTabs pending={p.count ?? 0} failed={f.count ?? 0} />
      {(p.error?.code === "42P01" || p.error?.message?.includes("giving_submissions")) && (
        <p role="alert" className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          The giving tables are not in the database yet. Run <code>supabase/migrations/20261121000100_giving.sql</code> in the Supabase SQL editor, then <code>notify pgrst, &apos;reload schema&apos;;</code>
        </p>
      )}
      {children}
    </>
  );
}
