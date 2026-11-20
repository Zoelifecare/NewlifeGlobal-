import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, StatusBadge, btnSecondary, fmtDate } from "@/components/admin/ui";
import { SubscriberActions } from "@/components/admin/subscriber-actions";

export default async function Subscribers() {
  const staff = await requireCapability("content");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(2000);
  const active = (data ?? []).filter((d) => d.status === "subscribed").length;
  return (
    <>
      <PageTitle title="Subscribers" description={`${active} active subscriber${active === 1 ? "" : "s"} from the website footer form.`}
        actions={
          // a file download, not a page navigation
          <a href="/admin/subscribers/export" download className={btnSecondary}>Export CSV</a>
        } />
      {!data?.length ? <EmptyState title="No subscribers yet" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{s.email}{s.name ? <span className="block text-xs text-muted">{s.name}</span> : null}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-muted">{fmtDate(s.created_at)}</td>
                  <td className="px-4 py-3"><SubscriberActions id={s.id} status={s.status} canDelete={staff.isAdmin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
