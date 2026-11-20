"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { deleteSubmission, updateSubmission } from "@/lib/admin/inbox-actions";
import { btnDanger, btnPrimary, inputCls } from "./ui";

export function SubmissionForm({ box, id, status, notes, statuses, assignees, assignedTo, canDelete }: {
  box: "prayer" | "messages"; id: string; status: string; notes: string | null; statuses: string[];
  assignees?: { id: string; name: string }[]; assignedTo?: string | null; canDelete: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateSubmission.bind(null, box, id), null);
  const [delPending, start] = useTransition();
  useEffect(() => { if (state?.ok) router.refresh(); }, [state, router]);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">Status
        <select name="status" defaultValue={status} className={inputCls}>{statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
      </label>
      {assignees && (
        <label className="grid gap-1 text-sm font-medium">Assigned to
          <select name="assigned_to" defaultValue={assignedTo ?? ""} className={inputCls}><option value="">Unassigned</option>{assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium">Internal notes (staff only)
        <textarea name="internal_notes" defaultValue={notes ?? ""} rows={5} maxLength={4000} className={inputCls} />
      </label>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save"}</button>
        {canDelete && (
          <button type="button" disabled={delPending} className={btnDanger}
            onClick={() => { if (confirm("Delete this submission permanently? This cannot be undone.")) start(async () => { const r = await deleteSubmission(box, id); if (r.ok) router.push(box === "prayer" ? "/admin/prayer" : "/admin/messages"); else alert(r.message); }); }}>
            Delete permanently
          </button>
        )}
      </div>
    </form>
  );
}
