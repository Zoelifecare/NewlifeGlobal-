import Link from "next/link";
import { isFuture } from "@/lib/format";

export function PageTitle({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1.5">
        {back && <Link href={back.href} className="text-sm text-muted hover:text-ink">← {back.label}</Link>}
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-white ${className}`}>{children}</div>;
}

const TONES: Record<string, string> = {
  published: "bg-sky-50 text-sky-900 ring-sky-200",
  scheduled: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  archived: "bg-gray-100 text-gray-600 ring-gray-200",
  new: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  praying: "bg-violet-50 text-violet-800 ring-violet-200",
  followed_up: "bg-sky-50 text-sky-900 ring-sky-200",
  answered: "bg-sky-50 text-sky-900 ring-sky-200",
  read: "bg-gray-100 text-gray-700 ring-gray-200",
  replied: "bg-sky-50 text-sky-900 ring-sky-200",
  subscribed: "bg-sky-50 text-sky-900 ring-sky-200",
  unsubscribed: "bg-gray-100 text-gray-600 ring-gray-200",
};

export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: string | null }) {
  const scheduled = status === "published" && isFuture(publishedAt);
  const s = scheduled ? "scheduled" : status;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${TONES[s] ?? TONES.archived}`}>{s.replace("_", " ")}</span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export const btn = "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
export const btnPrimary = `${btn} bg-blue-deep text-white hover:bg-blue hover:text-blue-ink`;
export const btnSecondary = `${btn} border border-line bg-white text-ink hover:bg-mist`;
export const btnDanger = `${btn} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const inputCls = "w-full rounded-md border border-[#cfd5d1] bg-white px-3 py-2 text-sm text-ink focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue/25 aria-[invalid=true]:border-red-500";

export function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/Phoenix",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}
