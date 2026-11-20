import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markRead } from "@/lib/admin/inbox-actions";
import { Card, PageTitle, StatusBadge, fmtDate } from "@/components/admin/ui";
import { SubmissionForm } from "@/components/admin/submission-form";

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireCapability("content");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: m } = await supabase.from("contact_messages").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();
  if (m.status === "new") await markRead(id);
  const status = m.status === "new" ? "read" : m.status;
  return (
    <>
      <PageTitle title={m.subject || (m.kind === "visit" ? "Plan a visit enquiry" : "Message")} back={{ href: "/admin/messages", label: "Messages & visits" }} actions={<StatusBadge status={status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6">
          <dl className="mb-6 grid gap-2 text-sm">
            <Row k="From" v={m.name} />
            <Row k="Email" v={<a className="text-blue-deep" href={`mailto:${m.email}`}>{m.email}</a>} />
            {m.phone && <Row k="Phone" v={<a className="text-blue-deep" href={`tel:${m.phone}`}>{m.phone}</a>} />}
            {m.kind === "visit" && <Row k="Planned visit" v={`${m.visit_date ?? "Not specified"}${m.party_size ? ` · ${m.party_size} people` : ""}`} />}
            <Row k="Received" v={fmtDate(m.created_at, true)} />
          </dl>
          <p className="whitespace-pre-wrap border-t border-line pt-5 leading-relaxed text-ink">{m.message}</p>
          <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message to New Life Global"}`)}`} className="mt-6 inline-flex rounded-md bg-blue-deep px-4 py-2 text-sm font-semibold text-white hover:bg-blue hover:text-blue-ink">Reply by email</a>
        </Card>
        <Card className="p-5">
          <SubmissionForm box="messages" id={m.id} status={status} notes={m.internal_notes} statuses={["new", "read", "replied", "archived"]} canDelete={staff.isAdmin} />
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex gap-2"><dt className="w-32 shrink-0 text-muted">{k}</dt><dd className="m-0 text-ink">{v}</dd></div>;
}
