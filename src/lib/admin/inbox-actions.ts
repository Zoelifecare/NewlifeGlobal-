"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/staff";
import type { ActionResult } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLES = {
  prayer: { table: "prayer_requests", statuses: ["new", "praying", "followed_up", "answered", "archived"], path: "/admin/prayer" },
  messages: { table: "contact_messages", statuses: ["new", "read", "replied", "archived"], path: "/admin/messages" },
} as const;
type Box = keyof typeof TABLES;

export async function updateSubmission(box: Box, id: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff();
  const cfg = TABLES[box];
  if (!cfg || !UUID.test(id)) return { ok: false, message: "Invalid item." };
  const status = String(fd.get("status") ?? "");
  if (!(cfg.statuses as readonly string[]).includes(status)) return { ok: false, message: "Choose a valid status." };
  const notes = String(fd.get("internal_notes") ?? "").trim().slice(0, 4000) || null;
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { status, internal_notes: notes };
  if (box === "prayer") {
    const a = String(fd.get("assigned_to") ?? "");
    patch.assigned_to = UUID.test(a) ? a : null;
  }
  const { error, count } = await supabase.from(cfg.table).update(patch, { count: "exact" }).eq("id", id);
  if (error || !count) return { ok: false, message: "You don't have permission to update this." };
  revalidatePath(cfg.path);
  return { ok: true, message: "Saved." };
}

export async function markRead(id: string): Promise<void> {
  await requireStaff();
  if (!UUID.test(id)) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("contact_messages").update({ status: "read" }).eq("id", id).eq("status", "new");
}

export async function deleteSubmission(box: Box | "subscribers", id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff.isAdmin) return { ok: false, message: "Only a super admin can delete submissions." };
  if (!UUID.test(id)) return { ok: false, message: "Invalid item." };
  const table = box === "subscribers" ? "newsletter_subscribers" : TABLES[box].table;
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { ok: false, message: "Could not delete." };
  revalidatePath(box === "subscribers" ? "/admin/subscribers" : TABLES[box].path);
  return { ok: true, message: "Deleted." };
}

export async function setSubscriberStatus(id: string, status: "subscribed" | "unsubscribed"): Promise<ActionResult> {
  await requireStaff();
  if (!UUID.test(id) || !["subscribed", "unsubscribed"].includes(status)) return { ok: false, message: "Invalid item." };
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("newsletter_subscribers").update({ status }, { count: "exact" }).eq("id", id);
  if (error || !count) return { ok: false, message: "You don't have permission to change this." };
  revalidatePath("/admin/subscribers");
  return { ok: true, message: "Updated." };
}
