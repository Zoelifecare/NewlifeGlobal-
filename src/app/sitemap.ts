import type { MetadataRoute } from "next";
import { getEvents, getMinistries, getSermons } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [ministries, sermons, events] = await Promise.all([getMinistries(), getSermons(), getEvents()]);
  const pages = ["", "/about", "/ministries", "/messages", "/events", "/gallery", "/prayer", "/visit", "/contact", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...ministries.map((m) => ({ url: `${base}/ministries/${m.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...sermons.map((s) => ({ url: `${base}/messages/${s.slug}`, lastModified: s.preachedOn ?? undefined, priority: 0.5 })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, priority: 0.6 })),
  ];
}
