import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapMedia } from "@/lib/content";
import type { Media } from "@/lib/content/types";
import type { Resource } from "./resources";

export interface Option { value: string; label: string }

/** Options for every relation field in a resource (loaded with the staff session). */
export async function loadRelationOptions(res: Resource): Promise<Record<string, Option[]>> {
  const supabase = await createSupabaseServerClient();
  const out: Record<string, Option[]> = {};
  await Promise.all(res.fields.filter((f) => f.relation).map(async (f) => {
    const { table, label, order } = f.relation!;
    const { data } = await supabase.from(table).select(`id, ${label}`).order(order ?? label).limit(500);
    out[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[label] ?? "(untitled)" }));
  }));
  if (res.fields.some((f) => f.type === "ministryLeaders")) {
    const { data } = await supabase.from("leadership").select("id, name, title").order("sort_order");
    out.__leaders = ((data ?? []) as { id: string; name: string; title: string }[]).map((l) => ({ value: l.id, label: `${l.name} — ${l.title}` }));
  }
  return out;
}

export async function loadMediaLibrary(limit = 300): Promise<Media[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("media_assets").select("*").in("kind", ["image"]).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => mapMedia(r)!);
}
