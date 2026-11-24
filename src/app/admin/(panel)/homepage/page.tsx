import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMediaLibrary } from "@/lib/admin/loaders";
import { PageTitle } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";

export default async function HomepageAdmin() {
  await requireCapability("content");
  const supabase = await createSupabaseServerClient();
  const [{ data }, media] = await Promise.all([
    supabase.from("homepage_sections").select("*").order("sort_order"),
    loadMediaLibrary(),
  ]);
  return (
    <>
      <PageTitle title="Homepage" description="Edit the hero slides and every homepage section. Show, hide or reorder sections with the Order number. Featured messages and events are chosen with the “Featured” switch on each sermon or event." />
      <HomepageEditor sections={(data ?? []) as never[]} media={media} />
    </>
  );
}
