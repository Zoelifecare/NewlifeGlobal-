import Link from "next/link";
import { Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, btnPrimary, btnSecondary, fmtDate, inputCls } from "@/components/admin/ui";
import { Figure, Pill } from "@/components/admin/finance-fields";
import { METHOD_LABEL, SUBMISSION_KIND_LABEL, money } from "@/lib/admin/finance-constants";
import { okDate } from "@/lib/admin/finance-loaders";

interface Summary {
  confirmed_total: number; confirmed_count: number; confirmed_this_month: number; cash_total: number; online_total: number;
  by_method: Record<string, number>; pledged_total: number; pledge_count: number; pledge_outstanding: number;
  pending_count: number; pending_amount: number; notifications_failed: number;
}

export default async function GivingOverview({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const from = okDate(sp.from), to = okDate(sp.to);
  const supabase = await createSupabaseServerClient();
  let dq = supabase.from("donations").select("amount, received_on, designation:giving_designations(name)").order("received_on").limit(10000);
  if (from) dq = dq.gte("received_on", from);
  if (to) dq = dq.lte("received_on", to);
  const [{ data: s, error }, { data: rows }, { data: pending }] = await Promise.all([
    supabase.rpc("giving_summary", { p_from: from ?? null, p_to: to ?? null }),
    dq,
    supabase.from("giving_submissions").select("id, reference, kind, donor_name, amount, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(6),
  ]);
  const sum = (s ?? {}) as Summary;
  const byMonth = new Map<string, number>(), byDesignation = new Map<string, number>();
  for (const r of (rows ?? []) as unknown as { amount: number; received_on: string; designation: { name: string } | null }[]) {
    const m = r.received_on.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + Number(r.amount));
    const d = r.designation?.name ?? "General giving";
    byDesignation.set(d, (byDesignation.get(d) ?? 0) + Number(r.amount));
  }
  const qs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  const range = from || to ? `${from ? fmtDate(from) : "start"} to ${to ? fmtDate(to) : "today"}` : "All time";

  return (
    <>
      <PageTitle title="Giving" description="Confirmed donations, pledges and pending confirmations are tracked and reported separately. Only confirmed donations are money received."
        actions={<><Link href="/admin/giving/donations/new" className={btnPrimary}>Record a donation</Link></>} />
      {error && <p role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Could not load the summary: {error.message}</p>}

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-semibold text-muted">From<input type="date" name="from" defaultValue={from} className={`${inputCls} w-auto`} /></label>
        <label className="grid gap-1 text-xs font-semibold text-muted">To<input type="date" name="to" defaultValue={to} className={`${inputCls} w-auto`} /></label>
        <button type="submit" className={btnSecondary}>Apply</button>
        {(from || to) && <Link href="/admin/giving" className="text-sm text-muted hover:text-ink">Clear</Link>}
        <span className="ml-auto text-sm text-muted">Showing: <strong className="text-ink">{range}</strong></span>
      </form>

      <section aria-labelledby="confirmed-h" className="mb-8">
        <h2 id="confirmed-h" className="mb-3 text-sm font-semibold text-ink">Confirmed donations <span className="font-normal text-muted">· money received</span></h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Figure label="Total received" value={money(sum.confirmed_total)} sub={`${sum.confirmed_count ?? 0} gifts · ${range}`} href={`/admin/giving/donations?${qs}`} />
          <Figure label="This month" value={money(sum.confirmed_this_month)} />
          <Figure label="Cash" value={money(sum.cash_total)} href={`/admin/giving/cash`} />
          <Figure label="Online" value={money(sum.online_total)} sub="Recorded from a connected provider" />
        </div>
      </section>
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pledged-h">
          <h2 id="pledged-h" className="mb-3 text-sm font-semibold text-ink">Pledges <span className="font-normal text-muted">· commitments, not received</span></h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Figure tone="pledged" label="Total pledged" value={money(sum.pledged_total)} sub={`${sum.pledge_count ?? 0} active pledges`} href="/admin/giving/pledges" />
            <Figure tone="pledged" label="Outstanding" value={money(sum.pledge_outstanding)} sub="Pledged minus fulfilled" />
          </div>
        </section>
        <section aria-labelledby="pending-h">
          <h2 id="pending-h" className="mb-3 text-sm font-semibold text-ink">Pending confirmations <span className="font-normal text-muted">· donor says sent, not yet verified</span></h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Figure tone="pending" label="Awaiting verification" value={String(sum.pending_count ?? 0)} sub={`${money(sum.pending_amount)} claimed`} href="/admin/giving/submissions" />
            <Figure tone="neutral" label="Failed notifications" value={String(sum.notifications_failed ?? 0)} href="/admin/giving/notifications" />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Received by method</h2>
          <Table rows={Object.entries(sum.by_method ?? {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => [METHOD_LABEL[k] ?? k, money(v)])} empty="No confirmed donations in this range." />
        </Card>
        <Card>
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Received by designation</h2>
          <Table rows={[...byDesignation].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, money(v)])} empty="No confirmed donations in this range." />
        </Card>
        <Card>
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Received by month</h2>
          <Table rows={[...byMonth].reverse().slice(0, 12).map(([k, v]) => [new Date(`${k}-15`).toLocaleDateString("en-US", { month: "long", year: "numeric" }), money(v)])} empty="No confirmed donations in this range." />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold">Latest pending confirmations</h2>
            <Link href="/admin/giving/submissions" className="text-sm font-semibold text-blue-deep">All</Link>
          </div>
          {!pending?.length ? <p className="p-5 text-sm text-muted">Nothing waiting for verification.</p> : (
            <ul>{pending.map((p) => (
              <li key={p.id} className="border-b border-line last:border-0">
                <Link href={`/admin/giving/submissions/${p.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-[#f7f9fc]">
                  <span className="font-mono text-xs text-muted">{p.reference}</span>
                  <span className="font-medium">{p.donor_name || "Anonymous"}</span>
                  <span className="text-muted">{SUBMISSION_KIND_LABEL[p.kind]}</span>
                  <span className="ml-auto tabular-nums">{money(p.amount)}</span><Pill status="pending" />
                </Link>
              </li>
            ))}</ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Export (CSV)</h2>
          <p className="mb-4 text-xs text-muted">Uses the date range above. Each export is a separate file so the figures are never mixed.</p>
          <ul className="grid gap-2">
            {[["donations", "Confirmed donations"], ["pledges", "Pledges"], ["submissions", "Pending and past confirmations"]].map(([k, l]) => (
              <li key={k}><a href={`/admin/giving/export?type=${k}${qs ? `&${qs}` : ""}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-deep hover:underline"><Download className="h-4 w-4" aria-hidden />{l}</a></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Table({ rows, empty }: { rows: string[][]; empty: string }) {
  if (!rows.length) return <p className="p-5 text-sm text-muted">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-line last:border-0"><td className="px-5 py-2.5">{k}</td><td className="px-5 py-2.5 text-right tabular-nums">{v}</td></tr>)}</tbody>
    </table>
  );
}
