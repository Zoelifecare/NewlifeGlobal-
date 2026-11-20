import Link from "next/link";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, fmtDate } from "@/components/admin/ui";

const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; table?: string }> }) {
  await requireCapability("admin");
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page) || 0);
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (sp.table && /^[a-z_]+$/.test(sp.table)) q = q.eq("table_name", sp.table);
  const { data, count } = await q;
  const ids = [...new Set((data ?? []).map((a) => a.actor_id).filter(Boolean))];
  const { data: actors } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const who = (id: string | null) => { const p = (actors ?? []).find((a) => a.id === id); return p?.full_name || p?.email || "Unknown"; };
  const last = Math.max(0, Math.ceil((count ?? 0) / PAGE) - 1);
  return (
    <>
      <PageTitle title="Audit log" description="Every change made in the admin: who, what and when. Private text (prayer requests, messages) is never copied into the log — only which fields changed." />
      {!data?.length ? <EmptyState title="No activity recorded yet" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Changed fields</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(a.created_at, true)}</td>
                  <td className="px-4 py-3">{who(a.actor_id)}</td>
                  <td className="px-4 py-3 capitalize">{a.action}</td>
                  <td className="px-4 py-3"><Link className="text-blue-deep" href={`/admin/audit?table=${a.table_name}`}>{a.table_name.replace(/_/g, " ")}</Link>{a.summary && <span className="block text-xs text-muted">{a.summary}</span>}</td>
                  <td className="px-4 py-3 text-xs text-muted">{a.changed?.join(", ") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <nav aria-label="Pagination" className="mt-4 flex items-center gap-4 text-sm">
        {page > 0 && <Link className="text-blue-deep" href={`/admin/audit?page=${page - 1}${sp.table ? `&table=${sp.table}` : ""}`}>← Newer</Link>}
        <span className="text-muted">Page {page + 1} of {last + 1}</span>
        {page < last && <Link className="text-blue-deep" href={`/admin/audit?page=${page + 1}${sp.table ? `&table=${sp.table}` : ""}`}>Older →</Link>}
      </nav>
    </>
  );
}
