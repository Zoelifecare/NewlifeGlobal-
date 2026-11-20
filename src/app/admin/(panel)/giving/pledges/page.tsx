import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, btnSecondary, fmtDate, inputCls } from "@/components/admin/ui";
import { Figure, Pill } from "@/components/admin/finance-fields";
import { ActionButton } from "@/components/admin/finance-ui";
import { markPastDue } from "@/lib/admin/finance-actions";
import { FREQ_LABEL, PLEDGE_STATUSES, PLEDGE_STATUS_LABEL, money } from "@/lib/admin/finance-constants";

export default async function Pledges({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; frequency?: string }> }) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("pledges").select("id, reference, donor_name, donor_email, amount, fulfilled_amount, frequency, status, expected_by, created_at, designation:giving_designations(name)").order("created_at", { ascending: false }).limit(500);
  if (sp.status && (PLEDGE_STATUSES as readonly string[]).includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.frequency && sp.frequency in FREQ_LABEL) q = q.eq("frequency", sp.frequency);
  const term = sp.q?.trim().replace(/[%,()]/g, "").slice(0, 60);
  if (term) q = q.or(`reference.ilike.%${term}%,donor_name.ilike.%${term}%,donor_email.ilike.%${term}%`);
  const { data } = await q;
  const rows = (data ?? []) as unknown as { id: string; reference: string; donor_name: string; donor_email: string; amount: number; fulfilled_amount: number; frequency: string; status: string; expected_by: string | null; created_at: string; designation: { name: string } | null }[];
  const live = rows.filter((r) => r.status !== "cancelled");
  const pledged = live.reduce((a, r) => a + Number(r.amount), 0);
  const fulfilled = live.reduce((a, r) => a + Math.min(Number(r.fulfilled_amount), Number(r.amount)), 0);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageTitle title="Pledges" description="Commitments to give. A pledge is never counted as money received: it is fulfilled only by confirmed donations linked to it."
        actions={<><ActionButton run={markPastDue} label="Mark overdue as past due" /><a href={`/admin/giving/export?type=pledges${qs ? `&${qs}` : ""}`} className={btnSecondary}>Export CSV</a></>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Figure tone="pledged" label="Pledged (shown)" value={money(pledged)} sub={`${live.length} pledges, cancelled excluded`} />
        <Figure tone="confirmed" label="Fulfilled by donations" value={money(fulfilled)} />
        <Figure tone="pledged" label="Remaining" value={money(pledged - fulfilled)} />
      </div>
      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Reference, name or email" aria-label="Search" className={`${inputCls} w-60`} />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className={`${inputCls} w-auto`}><option value="">All statuses</option>{PLEDGE_STATUSES.map((s) => <option key={s} value={s}>{PLEDGE_STATUS_LABEL[s]}</option>)}</select>
        <select name="frequency" defaultValue={sp.frequency ?? ""} aria-label="Frequency" className={`${inputCls} w-auto`}><option value="">Any frequency</option>{Object.entries(FREQ_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button type="submit" className={btnSecondary}>Filter</button>
      </form>
      {!rows.length ? <EmptyState title="No pledges" text="Pledges made on the Giving page appear here." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-line bg-[#f7f9fc] text-left text-xs uppercase tracking-[0.08em] text-muted">
              <tr><th className="px-4 py-2.5">Pledge</th><th className="px-4 py-2.5">Donor</th><th className="px-4 py-2.5">Frequency</th><th className="px-4 py-2.5">Expected</th><th className="px-4 py-2.5">Progress</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const pct = Math.min(100, Math.round((Number(p.fulfilled_amount) / Number(p.amount)) * 100));
                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-[#f7f9fc]">
                    <td className="px-4 py-3"><Link href={`/admin/giving/pledges/${p.id}`} className="font-mono text-xs font-semibold text-blue-deep hover:underline">{p.reference}</Link><span className="block text-xs text-muted">{fmtDate(p.created_at)} · {p.designation?.name ?? "General"}</span></td>
                    <td className="px-4 py-3">{p.donor_name}<span className="block text-xs text-muted">{p.donor_email}</span></td>
                    <td className="px-4 py-3">{FREQ_LABEL[p.frequency]}</td>
                    <td className="px-4 py-3">{p.expected_by ? fmtDate(p.expected_by) : "—"}</td>
                    <td className="w-56 px-4 py-3">
                      <span className="flex justify-between text-xs tabular-nums"><span>{money(p.fulfilled_amount)}</span><span className="text-muted">of {money(p.amount)}</span></span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% fulfilled`}><span className="block h-full bg-blue-deep" style={{ width: `${pct}%` }} /></span>
                    </td>
                    <td className="px-4 py-3"><Pill status={p.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
