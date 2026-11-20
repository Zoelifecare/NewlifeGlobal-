import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, StatusBadge, fmtDate } from "@/components/admin/ui";
import { SubmissionForm } from "@/components/admin/submission-form";

export default async function PrayerDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireCapability("prayer");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("prayer_requests").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: team } = await supabase.from("profiles").select("id, full_name, email, is_prayer_team").order("full_name");
  const assignees = (team ?? []).filter((t) => t.is_prayer_team || t.id === staff.id).map((t) => ({ id: t.id, name: t.full_name || t.email || "Staff" }));
  return (
    <>
      <PageTitle title={p.name || "Anonymous request"} back={{ href: "/admin/prayer", label: "Prayer requests" }} actions={<StatusBadge status={p.status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6">
          <p className="mb-4 text-xs text-muted">Received {fmtDate(p.created_at, true)}</p>
          <p className="whitespace-pre-wrap text-[1.05rem] leading-relaxed text-ink">{p.request}</p>
          <dl className="mt-6 grid gap-2 border-t border-line pt-4 text-sm">
            <div className="flex gap-2"><dt className="w-36 text-muted">Email</dt><dd>{p.email ? <a className="text-blue-deep" href={`mailto:${p.email}`}>{p.email}</a> : "—"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 text-muted">May we contact?</dt><dd className={p.may_contact ? "font-semibold text-blue-deep" : ""}>{p.may_contact ? "Yes" : "No, please don't contact"}</dd></div>
          </dl>
        </Card>
        <Card className="p-5">
          <SubmissionForm box="prayer" id={p.id} status={p.status} notes={p.internal_notes} statuses={["new", "praying", "followed_up", "answered", "archived"]}
            assignees={assignees} assignedTo={p.assigned_to} canDelete={staff.isAdmin} />
        </Card>
      </div>
    </>
  );
}
