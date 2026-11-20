import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, btnPrimary, fmtDate, inputCls } from "@/components/admin/ui";
import { F, Figure, Pill } from "@/components/admin/finance-fields";
import { ActionForm } from "@/components/admin/finance-ui";
import { updatePledge } from "@/lib/admin/finance-actions";
import { FREQ_LABEL, METHOD_LABEL, PLEDGE_STATUSES, PLEDGE_STATUS_LABEL, money } from "@/lib/admin/finance-constants";

export default async function PledgeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const [{ data: p }, { data: gifts }, { data: log }] = await Promise.all([
    supabase.from("pledges").select("*, designation:giving_designations(name)").eq("id", id).maybeSingle(),
    supabase.from("donations").select("id, reference, amount, received_on, method, receipt_number").eq("pledge_id", id).order("received_on"),
    supabase.from("notification_log").select("id, audience, recipient, status, created_at").eq("record_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!p) notFound();
  const remaining = Math.max(0, Number(p.amount) - Number(p.fulfilled_amount));

  return (
    <>
      <PageTitle title={`Pledge ${p.reference}`} back={{ href: "/admin/giving/pledges", label: "Pledges" }} actions={<Pill status={p.status} />}
        description="A pledge is a commitment. It is fulfilled only by confirmed donations linked to it; the status updates automatically." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Figure tone="pledged" label="Pledged" value={money(p.amount)} sub={FREQ_LABEL[p.frequency]} />
        <Figure tone="confirmed" label="Fulfilled" value={money(p.fulfilled_amount)} sub={`${gifts?.length ?? 0} linked donation(s)`} />
        <Figure tone="pledged" label="Remaining" value={money(remaining)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-6">
          <Card className="p-6">
            <dl className="grid gap-2 text-sm">
              <Row k="Donor" v={p.donor_name} />
              <Row k="Email" v={<a className="text-blue-deep" href={`mailto:${p.donor_email}`}>{p.donor_email}</a>} />
              {p.donor_phone && <Row k="Phone" v={<a className="text-blue-deep" href={`tel:${p.donor_phone}`}>{p.donor_phone}</a>} />}
              <Row k="Designation" v={p.designation?.name ?? "General giving"} />
              <Row k="Plans to give by" v={p.intended_method ?? "Not specified"} />
              <Row k="Expected by" v={p.expected_by ? fmtDate(p.expected_by) : "Not specified"} />
              <Row k="Submitted" v={fmtDate(p.created_at, true)} />
            </dl>
            {p.message && <p className="mt-5 whitespace-pre-wrap border-t border-line pt-5 text-ink">{p.message}</p>}
          </Card>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <h2 className="text-sm font-semibold">Donations applied to this pledge</h2>
              {p.status !== "cancelled" && <Link href={`/admin/giving/donations/new?pledge=${p.id}`} className={btnPrimary}>Record a payment toward this pledge</Link>}
            </div>
            {!gifts?.length ? <p className="p-5 text-sm text-muted">No donations have been applied yet. Nothing has been received for this pledge.</p> : (
              <table className="w-full text-sm"><tbody>{gifts.map((g) => (
                <tr key={g.id} className="border-b border-line last:border-0"><td className="px-5 py-2.5">{fmtDate(g.received_on)}</td><td className="px-5 py-2.5 font-mono text-xs">{g.reference}</td><td className="px-5 py-2.5">{METHOD_LABEL[g.method]}{g.receipt_number ? ` · ${g.receipt_number}` : ""}</td><td className="px-5 py-2.5 text-right tabular-nums">{money(g.amount)}</td></tr>
              ))}</tbody></table>
            )}
          </Card>
          {!!log?.length && (
            <Card>
              <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Email notifications</h2>
              <ul className="text-sm">{log.map((l) => <li key={l.id} className="flex flex-wrap gap-3 border-b border-line px-5 py-2.5 last:border-0"><span className="capitalize text-muted">{l.audience}</span><span>{l.recipient}</span><span className="ml-auto"><Pill status={l.status} /></span></li>)}</ul>
            </Card>
          )}
        </div>
        <Card className="h-fit p-5">
          <ActionForm action={updatePledge.bind(null, p.id)}>
            <F label="Status" hint="Partially fulfilled and Fulfilled are set automatically from linked donations.">
              <select name="status" defaultValue={p.status} className={inputCls}>{PLEDGE_STATUSES.map((s) => <option key={s} value={s}>{PLEDGE_STATUS_LABEL[s]}</option>)}</select>
            </F>
            <F label="Expected by"><input type="date" name="expected_by" defaultValue={p.expected_by ?? ""} className={inputCls} /></F>
            <F label="Internal notes (finance only)"><textarea name="internal_notes" rows={5} maxLength={4000} defaultValue={p.internal_notes ?? ""} className={inputCls} /></F>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted">{k}</dt><dd className="m-0 text-ink">{v}</dd></div>;
}
