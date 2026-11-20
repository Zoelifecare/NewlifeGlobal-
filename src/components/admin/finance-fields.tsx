import Link from "next/link";
import { inputCls } from "./ui";
import { DONATION_METHODS, METHOD_LABEL, PLEDGE_STATUS_LABEL, money } from "@/lib/admin/finance-constants";

/** Server-rendered field helpers for finance forms. */
export function F({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`grid content-start gap-1 text-sm font-medium ${className}`}>
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[#003f82]" />
      <span>{label}{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
    </label>
  );
}

const PILL: Record<string, string> = {
  new: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  acknowledged: "bg-sky-50 text-sky-900 ring-sky-200",
  partially_fulfilled: "bg-cyan-50 text-cyan-900 ring-cyan-200",
  fulfilled: "bg-blue-50 text-blue-900 ring-blue-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  past_due: "bg-red-50 text-red-800 ring-red-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  verified: "bg-blue-50 text-blue-900 ring-blue-200",
  rejected: "bg-gray-100 text-gray-600 ring-gray-200",
  sent: "bg-blue-50 text-blue-900 ring-blue-200",
  failed: "bg-red-50 text-red-800 ring-red-200",
  queued: "bg-amber-50 text-amber-800 ring-amber-200",
  active: "bg-blue-50 text-blue-900 ring-blue-200",
  hidden: "bg-gray-100 text-gray-600 ring-gray-200",
};
export function Pill({ status, label }: { status: string; label?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PILL[status] ?? PILL.cancelled}`}>{label ?? PLEDGE_STATUS_LABEL[status] ?? status.replace(/_/g, " ")}</span>;
}

/** A summary figure. `tone` keeps the three buckets visually distinct: confirmed money, pledged commitments, pending claims. */
export function Figure({ label, value, sub, tone = "confirmed", href }: { label: string; value: string; sub?: string; tone?: "confirmed" | "pledged" | "pending" | "neutral"; href?: string }) {
  const bar = { confirmed: "bg-blue-deep", pledged: "bg-[#00a1de]", pending: "bg-amber-400", neutral: "bg-line" }[tone];
  const inner = (
    <>
      <span className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${bar}`} aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-ink">{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </>
  );
  const cls = "relative grid gap-1 rounded-lg border border-line bg-white py-4 pl-6 pr-4";
  return href ? <Link href={href} className={`${cls} transition-colors hover:border-blue/60`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export interface Opt { id: string; name: string }

/** Fields for recording a confirmed donation. */
export function DonationFields({ designations, pledges, defaults = {} }: { designations: Opt[]; pledges: Opt[]; defaults?: { method?: string; pledgeId?: string; source?: string; name?: string; email?: string } }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Phoenix" });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <F label="Amount received (USD) *"><input name="amount" inputMode="decimal" required className={inputCls} placeholder="0.00" /></F>
      <F label="Date received *"><input name="received_on" type="date" required defaultValue={today} className={inputCls} /></F>
      <F label="Method *">
        <select name="method" defaultValue={defaults.method ?? "cash"} className={inputCls}>{DONATION_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
      </F>
      <F label="Source (cash only)">
        <select name="source" defaultValue={defaults.source ?? "manual_entry"} className={inputCls}><option value="manual_entry">Counted by finance</option><option value="cash_drop">Cash Drop</option></select>
      </F>
      <F label="Designation">
        <select name="designation_id" className={inputCls}><option value="">General giving</option>{designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      </F>
      <F label="Apply to pledge" hint="Fulfils the pledge by this amount.">
        <select name="pledge_id" defaultValue={defaults.pledgeId ?? ""} className={inputCls}><option value="">Not linked to a pledge</option>{pledges.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </F>
      <F label="Donor name"><input name="donor_name" defaultValue={defaults.name} maxLength={120} className={inputCls} /></F>
      <F label="Donor email"><input name="donor_email" type="email" defaultValue={defaults.email} maxLength={254} className={inputCls} /></F>
      <F label="Receipt or check number"><input name="receipt_number" maxLength={80} className={inputCls} /></F>
      <F label="Notes" className="md:col-span-2"><textarea name="notes" rows={2} maxLength={2000} className={inputCls} /></F>
      <div className="grid gap-2 md:col-span-2 sm:grid-cols-3">
        <Check name="is_anonymous" label="Anonymous" />
        <Check name="is_recurring" label="Part of a recurring gift" />
        <Check name="notify_donor" label="Email the donor a receipt notice" defaultChecked />
      </div>
    </div>
  );
}

export { money };
