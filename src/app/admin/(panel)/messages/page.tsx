import Link from "next/link";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, StatusBadge, fmtDate, inputCls } from "@/components/admin/ui";

const STATUSES = ["new", "read", "replied", "archived"];

export default async function MessagesList({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requireCapability("content");
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("contact_messages").select("id, kind, name, email, subject, message, status, visit_date, created_at").order("created_at", { ascending: false }).limit(300);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status); else q = q.neq("status", "archived");
  if (sp.kind === "visit" || sp.kind === "contact") q = q.eq("kind", sp.kind);
  const { data } = await q;
  return (
    <>
      <PageTitle title="Messages & visits" description="Contact form messages and Plan-Your-Visit enquiries. Private — never shown publicly." />
      <form className="mb-5 flex flex-wrap gap-2">
        <select name="kind" defaultValue={sp.kind ?? ""} className={`${inputCls} w-auto`} aria-label="Type"><option value="">All types</option><option value="contact">Contact</option><option value="visit">Visit enquiries</option></select>
        <select name="status" defaultValue={sp.status ?? ""} className={`${inputCls} w-auto`} aria-label="Status"><option value="">Open</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <button type="submit" className="rounded-md border border-line bg-white px-4 text-sm font-semibold hover:bg-mist">Filter</button>
      </form>
      {!data?.length ? <EmptyState title="No messages" text="Messages from the contact and visit forms appear here." /> : (
        <Card>
          <ul>
            {data.map((m) => (
              <li key={m.id} className="border-b border-line last:border-0">
                <Link href={`/admin/messages/${m.id}`} className="grid gap-1 px-5 py-4 hover:bg-[#f7f9fc] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                  <span className="min-w-0">
                    <span className={`block text-sm ${m.status === "new" ? "font-bold" : "font-semibold"}`}>
                      {m.name} <span className="ml-1 rounded bg-mist px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-deep">{m.kind === "visit" ? `Visit${m.visit_date ? ` · ${m.visit_date}` : ""}` : "Contact"}</span>
                    </span>
                    <span className="block truncate text-sm text-muted">{m.subject ? `${m.subject}: ` : ""}{m.message}</span>
                  </span>
                  <span className="flex items-center gap-3"><StatusBadge status={m.status} /><span className="text-xs text-muted">{fmtDate(m.created_at, true)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
