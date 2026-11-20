import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, btnSecondary, fmtDate, inputCls } from "@/components/admin/ui";
import { Pill } from "@/components/admin/finance-fields";
import { FREQ_LABEL, SUBMISSION_KIND_LABEL, money } from "@/lib/admin/finance-constants";

const STATUSES = ["pending", "verified", "rejected"];

export default async function Submissions({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = sp.status && (STATUSES.includes(sp.status) || sp.status === "all") ? sp.status : "pending";
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("giving_submissions").select("id, reference, kind, donor_name, donor_email, amount, frequency, sent_on, donor_reference, status, created_at, method:payment_methods(label)").order("created_at", { ascending: false }).limit(500);
  if (status !== "all") q = q.eq("status", status);
  if (sp.kind && sp.kind in SUBMISSION_KIND_LABEL) q = q.eq("kind", sp.kind);
  const term = sp.q?.trim().replace(/[%,()]/g, "").slice(0, 60);
  if (term) q = q.or(`reference.ilike.%${term}%,donor_name.ilike.%${term}%,donor_email.ilike.%${term}%,donor_reference.ilike.%${term}%`);
  const { data } = await q;
  const rows = (data ?? []) as unknown as { id: string; reference: string; kind: string; donor_name: string | null; donor_email: string | null; amount: number; frequency: string; sent_on: string | null; donor_reference: string | null; status: string; created_at: string; method: { label: string } | null }[];
  const qs = new URLSearchParams({ status, ...(sp.kind ? { kind: sp.kind } : {}) }).toString();

  return (
    <>
      <PageTitle title="Pending confirmations" description="Donors telling us they sent Zelle, Cash App, a bank transfer, dropped cash, or continued to online giving. None of this counts as received until you verify it against the bank, app or counted cash."
        actions={<a href={`/admin/giving/export?type=submissions&${qs}`} className={btnSecondary}>Export CSV</a>} />
      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Reference, name, memo…" aria-label="Search" className={`${inputCls} w-56`} />
        <select name="status" defaultValue={status} aria-label="Status" className={`${inputCls} w-auto`}><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Not received</option><option value="all">All</option></select>
        <select name="kind" defaultValue={sp.kind ?? ""} aria-label="Type" className={`${inputCls} w-auto`}><option value="">All types</option>{Object.entries(SUBMISSION_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button type="submit" className={btnSecondary}>Filter</button>
      </form>
      {!rows.length ? <EmptyState title={status === "pending" ? "Nothing waiting for verification" : "Nothing found"} text="Confirmations from the Giving page appear here." /> : (
        <Card>
          <ul>
            {rows.map((s) => (
              <li key={s.id} className="border-b border-line last:border-0">
                <Link href={`/admin/giving/submissions/${s.id}`} className="grid gap-2 px-5 py-4 hover:bg-[#f7f9fc] sm:grid-cols-[1fr_auto] sm:items-center">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-sm"><span className="font-mono text-xs text-muted">{s.reference}</span><span className="font-semibold">{s.donor_name || "Name not given"}</span><span className="rounded bg-mist px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-deep">{SUBMISSION_KIND_LABEL[s.kind]}</span></span>
                    <span className="block truncate text-xs text-muted">
                      {[s.method?.label, s.frequency !== "one_time" ? FREQ_LABEL[s.frequency] : null, s.sent_on ? `Sent ${fmtDate(s.sent_on)}` : null, s.donor_reference ? `Memo: ${s.donor_reference}` : null, `Submitted ${fmtDate(s.created_at, true)}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex items-center gap-3"><span className="font-semibold tabular-nums">{money(s.amount)}</span><Pill status={s.status} label={s.status === "rejected" ? "not received" : undefined} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
