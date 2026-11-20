import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "super_admin" | "content_editor" | "ministry_manager";

export interface Staff {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  ministryIds: string[];
  isPrayerTeam: boolean;
  isAdmin: boolean;
  canEditContent: boolean;
  canReadPrayer: boolean;
}

/** Current signed-in staff member, or null (not signed in / no role). Verified with the Auth server via getUser(). */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role, ministry_id").eq("user_id", user.id),
    supabase.from("profiles").select("full_name, is_prayer_team").eq("id", user.id).maybeSingle(),
  ]);
  const list = (roles ?? []) as { role: Role; ministry_id: string | null }[];
  const r = list.map((x) => x.role);
  const isAdmin = r.includes("super_admin");
  const canEditContent = isAdmin || r.includes("content_editor");
  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.full_name || user.email || "Staff",
    roles: [...new Set(r)],
    ministryIds: list.filter((x) => x.role === "ministry_manager" && x.ministry_id).map((x) => x.ministry_id!),
    isPrayerTeam: Boolean(profile?.is_prayer_team),
    isAdmin,
    canEditContent,
    canReadPrayer: isAdmin || (r.length > 0 && Boolean(profile?.is_prayer_team)),
  };
});

/** Use in admin pages/actions. Redirects to login when signed out; to /admin/no-access when the user has no role. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (staff.roles.length === 0) redirect("/admin/no-access");
  return staff;
}

export type Capability = "content" | "admin" | "prayer" | "ministry";

export function can(staff: Staff, cap: Capability) {
  if (cap === "admin") return staff.isAdmin;
  if (cap === "content") return staff.canEditContent;
  if (cap === "prayer") return staff.canReadPrayer;
  return staff.canEditContent || staff.ministryIds.length > 0;
}

export async function requireCapability(cap: Capability): Promise<Staff> {
  const staff = await requireStaff();
  if (!can(staff, cap)) redirect("/admin?denied=1");
  return staff;
}

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  content_editor: "Content Editor",
  ministry_manager: "Ministry Manager",
};
