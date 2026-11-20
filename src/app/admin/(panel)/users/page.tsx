import { requireCapability, ROLE_LABEL, type Role } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { Card, PageTitle } from "@/components/admin/ui";
import { InviteForm, UserRow } from "@/components/admin/users-ui";

export default async function UsersPage() {
  const me = await requireCapability("admin");
  const supabase = await createSupabaseServerClient();
  const [{ data: profiles }, { data: roles }, { data: ministries }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, is_prayer_team, created_at").order("created_at"),
    supabase.from("user_roles").select("id, user_id, role, ministry_id"),
    supabase.from("ministries").select("id, name").order("sort_order"),
  ]);
  const mins = (ministries ?? []) as { id: string; name: string }[];
  const users = (profiles ?? []).map((p) => ({
    ...p,
    roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => ({
      id: r.id as string, label: `${ROLE_LABEL[r.role as Role]}${r.ministry_id ? ` · ${mins.find((m) => m.id === r.ministry_id)?.name ?? "ministry"}` : ""}`,
    })),
  }));
  return (
    <>
      <PageTitle title="Users & roles" description="Super Admin: everything. Content Editor: all content, media, messages. Ministry Manager: only their assigned ministry and its gallery items. Prayer team: may read prayer requests." />
      <Card className="mb-6 p-5">
        <h2 className="mb-3 font-semibold">Invite a staff member</h2>
        {isServiceRoleConfigured() ? <InviteForm ministries={mins} /> : <p className="text-sm text-muted">Set <code>SUPABASE_SERVICE_ROLE_KEY</code> on the server to send invitations. You can still manage roles of existing users below.</p>}
      </Card>
      <Card>
        <ul>{users.map((u) => <UserRow key={u.id} user={u} ministries={mins} isMe={u.id === me.id} />)}</ul>
      </Card>
    </>
  );
}
