import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth/staff";
import { getResource } from "@/lib/admin/resources";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageTitle, StatusBadge, btnPrimary, fmtDate, inputCls } from "@/components/admin/ui";
import { RowActions } from "@/components/admin/row-actions";

export default async function ResourceList({ params, searchParams }: {
  params: Promise<{ resource: string }>; searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const [{ resource }, sp] = await Promise.all([params, searchParams]);
  const res = getResource(resource);
  if (!res) notFound();
  const staff = await requireStaff();
  if (!staff.canEditContent && res.scope !== "ministry") return <EmptyState title="Not available" text="Your role doesn't include this section." />;

  const supabase = await createSupabaseServerClient();
  let query = supabase.from(res.table).select("*").order(res.orderBy.column, { ascending: res.orderBy.ascending, nullsFirst: false }).limit(500);
  if (res.publishable && sp.status && ["draft", "published", "archived"].includes(sp.status)) query = query.eq("status", sp.status);
  const q = (sp.q ?? "").trim().slice(0, 100);
  if (q) query = query.ilike(res.titleColumn, `%${q.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];

  // Ministry managers: mark which rows they can edit (RLS enforces this regardless).
  const editable = (r: Record<string, unknown>) =>
    staff.canEditContent || (res.key === "ministries" ? staff.ministryIds.includes(String(r.id)) : res.key === "gallery" ? staff.ministryIds.includes(String(r.ministry_id)) : false);
  const canCreate = staff.canEditContent || (res.key === "gallery" && staff.ministryIds.length > 0);

  return (
    <>
      <PageTitle
        title={res.label}
        description={res.description}
        actions={canCreate && <Link href={`/admin/${res.key}/new`} className={btnPrimary}><Plus className="h-4 w-4" aria-hidden />New {res.singular.toLowerCase()}</Link>}
      />
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={q} placeholder={`Search ${res.label.toLowerCase()}…`} className={`${inputCls} max-w-xs`} />
        {res.publishable && (
          <select name="status" defaultValue={sp.status ?? ""} className={`${inputCls} w-auto`} aria-label="Status">
            <option value="">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option>
          </select>
        )}
        <button type="submit" className="rounded-md border border-line bg-white px-4 text-sm font-semibold hover:bg-mist">Filter</button>
      </form>
      {error ? (
        <EmptyState title="Could not load items" text={error.message} />
      ) : rows.length === 0 ? (
        <EmptyState title={`No ${res.label.toLowerCase()} yet`} text={q ? "Try a different search." : undefined}
          action={canCreate && <Link href={`/admin/${res.key}/new`} className={btnPrimary}>Create the first one</Link>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{res.fields.find((f) => f.name === res.titleColumn)?.label ?? "Title"}</th>
                {res.publishable && <th className="px-4 py-3 font-semibold">Status</th>}
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)} className="border-b border-line last:border-0 hover:bg-[#f7f9fc]">
                  <td className="px-4 py-3">
                    {editable(r) ? (
                      <Link href={`/admin/${res.key}/${r.id}`} className="font-medium text-ink hover:text-blue">{String(r[res.titleColumn] ?? "Untitled") || "Untitled"}</Link>
                    ) : <span className="font-medium text-ink">{String(r[res.titleColumn] ?? "Untitled")}</span>}
                    {res.subtitle && <span className="block text-xs text-muted">{res.subtitle(r)}</span>}
                  </td>
                  {res.publishable && <td className="px-4 py-3"><StatusBadge status={String(r.status)} publishedAt={r.published_at as string | null} /></td>}
                  <td className="px-4 py-3 text-muted">{fmtDate((r.updated_at ?? r.created_at) as string | null)}</td>
                  <td className="px-4 py-3">
                    <RowActions resource={res.key} id={String(r.id)} status={res.publishable ? String(r.status) : undefined}
                      canEdit={editable(r)} canPublish={staff.canEditContent && res.publishable}
                      canDelete={staff.canEditContent} previewHref={res.publishable ? `/admin/${res.key}/${r.id}/preview` : undefined} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
