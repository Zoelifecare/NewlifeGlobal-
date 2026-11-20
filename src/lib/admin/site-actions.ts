"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/staff";
import type { ActionResult } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const link = (v: unknown) => { const s = txt(v, 300); return s.startsWith("/") || s.startsWith("#") || /^https:\/\//.test(s) ? s : ""; };

async function editor() {
  const staff = await requireStaff();
  if (!staff.canEditContent) throw new Error("forbidden");
  return createSupabaseServerClient();
}

/* ------------------------------------------------------------------ homepage */
export async function saveHomepageSection(key: string, payload: {
  kicker: string; title: string; body: string; isVisible: boolean; sortOrder: number; data: Record<string, unknown>;
}): Promise<ActionResult> {
  let supabase;
  try { supabase = await editor(); } catch { return { ok: false, message: "You don't have permission to edit the homepage." }; }
  const data = sanitizeSectionData(key, payload.data);
  if (typeof data === "string") return { ok: false, message: data };
  const { error } = await supabase.from("homepage_sections").update({
    kicker: txt(payload.kicker, 120) || null, title: txt(payload.title, 200) || null, body: txt(payload.body, 2000) || null,
    is_visible: Boolean(payload.isVisible), sort_order: Math.max(0, Math.min(999, Math.trunc(Number(payload.sortOrder) || 0))), data,
  }).eq("key", key);
  if (error) return { ok: false, message: "Could not save this section." };
  revalidatePath("/");
  return { ok: true, message: "Section saved." };
}

function sanitizeSectionData(key: string, d: Record<string, unknown>): Record<string, unknown> | string {
  const media = (v: unknown) => (typeof v === "string" && (UUID.test(v) || /^[a-z0-9-]+$/.test(v)) ? v : undefined);
  const yt = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : undefined);
  const cta = (c: unknown) => { const o = (c ?? {}) as Record<string, unknown>; return { label: txt(o.label, 60), href: link(o.href) }; };
  if (key === "hero") {
    const slides = Array.isArray(d.slides) ? d.slides.slice(0, 5) : [];
    if (!slides.length) return "Add at least one hero slide.";
    const out = {
      primaryCta: cta(d.primaryCta), secondaryCta: cta(d.secondaryCta),
      slides: slides.map((s: Record<string, unknown>, i: number) => {
        const v = (s.video ?? {}) as Record<string, unknown>;
        const videoId = yt(v.id);
        return {
          index: String(i + 1).padStart(2, "0"), label: txt(s.label, 60), caption: txt(s.caption, 120),
          headline: txt(s.headline, 160), body: txt(s.body, 500), mediaId: media(s.mediaId) ?? null, alt: txt(s.alt, 200),
          featured: s.featured !== false,
          video: videoId ? { id: videoId, title: txt(v.title, 120), href: link(v.href) || "/messages" } : null,
          assetNote: txt(s.assetNote, 300),
        };
      }),
    };
    const shown = (out.slides as { featured: boolean }[]).filter((x) => x.featured).length;
    if (!shown) return "Feature at least one slide.";
    return out;
  }
  if (key === "chapters") {
    const chapters = Array.isArray(d.chapters) ? d.chapters.slice(0, 6) : [];
    return {
      chapters: chapters.map((c: Record<string, unknown>, i: number) => ({
        index: String(i + 1).padStart(2, "0"), title: txt(c.title, 80), lead: txt(c.lead, 200), body: txt(c.body, 1500),
        points: (Array.isArray(c.points) ? c.points : []).map((p) => txt(p, 80)).filter(Boolean).slice(0, 6),
        mediaId: media(c.mediaId), videoId: yt(c.videoId), cta: cta(c.cta),
      })),
    };
  }
  // other sections: keep JSON but bound its size
  const json = JSON.stringify(d ?? {});
  if (json.length > 20000) return "Section data is too large.";
  return JSON.parse(json);
}

/* ------------------------------------------------------------------ site settings */
export async function saveSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let supabase;
  try { supabase = await editor(); } catch { return { ok: false, message: "You don't have permission to change settings." }; }
  const email = txt(fd.get("contact_email"), 254);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Enter a valid public email address.", fieldErrors: { contact_email: "Invalid email" } };
  let services: unknown, social: unknown;
  try {
    services = (JSON.parse(String(fd.get("services") ?? "[]")) as Record<string, unknown>[]).slice(0, 12).map((s) => ({
      name: txt(s.name, 80), day: txt(s.day, 80), time: txt(s.time, 60), location: txt(s.location, 160), ...(txt(s.note, 160) ? { note: txt(s.note, 160) } : {}),
    })).filter((s) => s.name);
    social = (JSON.parse(String(fd.get("social") ?? "[]")) as Record<string, unknown>[]).slice(0, 10)
      .map((s) => ({ label: txt(s.label, 60), url: txt(s.url, 300) })).filter((s) => s.label && /^https:\/\//.test(s.url));
  } catch { return { ok: false, message: "Could not read the service times or social links." }; }

  const rows: { key: string; value: unknown }[] = [
    { key: "site.name", value: txt(fd.get("name"), 80) || "New Life Global" },
    { key: "site.short_name", value: txt(fd.get("short_name"), 80) },
    { key: "site.tagline", value: txt(fd.get("tagline"), 120) },
    { key: "site.statement", value: txt(fd.get("statement"), 200) },
    { key: "site.pillars", value: txt(fd.get("pillars"), 300).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 5) },
    { key: "site.verse", value: { ref: txt(fd.get("verse_ref"), 60), text: txt(fd.get("verse_text"), 500) } },
    { key: "site.address", value: {
      line1: txt(fd.get("address_line1"), 120), city: txt(fd.get("address_city"), 80), region: txt(fd.get("address_region"), 20),
      postal: txt(fd.get("address_postal"), 20), country: "USA",
      mapQuery: `${txt(fd.get("address_line1"), 120)}, ${txt(fd.get("address_city"), 80)}, ${txt(fd.get("address_region"), 20)} ${txt(fd.get("address_postal"), 20)}`,
    } },
    { key: "site.contact", value: { email: email || null, phone: txt(fd.get("contact_phone"), 40) || null } },
    { key: "site.services", value: services },
    { key: "site.social", value: social },
  ];
  // logo: a file from the media library (local /media path or Supabase storage URL)
  const logo = txt(fd.get("logo_url"), 500);
  if (logo) {
    const okLogo = logo.startsWith("/media/") || /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(logo);
    if (!okLogo) return { ok: false, message: "Choose the logo from the media library." };
    rows.push({ key: "site.logo", value: { color: logo, white: logo, alt: txt(fd.get("name"), 80) || "New Life Global" } });
  }
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, message: "Could not save settings." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. The website will update within a few minutes." };
}
