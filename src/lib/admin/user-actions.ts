"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/staff";
import { adminUrl } from "@/lib/site-url";
import type { ActionResult } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ["super_admin", "content_editor", "ministry_manager", "finance_manager"];

async function admin() {
  const s = await requireStaff();
  if (!s.isAdmin) throw new Error("forbidden");
  return s;
}

/** Invite a staff member by email (service role, super admin only) and grant an initial role. */
export async function inviteUser(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try { await admin(); } catch { return { ok: false, message: "Only a super admin can invite users." }; }
  if (!isServiceRoleConfigured()) return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const role = String(fd.get("role") ?? "");
  const ministry = String(fd.get("ministry_id") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (!ROLES.includes(role)) return { ok: false, message: "Choose a role." };
  if (role === "ministry_manager" && !UUID.test(ministry)) return { ok: false, message: "Choose the ministry this person will manage." };

  const svc = createSupabaseServiceClient();
  const origin = adminUrl();
  const { data, error } = await svc.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name }, redirectTo: `${origin}/admin/auth/callback?next=/admin/auth/set-password`,
  });
  if (error || !data.user) return { ok: false, message: error?.message?.includes("already") ? "That email already has an account — assign a role below instead." : "Could not send the invitation." };

  // role grant goes through the super admin's own session so it is audited and RLS-checked
  const supabase = await createSupabaseServerClient();
  // the profile row is created by the on_auth_user_created trigger; set the display name
  if (name) await supabase.from("profiles").update({ full_name: name }).eq("id", data.user.id);
  const { error: rErr } = await supabase.from("user_roles").insert({ user_id: data.user.id, role, ministry_id: role === "ministry_manager" ? ministry : null });
  if (rErr) return { ok: false, message: "Invitation sent, but the role could not be assigned. Assign it below." };
  revalidatePath("/admin/users");
  return { ok: true, message: `Invitation sent to ${email}.` };
}

export async function addRole(userId: string, role: string, ministryId: string | null): Promise<ActionResult> {
  try { await admin(); } catch { return { ok: false, message: "Only a super admin can change roles." }; }
  if (!UUID.test(userId) || !ROLES.includes(role)) return { ok: false, message: "Invalid role." };
  if (role === "ministry_manager" && !(ministryId && UUID.test(ministryId))) return { ok: false, message: "Choose a ministry." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role, ministry_id: role === "ministry_manager" ? ministryId : null });
  if (error) return { ok: false, message: error.code === "23505" ? "This user already has that role." : "Could not add the role." };
  revalidatePath("/admin/users");
  return { ok: true, message: "Role added." };
}

export async function removeRole(roleId: string): Promise<ActionResult> {
  try { await admin(); } catch { return { ok: false, message: "Only a super admin can change roles." }; }
  if (!UUID.test(roleId)) return { ok: false, message: "Invalid role." };
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("user_roles").delete({ count: "exact" }).eq("id", roleId);
  if (error) return { ok: false, message: /last super admin/i.test(error.message) ? "You can't remove the last super admin." : "Could not remove the role." };
  if (!count) return { ok: false, message: "Role not found." };
  revalidatePath("/admin/users");
  return { ok: true, message: "Role removed." };
}

export async function setPrayerTeam(userId: string, on: boolean): Promise<ActionResult> {
  try { await admin(); } catch { return { ok: false, message: "Only a super admin can change prayer-team access." }; }
  if (!UUID.test(userId)) return { ok: false, message: "Invalid user." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ is_prayer_team: on }).eq("id", userId);
  if (error) return { ok: false, message: "Could not update." };
  revalidatePath("/admin/users");
  return { ok: true, message: on ? "Prayer-team access granted." : "Prayer-team access removed." };
}
