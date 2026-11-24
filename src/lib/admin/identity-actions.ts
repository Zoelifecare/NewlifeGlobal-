"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/staff";
import type { ActionResult } from "./actions";
import type { ChurchContentValue, GivingMethod, NavItem } from "@/lib/content/types";
import { requestWebsiteRebuild } from "@/lib/website-rebuild";

const KEY = /^[a-z0-9_]{2,60}$/;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function refreshPublicSite() {
  revalidatePath("/", "layout");
  requestWebsiteRebuild("identity");
}

function dbMessage(error: { message: string; code?: string }): string {
  if (/approved by a super admin/i.test(error.message)) return "This section needs a super admin's approval before it can be published.";
  if (/draft is empty/i.test(error.message)) return "There is nothing to publish yet: the draft is empty.";
  if (error.code === "42501" || /not authorized|permission denied|row-level security/i.test(error.message)) return "You don't have permission to do this.";
  return "Something went wrong. Please try again.";
}

function cleanDraft(input: ChurchContentValue): ChurchContentValue {
  const out: ChurchContentValue = {};
  if (input.title !== undefined) out.title = txt(input.title, 160);
  if (input.body !== undefined) out.body = txt(input.body, 12000);
  if (Array.isArray(input.items)) {
    out.items = input.items.slice(0, 40)
      .map((i) => ({ title: txt(i?.title, 160), text: txt(i?.text, 2000) }))
      .filter((i) => i.title || i.text);
  }
  return out;
}

/* ------------------------------------------------------------------ church identity workflow */
export async function saveContentDraft(key: string, draft: ChurchContentValue): Promise<ActionResult> {
  await requireStaff();
  if (!KEY.test(key)) return { ok: false, message: "Unknown section." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_church_content_draft", { p_key: key, p_draft: cleanDraft(draft) });
  if (error) return { ok: false, message: dbMessage(error) };
  revalidatePath("/admin/identity");
  return { ok: true, message: "Draft saved. The public website has not changed." };
}

export async function submitContent(key: string, note: string): Promise<ActionResult> {
  await requireStaff();
  if (!KEY.test(key)) return { ok: false, message: "Unknown section." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_church_content", { p_key: key, p_note: txt(note, 1000) || null });
  if (error) return { ok: false, message: dbMessage(error) };
  revalidatePath("/admin/identity");
  return { ok: true, message: "Submitted for approval. A super admin will review it." };
}

export async function publishContent(key: string): Promise<ActionResult> {
  await requireStaff();
  if (!KEY.test(key)) return { ok: false, message: "Unknown section." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("publish_church_content", { p_key: key });
  if (error) return { ok: false, message: dbMessage(error) };
  refreshPublicSite();
  return { ok: true, message: "Published. The website now shows this version." };
}

export async function rejectContent(key: string, note: string): Promise<ActionResult> {
  await requireStaff();
  if (!KEY.test(key)) return { ok: false, message: "Unknown section." };
  if (!txt(note, 1000)) return { ok: false, message: "Add a short note so the editor knows what to change." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reject_church_content", { p_key: key, p_note: txt(note, 1000) });
  if (error) return { ok: false, message: dbMessage(error) };
  revalidatePath("/admin/identity");
  return { ok: true, message: "Sent back to the editor with your note." };
}

export async function unpublishContent(key: string): Promise<ActionResult> {
  await requireStaff();
  if (!KEY.test(key)) return { ok: false, message: "Unknown section." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("unpublish_church_content", { p_key: key });
  if (error) return { ok: false, message: dbMessage(error) };
  refreshPublicSite();
  return { ok: true, message: "Removed from the website. The draft is kept." };
}

export async function restoreVersion(versionId: number): Promise<ActionResult> {
  await requireStaff();
  if (!Number.isInteger(versionId) || versionId <= 0) return { ok: false, message: "Unknown version." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("restore_content_version", { p_version: versionId });
  if (error) return { ok: false, message: dbMessage(error) };
  // settings restores are live immediately; content restores land in the draft
  if (String(data ?? "").startsWith("site.")) refreshPublicSite();
  revalidatePath("/admin/identity");
  return { ok: true, message: String(data ?? "").startsWith("site.") ? "Setting restored and live." : "Version restored into the draft. Publish it to make it live." };
}

/* ------------------------------------------------------------------ settings blocks */
async function upsertSettings(rows: { key: string; value: unknown }[]): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff.canEditContent) return { ok: false, message: "You don't have permission to change church settings." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, message: dbMessage(error) };
  refreshPublicSite();
  return { ok: true, message: "Saved. The website updates within a few minutes." };
}

const httpsOrNull = (u: unknown) => {
  const s = txt(u, 500);
  if (!s) return null;
  try { const url = new URL(s); return url.protocol === "https:" ? s : undefined; } catch { return undefined; }
};
const safeHref = (h: unknown) => {
  const s = txt(h, 300);
  return s.startsWith("/") && !s.startsWith("//") ? s : s.startsWith("https://") ? s : "";
};

export async function saveGiving(input: { enabled: boolean; methods: GivingMethod[] }): Promise<ActionResult> {
  const methods: GivingMethod[] = [];
  for (const m of (input.methods ?? []).slice(0, 10)) {
    const label = txt(m.label, 80);
    if (!label) continue;
    const url = httpsOrNull(m.url);
    if (url === undefined) return { ok: false, message: `"${label}": giving links must be full https:// addresses from your approved provider.` };
    methods.push({ label, description: txt(m.description, 400), url, note: txt(m.note, 200) || null });
  }
  return upsertSettings([{ key: "site.giving", value: { enabled: Boolean(input.enabled), methods } }]);
}

export async function saveNavigation(input: { navigation: NavItem[]; pages: Record<string, boolean> }): Promise<ActionResult> {
  const clean = (n: NavItem): NavItem | null => {
    const label = txt(n.label, 40);
    const href = safeHref(n.href);
    if (!label || !href) return null;
    const item: NavItem = { label, href, visible: Boolean(n.visible) };
    const d = txt(n.description, 80);
    if (d) item.description = d;
    if (Array.isArray(n.children)) item.children = n.children.slice(0, 12).map(clean).filter(Boolean) as NavItem[];
    return item;
  };
  const navigation = (input.navigation ?? []).slice(0, 8).map(clean).filter(Boolean) as NavItem[];
  if (!navigation.length) return { ok: false, message: "Keep at least one menu item." };
  const known = ["about", "ministries", "messages", "events", "gallery", "prayer", "visit", "contact", "give"];
  const pages = Object.fromEntries(known.map((k) => [k, input.pages?.[k] !== false]));
  return upsertSettings([{ key: "site.navigation", value: navigation }, { key: "site.pages", value: pages }]);
}

export async function saveVisitFaq(faq: { q: string; a: string }[]): Promise<ActionResult> {
  const clean = (faq ?? []).slice(0, 20).map((f) => ({ q: txt(f.q, 200), a: txt(f.a, 1500) })).filter((f) => f.q && f.a);
  return upsertSettings([{ key: "site.visit_faq", value: clean }]);
}
