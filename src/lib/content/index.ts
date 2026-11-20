import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, publicStorageUrl } from "@/lib/supabase/config";
import { seed } from "./seed";
import type {
  Announcement, ChurchEvent, GalleryCategory, GalleryItem, HomepageSection, Leader, Media, Ministry,
  Sermon, SermonCategory, SiteSettings,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Same as Postgres md5('<seed id>')::uuid. */
function seedUuid(id: string) {
  const h = createHash("md5").update(id).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** "seed" = Supabase not configured; content comes from the verified seed (read-only preview). */
export const contentSource = (): "database" | "seed" => (isSupabaseConfigured ? "database" : "seed");

function db() {
  return createSupabaseAnonClient();
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Failed to load ${what}: ${res.error.message}`);
  return res.data as T;
}


/* ---------------------------------------------------------------- resilience
   If the database is unreachable or not migrated yet, serve the verified seed content
   instead of failing the page (or the build). Retries the database after 60 seconds. */
let dbDownUntil = 0;
function dbReady() {
  return isSupabaseConfigured && Date.now() >= dbDownUntil;
}
function withSeedFallback<A extends unknown[], R>(what: string, fn: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R> => {
    const usedDb = dbReady(); // decided per call: concurrent failures must each fall back
    try {
      return await fn(...args);
    } catch (error) {
      if (!usedDb) throw error; // the seed path itself failed: a real bug, surface it
      dbDownUntil = Date.now() + 60_000;
      console.error(`[content] ${what}: database unavailable, serving seed content for 60s:`, error instanceof Error ? error.message : error);
      return fn(...args);
    }
  };
}

// ------------------------------------------------------------------ mappers
export function mapMedia(r: Row | null | undefined): Media | null {
  if (!r) return null;
  const url = r.external_url ? String(r.external_url) : r.path ? publicStorageUrl(r.path) : "";
  return {
    id: r.id, url, kind: r.kind, alt: r.alt_text ?? "", credit: r.credit, sourceUrl: r.source_url,
    width: r.width, height: r.height, category: r.category,
  };
}

const mapLeader = (r: Row): Leader => ({
  id: r.id, slug: r.slug, name: r.name, title: r.title, roleGroup: r.role_group, bio: r.bio,
  photo: mapMedia(r.photo), instagram: r.instagram, needsReview: r.needs_review, sortOrder: r.sort_order,
});

const mapMinistry = (r: Row): Ministry => ({
  id: r.id, slug: r.slug, name: r.name, tagline: r.tagline, summary: r.summary, description: r.description,
  image: mapMedia(r.image), meetingSchedule: r.meeting_schedule, location: r.location, contactEmail: r.contact_email,
  activities: r.activities ?? [], joinUrl: r.join_url, sortOrder: r.sort_order,
  leaders: ((r.ministry_leaders ?? []) as Row[])
    .filter((ml) => ml.leader)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ml) => ({ leader: mapLeader(ml.leader), roleTitle: ml.role_title })),
});

export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const mapSermon = (r: Row): Sermon => {
  const yt = youTubeId(r.video_url);
  return {
    id: r.id, slug: r.slug, title: r.title, speakerName: r.speaker?.name ?? r.speaker_name ?? "",
    speaker: r.speaker ? mapLeader(r.speaker) : null, description: r.description, scripture: r.scripture,
    series: r.series, category: r.category ? { id: r.category.id, slug: r.category.slug, name: r.category.name } : null,
    videoUrl: r.video_url, audioUrl: r.audio_url,
    thumbnail: mapMedia(r.thumbnail)?.url ?? (yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : null),
    preachedOn: r.preached_on, isFeatured: r.is_featured, sourceNote: r.source_note,
  };
};

const mapEvent = (r: Row): ChurchEvent => ({
  id: r.id, slug: r.slug, title: r.title, summary: r.summary, description: r.description, category: r.category,
  startsAt: r.starts_at, endsAt: r.ends_at, venue: r.venue, address: r.address, registrationUrl: r.registration_url,
  image: mapMedia(r.image), isFeatured: r.is_featured,
});

const LEADER_SELECT = "*, photo:media_assets(*)";
const MINISTRY_SELECT = `*, image:media_assets(*), ministry_leaders(role_title, sort_order, leader:leadership(${LEADER_SELECT}))`;
const SERMON_SELECT = `*, category:sermon_categories(*), speaker:leadership(${LEADER_SELECT}), thumbnail:media_assets(*)`;
const EVENT_SELECT = "*, image:media_assets(*)";

// ------------------------------------------------------------------ settings
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const _getSettings = (async (): Promise<SiteSettings> => {
  if (!dbReady()) return seed.settings;
  const rows = must(await db().from("site_settings").select("key, value"), "settings") as Row[];
  const merged: Row = { ...seed.settings };
  for (const r of rows) {
    if (r.key.startsWith("site.")) merged[camel(r.key.slice(5))] = r.value;
  }
  return merged as SiteSettings;
});

// ------------------------------------------------------------------ media
const _getMediaByIds = (async (ids: string[]): Promise<Record<string, Media>> => {
  const wanted = [...new Set(ids.filter(Boolean))];
  if (!wanted.length) return {};
  if (!dbReady()) {
    return Object.fromEntries(seed.media.filter((m) => wanted.includes(m.id)).map((m) => [m.id, m]));
  }
  // Seed ids ("ig-rw-04") map to md5-derived uuids in the database (scripts/generate-seed.mjs).
  const toUuid = new Map(wanted.map((id) => [UUID_RE.test(id) ? id : seedUuid(id), id]));
  const rows = must(await db().from("media_assets").select("*").in("id", [...toUuid.keys()]), "media") as Row[];
  return Object.fromEntries(rows.map((r) => [toUuid.get(r.id) ?? r.id, mapMedia(r)!]));
});

// ------------------------------------------------------------------ homepage
const _getHomepage = (async (): Promise<HomepageSection[]> => {
  if (!dbReady()) return seed.homepage.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = must(
    await db().from("homepage_sections").select("*").eq("is_visible", true).order("sort_order"), "homepage",
  ) as Row[];
  return rows.map((r) => ({
    key: r.key, kicker: r.kicker, title: r.title, body: r.body, data: r.data ?? {}, sortOrder: r.sort_order, isVisible: r.is_visible,
  }));
});

// ------------------------------------------------------------------ people
const _getLeaders = (async (): Promise<Leader[]> => {
  if (!dbReady()) return seed.leaders;
  return (must(await db().from("leadership").select(LEADER_SELECT).order("sort_order"), "leaders") as Row[]).map(mapLeader);
});

// ------------------------------------------------------------------ ministries
const _getMinistries = (async (): Promise<Ministry[]> => {
  if (!dbReady()) return seed.ministries;
  return (must(await db().from("ministries").select(MINISTRY_SELECT).order("sort_order"), "ministries") as Row[]).map(mapMinistry);
});

const _getMinistry = (async (slug: string): Promise<Ministry | null> => {
  if (!dbReady()) return seed.ministries.find((m) => m.slug === slug) ?? null;
  const r = must(await db().from("ministries").select(MINISTRY_SELECT).eq("slug", slug).maybeSingle(), "ministry") as Row | null;
  return r ? mapMinistry(r) : null;
});

// ------------------------------------------------------------------ sermons
export interface SermonQuery { q?: string; category?: string; speaker?: string; series?: string }

const _getSermonCategories = (async (): Promise<SermonCategory[]> => {
  if (!dbReady()) return seed.sermonCategories;
  return must(await db().from("sermon_categories").select("id, slug, name").order("sort_order"), "sermon categories") as SermonCategory[];
});

async function _getSermons(query: SermonQuery = {}): Promise<Sermon[]> {
  let list: Sermon[];
  if (!dbReady()) {
    list = [...seed.sermons];
  } else {
    let req = db().from("sermons").select(SERMON_SELECT).order("preached_on", { ascending: false, nullsFirst: false });
    if (query.q?.trim()) req = req.textSearch("search", query.q.trim(), { type: "websearch", config: "english" });
    list = (must(await req, "sermons") as Row[]).map(mapSermon);
  }
  if (!dbReady() && query.q?.trim()) {
    const words = query.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((s) => {
      const hay = [s.title, s.speakerName, s.scripture, s.series, s.description].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  if (query.category) list = list.filter((s) => s.category?.slug === query.category);
  if (query.speaker) list = list.filter((s) => s.speakerName === query.speaker);
  if (query.series) list = list.filter((s) => s.series === query.series);
  return list.sort((a, b) => (b.preachedOn ?? "").localeCompare(a.preachedOn ?? ""));
}

const _getSermon = (async (slug: string): Promise<Sermon | null> => {
  if (!dbReady()) return seed.sermons.find((s) => s.slug === slug) ?? null;
  const r = must(await db().from("sermons").select(SERMON_SELECT).eq("slug", slug).maybeSingle(), "sermon") as Row | null;
  return r ? mapSermon(r) : null;
});

// ------------------------------------------------------------------ events
async function _getEvents(when: "upcoming" | "past" | "all" = "all"): Promise<ChurchEvent[]> {
  let list: ChurchEvent[];
  if (!dbReady()) list = [...seed.events];
  else list = (must(await db().from("events").select(EVENT_SELECT).order("starts_at"), "events") as Row[]).map(mapEvent);
  const now = Date.now();
  const end = (e: ChurchEvent) => new Date(e.endsAt ?? e.startsAt).getTime();
  if (when === "upcoming") return list.filter((e) => end(e) >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  if (when === "past") return list.filter((e) => end(e) < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return list;
}

const _getEvent = (async (slug: string): Promise<ChurchEvent | null> => {
  if (!dbReady()) return seed.events.find((e) => e.slug === slug) ?? null;
  const r = must(await db().from("events").select(EVENT_SELECT).eq("slug", slug).maybeSingle(), "event") as Row | null;
  return r ? mapEvent(r) : null;
});

// ------------------------------------------------------------------ gallery
const _getGalleryCategories = (async (): Promise<GalleryCategory[]> => {
  if (!dbReady()) return seed.galleryCategories;
  return must(await db().from("gallery_categories").select("id, slug, name").order("sort_order"), "gallery categories") as GalleryCategory[];
});

const _getGallery = (async (): Promise<GalleryItem[]> => {
  if (!dbReady()) return seed.gallery;
  const rows = must(
    await db().from("gallery_items").select("*, media:media_assets(*), category:gallery_categories(id, slug, name)").order("sort_order"),
    "gallery",
  ) as Row[];
  return rows.filter((r) => r.media).map((r) => ({
    id: r.id, media: mapMedia(r.media)!, category: r.category, title: r.title, caption: r.caption,
  }));
});

// ------------------------------------------------------------------ announcements
const _getAnnouncements = (async (): Promise<Announcement[]> => {
  if (!dbReady()) return seed.announcements;
  const rows = must(
    await db().from("announcements").select("*").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("is_pinned", { ascending: false }).order("published_at", { ascending: false }),
    "announcements",
  ) as Row[];
  return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, linkUrl: r.link_url, linkLabel: r.link_label, isPinned: r.is_pinned }));
});

// ------------------------------------------------------------------ public API (with seed fallback)
export const getSettings = cache(withSeedFallback("getSettings", _getSettings));
export const getMediaByIds = cache(withSeedFallback("getMediaByIds", _getMediaByIds));
export const getHomepage = cache(withSeedFallback("getHomepage", _getHomepage));
export const getLeaders = cache(withSeedFallback("getLeaders", _getLeaders));
export const getMinistries = cache(withSeedFallback("getMinistries", _getMinistries));
export const getMinistry = cache(withSeedFallback("getMinistry", _getMinistry));
export const getSermonCategories = cache(withSeedFallback("getSermonCategories", _getSermonCategories));
export const getSermon = cache(withSeedFallback("getSermon", _getSermon));
export const getEvent = cache(withSeedFallback("getEvent", _getEvent));
export const getGalleryCategories = cache(withSeedFallback("getGalleryCategories", _getGalleryCategories));
export const getGallery = cache(withSeedFallback("getGallery", _getGallery));
export const getAnnouncements = cache(withSeedFallback("getAnnouncements", _getAnnouncements));
export const getSermons = withSeedFallback("getSermons", _getSermons);
export const getEvents = withSeedFallback("getEvents", _getEvents);
