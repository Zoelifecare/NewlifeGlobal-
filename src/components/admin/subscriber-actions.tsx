"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSubmission, setSubscriberStatus } from "@/lib/admin/inbox-actions";

export function SubscriberActions({ id, status, canDelete }: { id: string; status: string; canDelete: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-2">
      <button type="button" disabled={pending} className="text-xs font-semibold text-blue-deep disabled:opacity-50"
        onClick={() => start(async () => { await setSubscriberStatus(id, status === "subscribed" ? "unsubscribed" : "subscribed"); router.refresh(); })}>
        {status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
      </button>
      {canDelete && (
        <button type="button" disabled={pending} className="text-xs font-semibold text-red-700 disabled:opacity-50"
          onClick={() => { if (confirm("Delete this subscriber permanently?")) start(async () => { await deleteSubmission("subscribers", id); router.refresh(); }); }}>
          Delete
        </button>
      )}
    </div>
  );
}
