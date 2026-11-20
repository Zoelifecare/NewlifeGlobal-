import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, btnPrimary, btnSecondary, fmtDate, inputCls } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/finance-ui";
import { deleteDonation } from "@/lib/admin/finance-actions";
import { DONATION_METHODS, METHOD_LABEL, SOURCE_LABEL, money } from "@/lib/admin/finance-constants";
import { okDate } from "@/lib/admin/finance-loaders";

type Sp = { q?: string; method?: string; source?: string; designation?: string; from?: string; to?: string };

export default async function Donations({ searchParams }: { searchParams: Promise<Sp> }) {
  const [staff, sp] = await Promise.all([requireStaff(), searchParams]);
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("donations").select("*, designation:giving_designations(name), pledge:pledges(id, reference)").order("received_on", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  if (sp.method && (DONATION_METHODS as readonly string[]).includes(sp.method)) q = q.eq("method", sp.method);
  if (sp.source && sp.source in SOURCE_LABEL) q = q.eq("source", sp.source);
  if (sp.designation && /^[0-9a-f-]{36}$/i.test(sp.designation)) q = q.eq("designation_id", sp.designation);
  if (okDate(sp.from)) q = q.gte("received_on", sp.from!);
  if (okDate(sp.to)) q = q.lte("received_on", sp.to!);
  const term = sp.q?.trim().replace(/[%,()]/g, "").slice(0, 60);
  if (term) q = q.or(`reference.ilike.%${term}%,donor_name.ilike.%${term}%,donor_email.ilike.%${term}%,receipt_number.ilike.%${term}%`);
  const [{ data }, { data: designations }] = await Promise.all([q, supabase.from("giving_designations").select("id, name").order("sort_order")]);
  const total = (data ?? []).reduce((a, d) => a + Number(d.amount), 0);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageTitle title="Confirmed donations" description="Money actually received: cash counted by finance, verified Zelle, Cash App or bank transfers, and online gifts. This is the only list that counts as revenue."
        actions={<><a href={`/admin/giving/export?type=donations${qs ? `&${qs}` : ""}`} className={btnSecondary}>Export CSV</a><Link href="/admin/giving/donations/new" className={btnPrimary}>Record a donation</Link></>} />
      <form className="mb-5 flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Reference, donor, receipt…" aria-label="Search" className={`${inputCls} w-56`} />
        <select name="method" defaultValue={sp.method ?? ""} aria-label="Method" className={`${inputCls} w-auto`}><option value="">All methods</option>{DONATION_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
        <select name="source" defaultValue={sp.source ?? ""} aria-label="Source" className={`${inputCls} w-auto`}><option value="">All sources</option>{Object.entries(SOURCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select name="designation" defaultValue={sp.designation ?? ""} aria-label="Designation" className={`${inputCls} w-auto`}><option value="">All designations</option>{(designations ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} aria-label="From" className={`${inputCls} w-auto`} />
        <input type="date" name="to" defaultValue={sp.to} aria-label="To" className={`${inputCls} w-auto`} />
        <button type="submit" className={btnSecondary}>Filter</button>
      </form>
      {!data?.length ? <EmptyState title="No confirmed donations" text="Record cash and other gifts as they are received, or verify a donor's confirmation." action={<Link href="/admin/giving/donations/new" className={btnPrimary}>Record a donation</Link>} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-line bg-[#f7f9fc] text-left text-xs uppercase tracking-[0.08em] text-muted">
              <tr><th className="px-4 py-2.5">Received</th><th className="px-4 py-2.5">Reference</th><th className="px-4 py-2.5">Donor</th><th className="px-4 py-2.5">Method</th><th className="px-4 py-2.5">Designation</th><th className="px-4 py-2.5">Pledge</th><th className="px-4 py-2.5 text-right">Amount</th><th className="px-4 py-2.5" /></tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id} className="border-b border-line align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(d.received_on)}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs">{d.reference}</span>{d.receipt_number && <span className="block text-xs text-muted">Receipt {d.receipt_number}</span>}</td>
                  <td className="px-4 py-3">{d.is_anonymous ? <em className="text-muted">Anonymous</em> : d.donor_name || <span className="text-muted">Not recorded</span>}{d.donor_email && <span className="block text-xs text-muted">{d.donor_email}</span>}</td>
                  <td className="px-4 py-3">{METHOD_LABEL[d.method]}{d.is_recurring && " · recurring"}<span className="block text-xs text-muted">{SOURCE_LABEL[d.source]}</span></td>
                  <td className="px-4 py-3">{d.designation?.name ?? "General giving"}</td>
                  <td className="px-4 py-3">{d.pledge ? <Link className="font-mono text-xs text-blue-deep hover:underline" href={`/admin/giving/pledges/${d.pledge.id}`}>{d.pledge.reference}</Link> : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(d.amount)}</td>
                  <td className="px-4 py-3 text-right">{staff.isAdmin && <ActionButton run={deleteDonation.bind(null, d.id)} label="Delete" className="text-xs text-red-700 hover:underline" confirmText={`Delete ${d.reference} (${money(d.amount)})? It will no longer count as received. The audit log keeps a copy.`} />}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-[#f7f9fc]"><td colSpan={6} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted">Total of {data.length} shown</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{money(total)}</td><td /></tr></tfoot>
          </table>
        </Card>
      )}
    </>
  );
}
