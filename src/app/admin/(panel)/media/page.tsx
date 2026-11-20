import { requireStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapMedia } from "@/lib/content";
import { PageTitle } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function MediaPage() {
  const staff = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(500);
  const items = (data ?? []).map((r) => ({
    ...mapMedia(r)!, caption: r.caption as string | null, permission: r.permission_status as string, note: r.permission_note as string | null,
    path: r.path as string | null, createdBy: r.created_by as string | null, createdAt: r.created_at as string,
    canEdit: staff.canEditContent || r.created_by === staff.id,
  }));
  return (
    <>
      <PageTitle title="Media library" description="Upload photos, video and audio. Every file records its source, credit and permission status. Replace any image on the site by choosing a different file here." />
      <MediaLibrary items={items} userId={staff.id} />
    </>
  );
}
