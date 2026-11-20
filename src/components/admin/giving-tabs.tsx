"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/giving", label: "Overview & reports" },
  { href: "/admin/giving/donations", label: "Confirmed donations" },
  { href: "/admin/giving/pledges", label: "Pledges" },
  { href: "/admin/giving/submissions", label: "Pending confirmations" },
  { href: "/admin/giving/cash", label: "Cash Drop" },
  { href: "/admin/giving/recurring", label: "Recurring" },
  { href: "/admin/giving/methods", label: "Payment methods" },
  { href: "/admin/giving/designations", label: "Designations" },
  { href: "/admin/giving/bank-accounts", label: "Bank accounts" },
  { href: "/admin/giving/notifications", label: "Notifications" },
];

export function GivingTabs({ pending, failed }: { pending: number; failed: number }) {
  const path = usePathname();
  const on = (h: string) => (h === "/admin/giving" ? path === h : path === h || path.startsWith(h + "/"));
  return (
    <nav aria-label="Giving sections" className="-mx-4 mb-8 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {TABS.map((t) => {
          const badge = t.href.endsWith("/submissions") ? pending : t.href.endsWith("/notifications") ? failed : 0;
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on(t.href) ? "page" : undefined}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors ${on(t.href) ? "border-blue-deep font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                {t.label}
                {badge > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[0.7rem] font-bold text-amber-800">{badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
