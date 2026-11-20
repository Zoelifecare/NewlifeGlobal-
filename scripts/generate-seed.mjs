// Generates, from src/lib/content/seed.ts (Node >= 23 strips TS types natively):
//   supabase/seed.sql                 first-time starter content (insert ... on conflict do nothing)
//   supabase/identity-correction.sql  one-off fix for databases seeded before the 2026-11-20 identity
//                                     correction: removes Rwanda-related seed rows and updates identity content
// Deterministic UUIDs: md5('<seed id>')::uuid, so re-running is idempotent.
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S = await import(pathToFileURL(path.join(root, "src/lib/content/seed.ts")).href);
const { seed } = S;

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
// Same value as Postgres md5('<id>')::uuid, computed in JS so jsonb references can use it too.
const uuidFor = (v) => {
  const h = createHash("md5").update(v).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const id = (v) => (v ? `${q(uuidFor(v))}::uuid` : "null");
const remapMediaIds = (o) => JSON.parse(JSON.stringify(o), (k, v) =>
  typeof v === "string" && /mediaid$/i.test(k) ? uuidFor(v) : v);
const arr = (a) => `array[${a.map(q).join(",")}]::text[]`;
const json = (o) => `${q(JSON.stringify(o))}::jsonb`;
const settingKey = (k) => `site.${k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())}`;

function block(table, cols, rows, conflict, onConflict = "do nothing") {
  if (!rows.length) return "";
  return `insert into public.${table} (${cols.join(", ")}) values\n  ${rows.map((r) => `(${r.join(", ")})`).join(",\n  ")}\non conflict (${conflict}) ${onConflict};\n`;
}
const updateAll = (cols, except = []) => `do update set ${cols.filter((c) => !except.includes(c)).map((c) => `${c} = excluded.${c}`).join(", ")}`;

// ------------------------------------------------------------------ row builders
const settingsRows = Object.entries(seed.settings).map(([k, v]) => [q(settingKey(k)), json(v)]);
const mediaCols = ["id", "external_url", "kind", "alt_text", "credit", "source_url", "category", "permission_status", "permission_note"];
const mediaRows = seed.media.map((m) => [id(m.id), q(m.url), q(m.kind), q(m.alt), q(m.credit), q(m.sourceUrl), q(m.category),
  "'owner_approved'", q("Owner approved use of @newlifeglobalaz photos on 2026-11-19 (OD-6)")]);
const leaderCols = ["id", "slug", "name", "title", "role_group", "bio", "photo_id", "instagram", "needs_review", "sort_order", "status", "publish_sermons_anywhere"];
const leaderRows = seed.leaders.map((l) => [id(l.id), q(l.slug), q(l.name), q(l.title), q(l.roleGroup), q(l.bio), id(l.photo?.id), q(l.instagram),
  String(l.needsReview), String(l.sortOrder), "'published'", String(S.publishAnywhereLeaders.includes(l.id))]);
const ministryCols = ["id", "slug", "name", "tagline", "summary", "description", "image_id", "meeting_schedule", "location", "contact_email", "activities", "join_url", "sort_order", "status", "is_featured"];
const ministryRows = seed.ministries.map((x) => [id(x.id), q(x.slug), q(x.name), q(x.tagline), q(x.summary), q(x.description), id(x.image?.id), q(x.meetingSchedule),
  q(x.location), q(x.contactEmail), arr(x.activities), q(x.joinUrl), String(x.sortOrder), "'published'", String(x.isFeatured)]);
const mlRows = seed.ministries.flatMap((x) => x.leaders.map((l) => [id(x.id), id(l.leader.id), q(l.roleTitle)]));
const catRows = seed.sermonCategories.map((c, i) => [id(c.id), q(c.slug), q(c.name), String(i)]);
const sermonCols = ["id", "slug", "title", "speaker_id", "speaker_name", "description", "scripture", "series", "category_id", "video_url", "audio_url", "preached_on",
  "is_featured", "source_note", "location", "preached_in_arizona", "preacher_verified", "location_verified", "status", "published_at"];
const sermonRows = seed.sermons.map((s) => {
  const meta = S.seedSermonMeta[s.id];
  return [id(s.id), q(s.slug), q(s.title), id(s.speaker?.id), q(s.speakerName), q(s.description), q(s.scripture), q(s.series), id(s.category?.id), q(s.videoUrl), q(s.audioUrl),
    q(s.preachedOn), String(s.isFeatured), q(s.sourceNote), q(meta.location), String(meta.preachedInArizona), String(meta.preacherVerified), String(meta.locationVerified),
    "'published'", s.preachedOn ? `${q(s.preachedOn)}::timestamptz` : "now()"];
});
const eventCols = ["id", "slug", "title", "summary", "description", "category", "starts_at", "ends_at", "venue", "address", "registration_url", "image_id", "is_featured", "ministry_id", "status"];
const eventRows = seed.events.map((e) => [id(e.id), q(e.slug), q(e.title), q(e.summary), q(e.description), q(e.category), q(e.startsAt), q(e.endsAt), q(e.venue), q(e.address),
  q(e.registrationUrl), id(e.image?.id), String(e.isFeatured), id(e.ministryId ?? null), "'published'"]);
const albumCols = ["id", "slug", "name", "description", "sort_order", "is_visible"];
const albumRows = seed.galleryCategories.map((c, i) => [id(c.id), q(c.slug), q(c.name), q(c.description ?? null), String(i), "true"]);
const galleryRows = seed.gallery.map((g, i) => [id(g.id), id(g.media.id), id(g.category?.id), q(g.title), q(g.caption), String(i), "'published'"]);
const annRows = seed.announcements.map((a) => [id(a.id), q(a.title), q(a.body), q(a.linkUrl), q(a.linkLabel), String(a.isPinned), "'published'"]);
const homeCols = ["key", "kicker", "title", "body", "data", "sort_order", "is_visible"];
const homeRows = seed.homepage.map((h) => [q(h.key), q(h.kicker), q(h.title), q(h.body), json(remapMediaIds(h.data)), String(h.sortOrder), String(h.isVisible)]);
const ccCols = ["key", "label", "sort_order", "requires_approval", "draft", "published", "status", "review_note", "published_at"];
const ccRows = seed.churchContent.map((c) => [q(c.key), q(c.label), String(c.sortOrder), String(c.requiresApproval), json(c.draft),
  c.published ? json(c.published) : "null", q(c.status), q(c.note ?? null), c.published ? "now()" : "null"]);

// ------------------------------------------------------------------ seed.sql
const seedSql = [
  "-- GENERATED by scripts/generate-seed.mjs from src/lib/content/seed.ts. Do not edit by hand.\n",
  block("site_settings", ["key", "value"], settingsRows, "key"),
  block("media_assets", mediaCols, mediaRows, "id"),
  block("leadership", leaderCols, leaderRows, "id"),
  block("ministries", ministryCols, ministryRows, "id"),
  block("ministry_leaders", ["ministry_id", "leadership_id", "role_title"], mlRows, "ministry_id, leadership_id"),
  block("sermon_categories", ["id", "slug", "name", "sort_order"], catRows, "id"),
  block("sermons", sermonCols, sermonRows, "id"),
  block("events", eventCols, eventRows, "id"),
  block("gallery_categories", albumCols, albumRows, "id"),
  block("gallery_items", ["id", "media_id", "category_id", "title", "caption", "sort_order", "status"], galleryRows, "id"),
  block("announcements", ["id", "title", "body", "link_url", "link_label", "is_pinned", "status"], annRows, "id"),
  block("homepage_sections", homeCols, homeRows, "key"),
  block("church_content", ccCols, ccRows, "key"),
].join("\n");
await writeFile(path.join(root, "supabase", "seed.sql"), seedSql);

// ------------------------------------------------------------------ identity-correction.sql
const removedSeedIds = {
  sermons: ["sm-25-years", "sm-courage", "sm-stretch", "sm-consecrate", "sm-strength", "sm-lengthen", "sm-kwizera"],
  sermon_categories: ["sc-faith", "sc-special"],
  media_assets: ["yt-25-years", "yt-courage"],
  gallery_categories: ["gc-rwanda"],
};
const removedGallery = ["yt-25-years", "yt-courage"].map(uuidFor);
const fix = [
  "-- GENERATED by scripts/generate-seed.mjs. Run ONCE in the Supabase SQL editor on databases that were seeded",
  "-- before 2026-11-20. Applies the owner's identity correction: New Life Global is an independent US church,",
  "-- so Rwanda / Kigali / Africa New Life content seeded earlier is removed or replaced. Safe to re-run.",
  "-- Run AFTER supabase/migrations/20261120000100_cms.sql.",
  "begin;",
  `delete from public.gallery_items where media_id in (${removedGallery.map((u) => `'${u}'`).join(", ")});`,
  ...Object.entries(removedSeedIds).map(([t, ids]) => `delete from public.${t} where id in (${ids.map((x) => `'${uuidFor(x)}'`).join(", ")});`),
  "delete from public.homepage_sections where key = 'global';",
  "delete from public.site_settings where key = 'site.affiliation';",
  block("site_settings", ["key", "value"], settingsRows, "key", "do update set value = excluded.value"),
  block("media_assets", mediaCols, mediaRows, "id", updateAll(mediaCols, ["id"])),
  block("leadership", leaderCols, leaderRows, "id", updateAll(leaderCols, ["id", "status"])),
  block("ministries", ministryCols, ministryRows, "id", updateAll(ministryCols, ["id", "status", "slug"])),
  block("sermon_categories", ["id", "slug", "name", "sort_order"], catRows, "id"),
  block("sermons", sermonCols, sermonRows, "id", updateAll(sermonCols, ["id"])),
  block("events", eventCols, eventRows, "id", updateAll(eventCols, ["id", "status"])),
  block("gallery_categories", albumCols, albumRows, "id", updateAll(albumCols, ["id"])),
  block("announcements", ["id", "title", "body", "link_url", "link_label", "is_pinned", "status"], annRows, "id", "do update set title = excluded.title, body = excluded.body"),
  block("homepage_sections", homeCols, homeRows, "key", updateAll(homeCols, ["key"])),
  block("church_content", ccCols, ccRows, "key"),
  "commit;",
  "notify pgrst, 'reload schema';",
].join("\n");
await writeFile(path.join(root, "supabase", "identity-correction.sql"), fix);
console.log("supabase/seed.sql and supabase/identity-correction.sql written");
