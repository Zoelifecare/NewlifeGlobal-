import Link from "next/link";
import { BookOpen, CalendarDays, Landmark, Image as ImageIcon, Mail, Megaphone, Video } from "lucide-react";
import { requireStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, fmtDate } from "@/components/admin/ui";

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const [staff, sp] = await Promise.all([requireStaff(), searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data: counts }, audit] = await Promise.all([
    supabase.rpc("dashboard_counts"),
    staff.isAdmin ? supabase.from("audit_logs").select("id, actor_id, action, table_name, summary, created_at").order("created_at", { ascending: false }).limit(12) : Promise.resolve({ data: null }),
  ]);
  const c = (counts ?? {}) as Record<string, number | null>;
  const actorIds = [...new Set(((audit.data ?? []) as { actor_id: string }[]).map((a) => a.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds) : { data: [] };
  const who = (id: string) => { const p = (actors ?? []).find((a) => a.id === id); return p?.full_name || p?.email || "Staff"; };

  const tiles = [
    { label: "Published sermons", value: c.sermons_published, href: "/admin/sermons", icon: Video, show: staff.canEditContent },
    { label: "Upcoming events", value: c.events_upcoming, href: "/admin/events", icon: CalendarDays, show: staff.canEditContent },
    { label: "Live announcements", value: c.announcements_live, href: "/admin/announcements", icon: Megaphone, show: staff.canEditContent },
    { label: "Gallery items", value: c.gallery_items, href: "/admin/gallery", icon: ImageIcon, show: true },
    { label: "Unread messages", value: c.messages_unread, href: "/admin/messages", icon: Mail, show: staff.canEditContent, alert: true },
    { label: "New prayer requests", value: c.prayer_pending, href: "/admin/prayer", icon: BookOpen, show: staff.canReadPrayer, alert: true },
    { label: "Changes awaiting approval", value: c.approvals_pending, href: "/admin/identity", icon: Landmark, show: staff.canEditContent, alert: true },
    { label: "Sections needing confirmation", value: c.needs_confirmation, href: "/admin/identity", icon: Landmark, show: staff.canEditContent, alert: true },
  ].filter((t) => t.show);

  return (
    <>
      <PageTitle title={`Welcome, ${staff.name.split(" ")[0]}`} description="Here's what's happening across the New Life Global website." />
      {sp.denied && <p role="alert" className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">That section isn&apos;t available for your role.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="flex items-center gap-4 rounded-lg border border-line bg-white p-5 transition-colors hover:border-blue/60">
              <span className={`flex h-11 w-11 items-center justify-center rounded-md ${t.alert && (t.value ?? 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-mist text-blue-deep"}`}><t.icon className="h-5 w-5" aria-hidden /></span>
              <span className="grid">
                <span className="text-2xl font-semibold tabular-nums text-ink">{t.value ?? "—"}</span>
                <span className="text-sm text-muted">{t.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_22rem]">
        {staff.isAdmin ? (
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Recent activity</h2>
              <Link href="/admin/audit" className="text-sm font-semibold text-blue-deep">Full audit log</Link>
            </div>
            {(audit.data ?? []).length === 0 ? <p className="p-5 text-sm text-muted">No activity yet.</p> : (
              <ul>
                {(audit.data as { id: number; actor_id: string; action: string; table_name: string; summary: string | null; created_at: string }[]).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-line px-5 py-3 text-sm last:border-0">
                    <span className="font-medium">{who(a.actor_id)}</span>
                    <span className="text-muted">{a.action === "insert" ? "created" : a.action === "update" ? "updated" : "deleted"} {a.table_name.replace(/_/g, " ")}</span>
                    {a.summary && <span className="truncate text-ink">“{a.summary}”</span>}
                    <span className="ml-auto text-xs text-muted">{fmtDate(a.created_at, true)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : <div />}
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <ul className="grid gap-2 text-sm">
            {staff.canEditContent && <li><Link className="text-blue-deep hover:underline" href="/admin/sermons/new">Add a sermon</Link></li>}
            {staff.canEditContent && <li><Link className="text-blue-deep hover:underline" href="/admin/events/new">Create an event</Link></li>}
            <li><Link className="text-blue-deep hover:underline" href="/admin/media">Upload photos</Link></li>
            {staff.canEditContent && <li><Link className="text-blue-deep hover:underline" href="/admin/homepage">Edit the homepage</Link></li>}
            {staff.canEditContent && <li><Link className="text-blue-deep hover:underline" href="/admin/settings">Update service times & contact details</Link></li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
