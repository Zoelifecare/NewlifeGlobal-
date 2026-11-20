import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, fmtDate, inputCls } from "@/components/admin/ui";
import { Check, F, Pill } from "@/components/admin/finance-fields";
import { ActionForm } from "@/components/admin/finance-ui";
import { rejectSubmission, saveSubmissionNotes, verifySubmission } from "@/lib/admin/finance-actions";
import { loadFinanceOptions } from "@/lib/admin/finance-loaders";
import { FREQ_LABEL, SUBMISSION_KIND_LABEL, money } from "@/lib/admin/finance-constants";

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const [{ data: s }, { data: donation }, opts] = await Promise.all([
    supabase.from("giving_submissions").select("*, designation:giving_designations(name), method:payment_methods(label, kind)").eq("id", id).maybeSingle(),
    supabase.from("donations").select("id, reference, amount, received_on").eq("submission_id", id).maybeSingle(),
    loadFinanceOptions(),
  ]);
  if (!s) notFound();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Phoenix" });
  const intention = s.kind === "donation_one_time" || s.kind === "donation_recurring";

  return (
    <>
      <PageTitle title={`${SUBMISSION_KIND_LABEL[s.kind]} ${s.reference}`} back={{ href: "/admin/giving/submissions", label: "Pending confirmations" }}
        actions={<Pill status={s.status} label={s.status === "rejected" ? "not received" : undefined} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="h-fit p-6">
          <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {intention
              ? "The donor chose an online method and continued to the provider. This is not proof of payment: verify only when the provider shows the gift."
              : "The donor says they sent this. Check the bank, app or counted cash before verifying."}
          </p>
          <dl className="grid gap-2 text-sm">
            <Row k="Amount claimed" v={<strong className="tabular-nums">{money(s.amount)}</strong>} />
            <Row k="Method" v={s.method?.label ?? "Not specified"} />
            <Row k="Frequency" v={FREQ_LABEL[s.frequency]} />
            <Row k="Designation" v={s.designation?.name ?? "General giving"} />
            {s.sent_on && <Row k="Date sent" v={fmtDate(s.sent_on)} />}
            {s.donor_reference && <Row k="Donor memo / code" v={s.donor_reference} />}
            <Row k="Donor" v={s.donor_name || "Not given"} />
            {s.donor_email && <Row k="Email" v={<a className="text-blue-deep" href={`mailto:${s.donor_email}`}>{s.donor_email}</a>} />}
            {s.donor_phone && <Row k="Phone" v={s.donor_phone} />}
            <Row k="Submitted" v={fmtDate(s.created_at, true)} />
            {s.verified_at && <Row k="Verified" v={fmtDate(s.verified_at, true)} />}
          </dl>
          {s.message && <p className="mt-5 whitespace-pre-wrap border-t border-line pt-5">{s.message}</p>}
          {donation && (
            <p className="mt-5 border-t border-line pt-5 text-sm">Confirmed donation <Link className="font-mono text-blue-deep hover:underline" href={`/admin/giving/donations?q=${donation.reference}`}>{donation.reference}</Link> · {money(donation.amount)} received {fmtDate(donation.received_on)}</p>
          )}
        </Card>
        <div className="grid content-start gap-6">
          {s.status === "pending" && (
            <>
              <Card className="p-5">
                <h2 className="mb-1 font-semibold">Verify received</h2>
                <p className="mb-4 text-xs text-muted">Creates one confirmed donation for the amount you actually received.</p>
                <ActionForm action={verifySubmission.bind(null, s.id)} submitLabel="Verify and record donation" confirmText="Confirm that this money has been received?">
                  <F label="Amount received (USD)"><input name="amount" inputMode="decimal" required defaultValue={Number(s.amount).toFixed(2)} className={inputCls} /></F>
                  <F label="Date received"><input type="date" name="received_on" defaultValue={s.sent_on ?? today} className={inputCls} /></F>
                  <F label="Apply to pledge"><select name="pledge_id" className={inputCls}><option value="">Not linked</option>{opts.pledges.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></F>
                  <F label="Notes"><textarea name="notes" rows={2} maxLength={2000} className={inputCls} /></F>
                  {s.donor_email && <Check name="notify_donor" label="Email the donor that the gift was received" defaultChecked />}
                </ActionForm>
              </Card>
              <Card className="p-5">
                <h2 className="mb-1 font-semibold">Not received</h2>
                <p className="mb-4 text-xs text-muted">Use when no matching payment can be found. Nothing is counted.</p>
                <ActionForm action={rejectSubmission.bind(null, s.id)} submitLabel="Mark as not received" danger>
                  <F label="Reason (required)"><textarea name="internal_notes" rows={3} required maxLength={4000} defaultValue={s.internal_notes ?? ""} className={inputCls} /></F>
                </ActionForm>
              </Card>
            </>
          )}
          {s.status !== "pending" && (
            <Card className="p-5">
              <ActionForm action={saveSubmissionNotes.bind(null, s.id)}>
                <F label="Internal notes"><textarea name="internal_notes" rows={4} maxLength={4000} defaultValue={s.internal_notes ?? ""} className={inputCls} /></F>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted">{k}</dt><dd className="m-0 text-ink">{v}</dd></div>;
}
