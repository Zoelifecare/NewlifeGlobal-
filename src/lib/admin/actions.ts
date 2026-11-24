"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/staff";
import { fromLocalInput, getResource, slugify, type Field } from "./resources";
import { requestWebsiteRebuild } from "@/lib/website-rebuild";

export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function friendly(err: { message: string; code?: string }): string {
  if (err.message.startsWith("sermon_policy: ")) return "Not published: " + err.message.slice("sermon_policy: ".length) + ". Save it as a draft until it is verified.";
  if (err.code === "23505") return "Another item already uses this URL slug. Choose a different one.";
  if (err.code === "42501" || /row-level security|permission denied/i.test(err.message)) return "You don't have permission to make this change.";
  if (err.code === "23514") return "One of the values is not allowed. Please check the form.";
  if (err.code === "23503") return "This item is still referenced elsewhere and can't be changed this way.";
  return "Could not save. Please try again.";
}

function parseField(f: Field, fd: FormData): { value?: unknown; error?: string; skip?: boolean } {
  const raw = fd.get(f.name);
  const s = typeof raw === "string" ? raw.trim() : "";
  const empty = s === "";
  if (f.type === "boolean") return { value: raw === "on" || raw === "true" };
  if (f.type === "ministryLeaders") return { skip: true };
  if (f.required && empty) return { error: `${f.label} is required.` };
  if (f.max && s.length > f.max) return { error: `${f.label} must be at most ${f.max} characters.` };
  if (empty) return { value: f.type === "tags" ? [] : null };
  switch (f.type) {
    case "number": {
      const n = Number(s);
      return Number.isInteger(n) && Math.abs(n) < 1e6 ? { value: n } : { error: `${f.label} must be a whole number.` };
    }
    case "url":
      try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? { value: s } : { error: "Use an http(s) link." }; }
      catch { return { error: `${f.label} must be a full URL starting with https://` }; }
    case "email":
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? { value: s.toLowerCase() } : { error: "Enter a valid email address." };
    case "slug": {
      const v = slugify(s);
      return v ? { value: v } : { error: "Use letters, numbers and hyphens." };
    }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? { value: s } : { error: "Choose a valid date." };
    case "datetime":
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? { value: fromLocalInput(s) } : { error: "Choose a valid date and time." };
    case "select":
      return f.options?.some((o) => o.value === s) ? { value: s } : { error: `Choose a valid ${f.label.toLowerCase()}.` };
    case "tags":
      return { value: s.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean).slice(0, 30) };
    case "media":
    case "relation":
      return UUID.test(s) ? { value: s } : { error: `Choose a valid ${f.label.toLowerCase()}.` };
    default:
      return { value: s };
  }
}

function revalidateResource(paths: string[]) {
  if (paths.length) requestWebsiteRebuild("content");
  for (const p of paths) {
    if (p.includes("[")) revalidatePath(p, "page");
    else revalidatePath(p);
  }
}

export async function saveResource(key: string, id: string | null, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const res = getResource(key);
  if (!res) return { ok: false, message: "Unknown content type." };
  const staff = await requireStaff();
  const managerOnly = !staff.canEditContent;
  if (managerOnly && res.scope !== "ministry") return { ok: false, message: "You don't have permission to edit this content." };
  if (id && !UUID.test(id)) return { ok: false, message: "Invalid item." };

  const row: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};
  for (const f of res.fields) {
    if (managerOnly && f.editorOnly) continue;
    const r = parseField(f, fd);
    if (r.skip) continue;
    if (r.error) fieldErrors[f.name] = r.error;
    else row[f.name] = r.value;
  }

  // auto slug from title/name
  if (res.fields.some((f) => f.name === "slug") && !row.slug && !(managerOnly && id)) {
    const base = String(row[res.titleColumn] ?? row.name ?? row.title ?? "");
    const s = slugify(base);
    if (s) { row.slug = s; delete fieldErrors.slug; }
  }
  if (key === "sermons" && !row.speaker_id && !row.speaker_name) fieldErrors.speaker_name = "Choose a speaker or enter a guest speaker's name.";
  if (key === "events" && row.ends_at && row.starts_at && String(row.ends_at) < String(row.starts_at)) fieldErrors.ends_at = "End must be after the start.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };

  const supabase = await createSupabaseServerClient();
  let savedId = id;
  if (id) {
    const { error } = await supabase.from(res.table).update(row).eq("id", id);
    if (error) return { ok: false, message: friendly(error) };
  } else {
    const { data, error } = await supabase.from(res.table).insert(row).select("id").single();
    if (error) return { ok: false, message: friendly(error) };
    savedId = data.id;
  }

  // ministry leaders (join table)
  if (key === "ministries" && savedId && fd.has("leaders")) {
    let leaders: { leadership_id: string; role_title?: string }[] = [];
    try { leaders = JSON.parse(String(fd.get("leaders") || "[]")); } catch { /* ignore malformed */ }
    leaders = leaders.filter((l) => UUID.test(l.leadership_id)).slice(0, 20);
    const { error: delErr } = await supabase.from("ministry_leaders").delete().eq("ministry_id", savedId);
    if (delErr) return { ok: false, message: friendly(delErr), id: savedId };
    if (leaders.length) {
      const { error: insErr } = await supabase.from("ministry_leaders").insert(
        leaders.map((l, i) => ({ ministry_id: savedId, leadership_id: l.leadership_id, role_title: (l.role_title ?? "").slice(0, 120) || null, sort_order: i })),
      );
      if (insErr) return { ok: false, message: friendly(insErr), id: savedId };
    }
  }

  revalidateResource(res.revalidate);
  revalidatePath(`/admin/${key}`);
  return { ok: true, message: id ? "Changes saved." : `${res.singular} created.`, id: savedId ?? undefined };
}

export async function deleteResource(key: string, id: string): Promise<ActionResult> {
  const res = getResource(key);
  if (!res || !UUID.test(id)) return { ok: false, message: "Invalid item." };
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from(res.table).delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };
  if (!count) return { ok: false, message: "You don't have permission to delete this item." };
  revalidateResource(res.revalidate);
  revalidatePath(`/admin/${key}`);
  return { ok: true, message: `${res.singular} deleted.` };
}

export async function setStatus(key: string, id: string, status: "draft" | "published" | "archived"): Promise<ActionResult> {
  const res = getResource(key);
  if (!res || !res.publishable || !UUID.test(id)) return { ok: false, message: "Invalid item." };
  const staff = await requireStaff();
  if (!staff.canEditContent) return { ok: false, message: "Only content editors can publish or unpublish." };
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error, count } = await supabase.from(res.table).update(patch, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: friendly(error) };
  if (!count) return { ok: false, message: "You don't have permission to change this item." };
  revalidateResource(res.revalidate);
  revalidatePath(`/admin/${key}`);
  return { ok: true, message: status === "published" ? "Published." : status === "draft" ? "Moved to drafts." : "Archived." };
}
