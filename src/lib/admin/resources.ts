/**
 * Declarative admin resources. One config drives list, create/edit form, validation,
 * server actions, preview and public-page revalidation.
 */
export type FieldType =
  | "text" | "textarea" | "slug" | "url" | "email" | "number" | "boolean" | "date" | "datetime"
  | "select" | "tags" | "media" | "relation" | "ministryLeaders";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  max?: number;
  rows?: number;
  options?: { value: string; label: string }[];
  relation?: { table: string; label: string; order?: string };
  /** Hidden from ministry managers (they may not change it). */
  editorOnly?: boolean;
  half?: boolean;
}

export interface Resource {
  key: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  titleColumn: string;
  subtitle?: (row: Record<string, unknown>) => string;
  orderBy: { column: string; ascending: boolean };
  publishable: boolean;
  /** "ministry" = ministry managers may edit rows they manage (ministries, gallery). */
  scope: "content" | "ministry";
  select?: string;
  fields: Field[];
  publicPath?: (row: Record<string, unknown>) => string;
  revalidate: string[];
}

const STATUS: Field = {
  name: "status", label: "Status", type: "select", required: true, editorOnly: true, half: true,
  options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }],
  help: "Drafts are visible only to staff.",
};
const PUBLISHED_AT: Field = {
  name: "published_at", label: "Publish at", type: "datetime", editorOnly: true, half: true,
  help: "Leave empty to publish now. A future time schedules publication (Arizona time).",
};
const SLUG: Field = { name: "slug", label: "URL slug", type: "slug", required: true, max: 120, help: "Lowercase words separated by hyphens. Generated from the title if left empty.", half: true };
const SORT: Field = { name: "sort_order", label: "Display order", type: "number", half: true, help: "Lower numbers appear first." };

export const RESOURCES: Resource[] = [
  {
    key: "ministries", table: "ministries", label: "Ministries", singular: "Ministry",
    description: "Ministry directory and individual ministry pages.",
    titleColumn: "name", subtitle: (r) => String(r.meeting_schedule ?? ""), orderBy: { column: "sort_order", ascending: true },
    publishable: true, scope: "ministry",
    select: "*, ministry_leaders(leadership_id, role_title, sort_order)",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120, half: true },
      { ...SLUG, editorOnly: true },
      { name: "tagline", label: "Tagline", type: "text", max: 120, half: true },
      { name: "meeting_schedule", label: "Meeting schedule", type: "text", max: 200, half: true },
      { name: "summary", label: "Short summary", type: "textarea", rows: 2, max: 300 },
      { name: "description", label: "Description", type: "textarea", rows: 8, max: 8000, help: "Separate paragraphs with a blank line." },
      { name: "image_id", label: "Photo", type: "media" },
      { name: "location", label: "Location", type: "text", max: 200, half: true },
      { name: "contact_email", label: "Contact email", type: "email", half: true },
      { name: "activities", label: "Activities", type: "tags", help: "One per line." },
      { name: "join_url", label: "Join / get involved link", type: "text", max: 300, help: "A page on this site (e.g. /contact?topic=worship) or a full URL." },
      { name: "leaders", label: "Ministry leaders", type: "ministryLeaders" },
      { name: "is_featured", label: "Feature on the homepage", type: "boolean", editorOnly: true, half: true },
      { ...SORT, editorOnly: true }, STATUS, PUBLISHED_AT,
    ],
    publicPath: (r) => `/ministries/${r.slug}`, revalidate: ["/", "/ministries", "/ministries/[slug]"],
  },
  {
    key: "sermons", table: "sermons", label: "Sermons", singular: "Sermon",
    description: "Messages: video, audio, scripture, series and speaker. Only verified sermons can be published: Pastor Charles' wherever he preached, other preachers only when preached at our Arizona church.",
    titleColumn: "title", subtitle: (r) => [r.speaker_name, r.preached_on].filter(Boolean).join(" · "), orderBy: { column: "preached_on", ascending: false },
    publishable: true, scope: "content",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      SLUG,
      { name: "preached_on", label: "Date preached", type: "date", half: true },
      { name: "speaker_id", label: "Speaker (leadership)", type: "relation", relation: { table: "leadership", label: "name", order: "sort_order" }, half: true },
      { name: "speaker_name", label: "Speaker name", type: "text", max: 120, half: true, help: "Shown when the speaker is a guest (not in Leadership)." },
      { name: "category_id", label: "Category", type: "relation", relation: { table: "sermon_categories", label: "name", order: "sort_order" }, half: true },
      { name: "series", label: "Series", type: "text", max: 120, half: true },
      { name: "scripture", label: "Scripture", type: "text", max: 200, half: true },
      { name: "description", label: "Description", type: "textarea", rows: 5, max: 4000 },
      { name: "video_url", label: "Video URL (YouTube)", type: "url", half: true },
      { name: "audio_url", label: "Audio URL", type: "url", half: true },
      { name: "thumbnail_id", label: "Thumbnail", type: "media", help: "Optional — the YouTube thumbnail is used when empty." },
      { name: "is_featured", label: "Featured message", type: "boolean", half: true },
      { name: "source_note", label: "Source / credit", type: "text", max: 200, half: true },
      { name: "location", label: "Where it was preached", type: "text", max: 200, help: "Church and city. Required for verification." },
      { name: "preached_in_arizona", label: "Preached at our Arizona church", type: "boolean", half: true },
      { name: "preacher_verified", label: "Preacher verified", type: "boolean", half: true },
      { name: "location_verified", label: "Preaching location verified", type: "boolean", half: true, help: "Publishing rules: Pastor Charles' sermons may be published wherever he preached. Other preachers only when preached at our Arizona church. Preacher and location must be verified first; unverified sermons stay unpublished." },
      STATUS, PUBLISHED_AT,
    ],
    publicPath: (r) => `/messages/${r.slug}`, revalidate: ["/", "/messages", "/messages/[slug]"],
  },
  {
    key: "events", table: "events", label: "Events", singular: "Event",
    description: "Upcoming and past events with dates, venue and registration.",
    titleColumn: "title", subtitle: (r) => String(r.starts_at ?? "").slice(0, 10), orderBy: { column: "starts_at", ascending: false },
    publishable: true, scope: "ministry",
    fields: [
      { name: "title", label: "Event name", type: "text", required: true, max: 200 },
      SLUG,
      { name: "category", label: "Category", type: "text", max: 60, half: true },
      { name: "starts_at", label: "Starts", type: "datetime", required: true, half: true },
      { name: "ends_at", label: "Ends", type: "datetime", half: true },
      { name: "summary", label: "Summary", type: "textarea", rows: 2, max: 300 },
      { name: "description", label: "Description", type: "textarea", rows: 8, max: 8000 },
      { name: "venue", label: "Venue", type: "text", max: 200, half: true },
      { name: "address", label: "Address", type: "text", max: 300, half: true },
      { name: "registration_url", label: "Registration URL", type: "url" },
      { name: "image_id", label: "Featured image", type: "media" },
      { name: "ministry_id", label: "Ministry", type: "relation", relation: { table: "ministries", label: "name", order: "sort_order" }, half: true, help: "Lets that ministry's managers manage this event." },
      { name: "is_featured", label: "Feature on homepage", type: "boolean", editorOnly: true, half: true },
      STATUS, PUBLISHED_AT,
    ],
    publicPath: (r) => `/events/${r.slug}`, revalidate: ["/", "/events", "/events/[slug]"],
  },
  {
    key: "announcements", table: "announcements", label: "Announcements", singular: "Announcement",
    description: "Short notices with an optional link.",
    titleColumn: "title", orderBy: { column: "created_at", ascending: false }, publishable: true, scope: "content",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "body", label: "Text", type: "textarea", rows: 3, max: 1000 },
      { name: "link_url", label: "Link", type: "text", max: 300, half: true },
      { name: "link_label", label: "Link label", type: "text", max: 60, half: true },
      { name: "is_pinned", label: "Pinned", type: "boolean", half: true },
      { name: "expires_at", label: "Expires", type: "datetime", half: true },
      STATUS, PUBLISHED_AT,
    ],
    revalidate: ["/"],
  },
  {
    key: "leadership", table: "leadership", label: "Leadership", singular: "Leader",
    description: "Pastors and ministry leaders.",
    titleColumn: "name", subtitle: (r) => String(r.title ?? ""), orderBy: { column: "sort_order", ascending: true }, publishable: true, scope: "content",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120, half: true },
      SLUG,
      { name: "title", label: "Title", type: "text", required: true, max: 120, half: true },
      { name: "role_group", label: "Group", type: "select", required: true, half: true, options: [{ value: "pastor", label: "Pastor" }, { value: "leader", label: "Ministry leader" }, { value: "staff", label: "Staff" }] },
      { name: "bio", label: "Biography", type: "textarea", rows: 6, max: 4000 },
      { name: "photo_id", label: "Profile photo", type: "media" },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "instagram", label: "Instagram URL", type: "url", half: true },
      { name: "needs_review", label: "Bio needs owner review", type: "boolean", half: true },
      { name: "publish_sermons_anywhere", label: "Sermons may be published wherever this person preached", type: "boolean", half: true, help: "Set only for Pastor Charles unless the pastor decides otherwise." },
      SORT, STATUS, PUBLISHED_AT,
    ],
    revalidate: ["/about", "/ministries/[slug]", "/messages/[slug]"],
  },
  {
    key: "gallery", table: "gallery_items", label: "Gallery", singular: "Gallery item",
    description: "Photos shown on the gallery page.",
    titleColumn: "caption", orderBy: { column: "sort_order", ascending: true }, publishable: true, scope: "ministry",
    select: "*, media:media_assets(external_url, path, alt_text)",
    fields: [
      { name: "media_id", label: "Photo", type: "media", required: true },
      { name: "title", label: "Title", type: "text", max: 200, half: true },
      { name: "category_id", label: "Category", type: "relation", relation: { table: "gallery_categories", label: "name", order: "sort_order" }, half: true },
      { name: "caption", label: "Caption", type: "textarea", rows: 2, max: 500 },
      { name: "ministry_id", label: "Ministry", type: "relation", relation: { table: "ministries", label: "name", order: "sort_order" }, half: true, help: "Lets that ministry's managers edit this item." },
      { name: "event_id", label: "Event", type: "relation", relation: { table: "events", label: "title", order: "starts_at" }, half: true },
      SORT, STATUS, PUBLISHED_AT,
    ],
    revalidate: ["/gallery"],
  },
  {
    key: "sermon-categories", table: "sermon_categories", label: "Sermon categories", singular: "Sermon category",
    description: "Categories used to filter messages.",
    titleColumn: "name", orderBy: { column: "sort_order", ascending: true }, publishable: false, scope: "content",
    fields: [{ name: "name", label: "Name", type: "text", required: true, max: 80, half: true }, SLUG, SORT],
    revalidate: ["/messages"],
  },
  {
    key: "gallery-categories", table: "gallery_categories", label: "Gallery albums", singular: "Album",
    description: "Albums group gallery photos. Hidden albums are not shown on the website.",
    titleColumn: "name", orderBy: { column: "sort_order", ascending: true }, publishable: false, scope: "content",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80, half: true }, SLUG,
      { name: "description", label: "Description", type: "textarea", rows: 2, max: 400 },
      { name: "cover_media_id", label: "Cover photo", type: "media" },
      { name: "is_visible", label: "Visible on the website", type: "boolean", half: true }, SORT,
    ],
    revalidate: ["/gallery"],
  },
];

export function getResource(key: string) {
  return RESOURCES.find((r) => r.key === key) ?? null;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

/** Arizona has no DST: fixed UTC-7. */
export const AZ_OFFSET = "-07:00";
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 7 * 3600_000);
  return d.toISOString().slice(0, 16);
}
export function fromLocalInput(v: string) {
  return v ? new Date(`${v}:00${AZ_OFFSET}`).toISOString() : null;
}
