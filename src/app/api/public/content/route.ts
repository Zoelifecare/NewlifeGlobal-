import { NextResponse } from "next/server";
import {
  getAnnouncements, getEvents, getGallery, getGivingCatalog, getLeaders, getMinistries, getSermons, getSettings, youTubeId,
} from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

/**
 * Read-only feed of PUBLISHED church content for the public WordPress website.
 * Staff edit everything in /admin; the WordPress pages load this feed through /embed.js,
 * so changes appear there within about a minute. Nothing private is included
 * (published rows only, read with the public key under Row Level Security).
 */
export const dynamic = "force-dynamic";

const abs = (u: string | null | undefined) => (!u ? null : u.startsWith("/") ? `${siteUrl()}${u}` : u);

export async function GET() {
  const [settings, sermons, events, ministries, leaders, gallery, announcements, giving] = await Promise.all([
    getSettings(), getSermons(), getEvents("all"), getMinistries(), getLeaders(), getGallery(), getAnnouncements(), getGivingCatalog(),
  ]);
  const now = Date.now();

  const body = {
    updatedAt: new Date().toISOString(),
    church: {
      name: settings.name, tagline: settings.tagline, verse: settings.verse, address: settings.address,
      phone: settings.contact.phone, email: settings.contact.email, social: settings.social, services: settings.services,
    },
    announcements: announcements.map((a) => ({ title: a.title, body: a.body, linkUrl: a.linkUrl, linkLabel: a.linkLabel })),
    sermons: sermons.slice(0, 60).map((s) => ({
      slug: s.slug, title: s.title, speaker: s.speakerName, series: s.series, scripture: s.scripture, description: s.description,
      category: s.category?.name ?? null, preachedOn: s.preachedOn, featured: s.isFeatured,
      youtubeId: youTubeId(s.videoUrl), videoUrl: s.videoUrl, audioUrl: s.audioUrl, thumbnail: abs(s.thumbnail),
    })),
    events: events.map((e) => ({
      slug: e.slug, title: e.title, summary: e.summary, description: e.description, category: e.category,
      startsAt: e.startsAt, endsAt: e.endsAt, venue: e.venue, address: e.address, registrationUrl: e.registrationUrl,
      image: abs(e.image?.url), imageAlt: e.image?.alt ?? "", featured: e.isFeatured,
      upcoming: new Date(e.endsAt ?? e.startsAt).getTime() >= now,
    })),
    ministries: ministries.map((m) => ({
      slug: m.slug, name: m.name, tagline: m.tagline, summary: m.summary, description: m.description,
      schedule: m.meetingSchedule, location: m.location, activities: m.activities,
      image: abs(m.image?.url), imageAlt: m.image?.alt ?? "",
    })),
    leaders: leaders.map((l) => ({ name: l.name, title: l.title, bio: l.bio, photo: abs(l.photo?.url), group: l.roleGroup })),
    gallery: gallery.slice(0, 120).map((g) => ({ url: abs(g.media.url), alt: g.media.alt, caption: g.caption, category: g.category?.name ?? null })),
    giving: giving.methods.map((m) => ({
      kind: m.kind, label: m.label, description: m.description, instructions: m.instructions,
      handle: m.handle, url: m.url, location: m.location,
    })),
  };

  return NextResponse.json(body, {
    headers: {
      // published content is public, so any page may read it (read-only)
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
