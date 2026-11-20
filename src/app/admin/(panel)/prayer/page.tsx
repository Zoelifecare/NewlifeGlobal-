import Link from "next/link";
import { Lock } from "lucide-react";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, StatusBadge, fmtDate, inputCls } from "@/components/admin/ui";

const STATUSES = ["new", "praying", "followed_up", "answered", "archived"];

export default async function PrayerList({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireCapability("prayer");
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("prayer_requests").select("id, name, request, may_contact, status, created_at").order("created_at", { ascending: false }).limit(300);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  else q = q.neq("status", "archived");
  const { data } = await q;
  return (
    <>
      <PageTitle title="Prayer requests" description="Confidential. Visible only to super admins and staff on the prayer team. Never share outside the pastoral team." />
      <p className="mb-5 flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm text-muted"><Lock className="h-4 w-4 text-blue-deep" aria-hidden />Access is enforced by database security. Every change is recorded in the audit log (without the request text).</p>
      <form className="mb-5 flex gap-2">
        <select name="status" defaultValue={sp.status ?? ""} className={`${inputCls} w-auto`} aria-label="Status">
          <option value="">Open requests</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button type="submit" className="rounded-md border border-line bg-white px-4 text-sm font-semibold hover:bg-mist">Filter</button>
      </form>
      {!data?.length ? <EmptyState title="No prayer requests" text="New requests from the website appear here." /> : (
        <Card>
          <ul>
            {data.map((p) => (
              <li key={p.id} className="border-b border-line last:border-0">
                <Link href={`/admin/prayer/${p.id}`} className="grid gap-1 px-5 py-4 hover:bg-[#f7f9fc] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{p.name || "Anonymous"} {p.may_contact && <span className="ml-1 text-xs font-normal text-blue-deep">· may contact</span>}</span>
                    <span className="block truncate text-sm text-muted">{p.request}</span>
                  </span>
                  <span className="flex items-center gap-3"><StatusBadge status={p.status} /><span className="text-xs text-muted">{fmtDate(p.created_at, true)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
