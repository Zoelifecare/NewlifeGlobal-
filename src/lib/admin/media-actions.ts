"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/staff";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import type { ActionResult } from "./actions";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "./media-constants";
import { requestWebsiteRebuild } from "@/lib/website-rebuild";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERMISSIONS = ["owner_approved", "licensed", "embed_only", "pending"];

const kindOf = (mime: string) => (mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "document");
const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

/** Called after the browser uploaded a file to Storage: verifies the object and records it in media_assets. */
export async function registerUpload(input: { path: string; mime: string; size: number; width?: number; height?: number; alt: string; credit?: string; category?: string; permission: string }): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!/^uploads\/[a-z0-9-]+\/[a-z0-9._-]+$/i.test(input.path)) return { ok: false, message: "Invalid file path." };
  if (!ALLOWED_MIME.includes(input.mime)) return { ok: false, message: "This file type is not allowed." };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_UPLOAD_BYTES) return { ok: false, message: "Files must be 15 MB or smaller." };
  if (!PERMISSIONS.includes(input.permission)) return { ok: false, message: "Choose a permission status." };
  if (!input.alt?.trim() && input.mime.startsWith("image/")) return { ok: false, message: "Describe the image (alt text) for accessibility." };
  const supabase = await createSupabaseServerClient();
  // verify the object really exists in the bucket (and that this user could upload it)
  const folder = input.path.split("/").slice(0, 2).join("/");
  const { data: listed, error: listErr } = await supabase.storage.from(MEDIA_BUCKET).list(folder, { search: input.path.split("/").pop() });
  if (listErr || !listed?.length) return { ok: false, message: "Upload not found. Please try again." };
  const { data, error } = await supabase.from("media_assets").insert({
    path: input.path, kind: kindOf(input.mime), mime_type: input.mime, size_bytes: input.size,
    width: input.width ?? null, height: input.height ?? null, alt_text: input.alt.trim().slice(0, 300),
    credit: input.credit?.trim().slice(0, 200) || null, category: input.category?.trim().slice(0, 60) || null,
    permission_status: input.permission, created_by: staff.id,
  }).select("id").single();
  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([input.path]);
    return { ok: false, message: "Could not save the file details." };
  }
  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded.", id: data.id };
}

export async function addExternalMedia(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const url = clean(fd.get("url"), 1000);
  const alt = clean(fd.get("alt"), 300);
  const permission = String(fd.get("permission") ?? "pending");
  if (!url || !/^https:\/\//.test(url)) return { ok: false, message: "Enter a full https:// link." };
  if (!alt) return { ok: false, message: "Describe the image (alt text)." };
  if (!PERMISSIONS.includes(permission)) return { ok: false, message: "Choose a permission status." };
  let kind = "image";
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  let external = url;
  if (yt) { kind = "image"; external = `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`; }
  else if (!/^https:\/\/([a-z0-9-]+\.)*(supabase\.co|ytimg\.com)\//i.test(url)) {
    return { ok: false, message: "External images must be a YouTube video (its thumbnail is used) or a file in your Supabase storage. Upload other images instead." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("media_assets").insert({
    external_url: external, kind, alt_text: alt, credit: clean(fd.get("credit"), 200), source_url: url,
    category: clean(fd.get("category"), 60), permission_status: permission, created_by: staff.id,
  });
  if (error) return { ok: false, message: "Could not add the link." };
  revalidatePath("/admin/media");
  return { ok: true, message: "Added to the library." };
}

export async function updateMedia(id: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff();
  if (!UUID.test(id)) return { ok: false, message: "Invalid item." };
  const permission = String(fd.get("permission") ?? "");
  if (!PERMISSIONS.includes(permission)) return { ok: false, message: "Choose a permission status." };
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("media_assets").update({
    alt_text: clean(fd.get("alt"), 300) ?? "", caption: clean(fd.get("caption"), 500), credit: clean(fd.get("credit"), 200),
    category: clean(fd.get("category"), 60), permission_status: permission, permission_note: clean(fd.get("note"), 500),
  }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: "Could not save." };
  if (!count) return { ok: false, message: "You can only edit files you uploaded." };
  revalidatePath("/", "layout");
  requestWebsiteRebuild("media");
  return { ok: true, message: "Saved." };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  await requireStaff();
  if (!UUID.test(id)) return { ok: false, message: "Invalid item." };
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase.from("media_assets").select("path").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from("media_assets").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: "Could not delete. It may still be used as a gallery photo." };
  if (!count) return { ok: false, message: "You can only delete files you uploaded." };
  if (row?.path) await supabase.storage.from(MEDIA_BUCKET).remove([row.path]);
  revalidatePath("/", "layout");
  requestWebsiteRebuild("media");
  return { ok: true, message: "Deleted." };
}
