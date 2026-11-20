"use client";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { X } from "lucide-react";
import { addRole, inviteUser, removeRole, setPrayerTeam } from "@/lib/admin/user-actions";
import { btnPrimary, inputCls } from "./ui";

const ROLE_OPTS = [{ v: "content_editor", l: "Content Editor" }, { v: "ministry_manager", l: "Ministry Manager" }, { v: "super_admin", l: "Super Admin" }];

export function InviteForm({ ministries }: { ministries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(inviteUser, null);
  const [role, setRole] = useState("content_editor");
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
      <label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" required className={inputCls} /></label>
      <label className="grid gap-1 text-sm font-medium">Name<input name="name" maxLength={120} className={inputCls} /></label>
      <label className="grid gap-1 text-sm font-medium">Role<select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>{ROLE_OPTS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
      {role === "ministry_manager" ? (
        <label className="grid gap-1 text-sm font-medium">Ministry<select name="ministry_id" required className={inputCls}><option value="">Choose…</option>{ministries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      ) : <span />}
      <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Sending…" : "Send invite"}</button>
      {state && <p role="status" className={`text-sm md:col-span-5 ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}

export function UserRow({ user, ministries, isMe }: {
  user: { id: string; full_name: string; email: string | null; is_prayer_team: boolean; roles: { id: string; label: string }[] };
  ministries: { id: string; name: string }[]; isMe: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [role, setRole] = useState("content_editor");
  const [ministry, setMinistry] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => start(async () => { const r = await fn(); setMsg(r.ok ? null : r.message); router.refresh(); });

  return (
    <li className="grid gap-3 border-b border-line px-5 py-4 last:border-0 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="font-semibold">{user.full_name || user.email} {isMe && <span className="text-xs font-normal text-muted">(you)</span>}</p>
        <p className="text-sm text-muted">{user.email}</p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={user.is_prayer_team} disabled={pending} onChange={(e) => run(() => setPrayerTeam(user.id, e.target.checked))} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />
          Prayer team (can read prayer requests)
        </label>
      </div>
      <div className="grid gap-2">
        <ul className="flex flex-wrap gap-2">
          {user.roles.length === 0 && <li className="text-sm text-muted">No role — this person cannot use the admin.</li>}
          {user.roles.map((r) => (
            <li key={r.id} className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-blue-deep">
              {r.label}
              <button type="button" disabled={pending} aria-label={`Remove ${r.label}`} onClick={() => { if (confirm(`Remove “${r.label}”?`)) run(() => removeRole(r.id)); }} className="text-muted hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Role to add" value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} w-auto`}>{ROLE_OPTS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select>
          {role === "ministry_manager" && <select aria-label="Ministry" value={ministry} onChange={(e) => setMinistry(e.target.value)} className={`${inputCls} w-auto`}><option value="">Ministry…</option>{ministries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
          <button type="button" disabled={pending} onClick={() => run(() => addRole(user.id, role, ministry || null))} className="rounded-md border border-line bg-white px-3 text-sm font-semibold hover:bg-mist">Add role</button>
        </div>
        {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      </div>
    </li>
  );
}
