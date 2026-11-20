import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { getResource } from "@/lib/admin/resources";
import { loadMediaLibrary, loadRelationOptions } from "@/lib/admin/loaders";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResourceForm } from "@/components/admin/resource-form";
import { EmptyState, PageTitle, StatusBadge } from "@/components/admin/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditResource({ params, searchParams }: {
  params: Promise<{ resource: string; id: string }>; searchParams: Promise<{ created?: string }>;
}) {
  const [{ resource, id }, sp] = await Promise.all([params, searchParams]);
  const res = getResource(resource);
  if (!res) notFound();
  const staff = await requireStaff();
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  const managerOnly = !staff.canEditContent;
  if (managerOnly && res.scope !== "ministry") return <EmptyState title="Not available" text="Your role doesn't include this section." />;
  if (isNew && managerOnly && res.key !== "gallery" && res.key !== "events") return <EmptyState title="Not available" text="Only content editors can create new items here." />;

  let row: Record<string, unknown> = {};
  if (!isNew) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from(res.table).select(res.select ?? "*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data as unknown as Record<string, unknown>;
    if (managerOnly) {
      const mid = res.key === "ministries" ? row.id : row.ministry_id;
      if (!staff.ministryIds.includes(String(mid))) return <EmptyState title="Read only" text="You can edit only the ministries assigned to you." />;
    }
  } else {
    if (res.publishable) row.status = "draft";
    if (res.key === "gallery-categories") row.is_visible = true;
  }

  const [options, media] = await Promise.all([loadRelationOptions(res), loadMediaLibrary()]);
  if (managerOnly && (res.key === "gallery" || res.key === "events")) {
    options.ministry_id = (options.ministry_id ?? []).filter((o) => staff.ministryIds.includes(o.value));
  }
  const title = isNew ? `New ${res.singular.toLowerCase()}` : String(row[res.titleColumn] ?? res.singular);
  const live = !isNew && row.status === "published" && row.published_at && new Date(String(row.published_at)) <= new Date();

  return (
    <>
      <PageTitle
        title={title}
        back={{ href: `/admin/${res.key}`, label: res.label }}
        description={sp.created ? `${res.singular} created.` : undefined}
        actions={!isNew && res.publishable ? <StatusBadge status={String(row.status)} publishedAt={row.published_at as string | null} /> : undefined}
      />
      <ResourceForm
        key={String(row.updated_at ?? "new")}
        resourceKey={res.key}
        singular={res.singular}
        id={isNew ? null : id}
        fields={res.fields}
        initial={row}
        options={options}
        media={media}
        managerOnly={managerOnly}
        previewHref={res.publishable ? `/admin/${res.key}/${id}/preview` : undefined}
        publicHref={live && res.publicPath ? res.publicPath(row) : undefined}
      />
    </>
  );
}
