import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { getResource } from "@/lib/admin/resources";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapMedia, youTubeId } from "@/lib/content";
import { StatusBadge, btnSecondary, fmtDate } from "@/components/admin/ui";
import { VideoEmbed } from "@/components/site/video-embed";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_FIELD: Record<string, string> = { ministries: "image_id", sermons: "thumbnail_id", events: "image_id", leadership: "photo_id", gallery: "media_id" };

/** Staff-only preview of draft/scheduled content, styled like the public site. */
export default async function PreviewResource({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const res = getResource(resource);
  if (!res || !UUID.test(id)) notFound();
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from(res.table).select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const row = data as Record<string, unknown>;
  const imgField = IMAGE_FIELD[res.key];
  let image = null;
  if (imgField && row[imgField]) {
    const { data: m } = await supabase.from("media_assets").select("*").eq("id", String(row[imgField])).maybeSingle();
    image = mapMedia(m);
  }
  const vid = youTubeId(row.video_url as string | null);
  const title = String(row[res.titleColumn] ?? "");
  const body = String(row.description ?? row.bio ?? row.body ?? row.caption ?? "");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Preview</strong> — this is how the {res.singular.toLowerCase()} will look. <StatusBadge status={String(row.status)} publishedAt={row.published_at as string | null} />
        <Link href={`/admin/${res.key}/${id}`} className={`${btnSecondary} ml-auto`}>Back to editor</Link>
      </div>
      <article className="overflow-hidden rounded-lg border border-line bg-white">
        {vid ? <VideoEmbed videoId={vid} title={title} /> : image ? (
          <div className="relative aspect-[16/8] bg-ink"><Image src={image.url} alt={image.alt} fill sizes="80vw" className="object-cover" /></div>
        ) : null}
        <div className="grid gap-4 p-[clamp(1.5rem,4vw,3rem)]">
          {res.key === "events" && <p className="nl-label">{fmtDate(row.starts_at as string, true)} · {String(row.venue ?? "")}</p>}
          {res.key === "sermons" && <p className="nl-label">{String(row.speaker_name ?? "")} {row.scripture ? `· ${row.scripture}` : ""}</p>}
          {res.key === "ministries" && row.tagline ? <p className="nl-label">{String(row.tagline)}</p> : null}
          {res.key === "leadership" && <p className="nl-label">{String(row.title ?? "")}</p>}
          <h1 className="nl-h1 !text-[clamp(2rem,4vw,3.4rem)]">{title || "Untitled"}</h1>
          {row.summary ? <p className="nl-lead">{String(row.summary)}</p> : null}
          {body && <div className="grid max-w-3xl gap-4 text-body">{body.split(/\n{2,}|\n/).map((p, i) => <p key={i} className="m-0">{p}</p>)}</div>}
          {Array.isArray(row.activities) && row.activities.length > 0 && (
            <ul className="flex flex-wrap gap-2">{(row.activities as string[]).map((a) => <li key={a} className="border border-line bg-paper px-3 py-1.5 text-sm">{a}</li>)}</ul>
          )}
        </div>
      </article>
    </div>
  );
}
