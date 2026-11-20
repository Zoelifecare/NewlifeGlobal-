import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, fmtDate } from "@/components/admin/ui";
import { Pill } from "@/components/admin/finance-fields";
import { FREQ_LABEL, METHOD_LABEL, money } from "@/lib/admin/finance-constants";

/**
 * Recurring giving. The website does not run automatic charges: recurring gifts are set up by the donor
 * with an online provider or their bank. This view groups recurring intentions, recurring pledges and
 * the confirmed donations marked as recurring.
 */
export default async function Recurring() {
  const supabase = await createSupabaseServerClient();
  const [{ data: intents }, { data: pledges }, { data: gifts }] = await Promise.all([
    supabase.from("giving_submissions").select("id, reference, donor_name, donor_email, amount, frequency, status, created_at, method:payment_methods(label)").eq("kind", "donation_recurring").order("created_at", { ascending: false }).limit(300),
    supabase.from("pledges").select("id, reference, donor_name, amount, fulfilled_amount, frequency, status").neq("frequency", "one_time").not("status", "eq", "cancelled").order("created_at", { ascending: false }).limit(300),
    supabase.from("donations").select("id, reference, donor_name, is_anonymous, amount, received_on, method").eq("is_recurring", true).order("received_on", { ascending: false }).limit(300),
  ]);
  return (
    <>
      <PageTitle title="Recurring giving" description="Recurring gifts are scheduled by donors with the giving provider or their bank; this website does not charge anyone automatically. Only the confirmed list counts as received." />
      <div className="grid gap-6">
        <Section title="Recurring giving intentions" note="Donors who chose a recurring gift and continued to the provider. Pending until the provider shows the gift.">
          {(intents ?? []).map((s) => (
            <Line key={s.id} href={`/admin/giving/submissions/${s.id}`} cells={[s.reference, s.donor_name || s.donor_email || "—", `${FREQ_LABEL[s.frequency]} · ${(s.method as unknown as { label: string } | null)?.label ?? ""}`, money(s.amount)]} pill={<Pill status={s.status} />} />
          ))}
        </Section>
        <Section title="Recurring pledges" note="Commitments over time; fulfilled by linked donations.">
          {(pledges ?? []).map((p) => (
            <Line key={p.id} href={`/admin/giving/pledges/${p.id}`} cells={[p.reference, p.donor_name, FREQ_LABEL[p.frequency], `${money(p.fulfilled_amount)} of ${money(p.amount)}`]} pill={<Pill status={p.status} />} />
          ))}
        </Section>
        <Section title="Confirmed recurring donations" note="Received and recorded.">
          {(gifts ?? []).map((d) => (
            <Line key={d.id} href={`/admin/giving/donations?q=${d.reference}`} cells={[d.reference, d.is_anonymous ? "Anonymous" : d.donor_name ?? "—", `${METHOD_LABEL[d.method]} · ${fmtDate(d.received_on)}`, money(d.amount)]} />
          ))}
        </Section>
      </div>
    </>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode[] }) {
  return (
    <Card>
      <div className="border-b border-line px-5 py-3"><h2 className="text-sm font-semibold">{title} <span className="font-normal text-muted">({children.length})</span></h2><p className="text-xs text-muted">{note}</p></div>
      {children.length ? <ul>{children}</ul> : <p className="p-5 text-sm text-muted">None yet.</p>}
    </Card>
  );
}
function Line({ href, cells, pill }: { href: string; cells: string[]; pill?: React.ReactNode }) {
  return (
    <li className="border-b border-line last:border-0">
      <Link href={href} className="grid gap-2 px-5 py-2.5 text-sm hover:bg-[#f7f9fc] sm:grid-cols-[9rem_1fr_1fr_8rem_6rem] sm:items-center">
        <span className="font-mono text-xs text-muted">{cells[0]}</span><span>{cells[1]}</span><span className="text-muted">{cells[2]}</span><span className="tabular-nums sm:text-right">{cells[3]}</span><span className="sm:text-right">{pill}</span>
      </Link>
    </li>
  );
}
