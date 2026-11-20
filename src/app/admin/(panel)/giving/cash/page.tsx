import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, btnPrimary, btnSecondary, fmtDate } from "@/components/admin/ui";
import { Figure, Pill } from "@/components/admin/finance-fields";
import { SOURCE_LABEL, money } from "@/lib/admin/finance-constants";

/** Cash Drop: notices from donors (pending, never counted) and cash finance has actually counted (confirmed). */
export default async function CashDrop() {
  const supabase = await createSupabaseServerClient();
  const [{ data: notices }, { data: cash }, { data: method }] = await Promise.all([
    supabase.from("giving_submissions").select("id, reference, donor_name, amount, sent_on, status, created_at").eq("kind", "cash_drop_notice").order("created_at", { ascending: false }).limit(200),
    supabase.from("donations").select("id, reference, donor_name, is_anonymous, amount, received_on, source, receipt_number").eq("method", "cash").order("received_on", { ascending: false }).limit(300),
    supabase.from("payment_methods").select("id, is_active, instructions, location").eq("kind", "cash_drop").limit(1).maybeSingle(),
  ]);
  const pending = (notices ?? []).filter((n) => n.status === "pending");
  const cashTotal = (cash ?? []).reduce((a, d) => a + Number(d.amount), 0);

  return (
    <>
      <PageTitle title="Cash Drop" description="Cash is confirmed only when finance counts it. A donor's notice that they dropped cash stays pending until it is matched."
        actions={<><Link href="/admin/giving/methods" className={btnSecondary}>Cash Drop instructions</Link><Link href="/admin/giving/donations/new?method=cash&source=cash_drop" className={btnPrimary}>Record counted cash</Link></>} />
      {!method?.is_active && (
        <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          The Cash Drop option is hidden on the Giving page. Add the church&apos;s approved instructions and location in <Link className="underline" href="/admin/giving/methods">Payment methods</Link>, then mark it active.
        </p>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Figure label="Cash counted (shown)" value={money(cashTotal)} sub={`${cash?.length ?? 0} records`} />
        <Figure tone="pending" label="Donor notices pending" value={String(pending.length)} sub={`${money(pending.reduce((a, n) => a + Number(n.amount), 0))} claimed`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Cash recorded by finance</h2>
          {!cash?.length ? <p className="p-5 text-sm text-muted">No cash recorded yet.</p> : (
            <table className="w-full text-sm"><tbody>{cash.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5 whitespace-nowrap">{fmtDate(d.received_on)}</td>
                <td className="px-5 py-2.5"><span className="font-mono text-xs">{d.reference}</span><span className="block text-xs text-muted">{SOURCE_LABEL[d.source]}{d.receipt_number ? ` · ${d.receipt_number}` : ""}</span></td>
                <td className="px-5 py-2.5">{d.is_anonymous ? "Anonymous" : d.donor_name ?? "—"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{money(d.amount)}</td>
              </tr>
            ))}</tbody></table>
          )}
        </Card>
        <Card>
          <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Donor Cash Drop notices</h2>
          {!notices?.length ? <p className="p-5 text-sm text-muted">No notices yet.</p> : (
            <ul>{notices.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <Link href={`/admin/giving/submissions/${n.id}`} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm hover:bg-[#f7f9fc]">
                  <span className="font-mono text-xs text-muted">{n.reference}</span><span>{n.donor_name || "Name not given"}</span>
                  <span className="text-xs text-muted">{n.sent_on ? `Dropped ${fmtDate(n.sent_on)}` : fmtDate(n.created_at)}</span>
                  <span className="ml-auto tabular-nums">{money(n.amount)}</span><Pill status={n.status} label={n.status === "rejected" ? "not received" : undefined} />
                </Link>
              </li>
            ))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
