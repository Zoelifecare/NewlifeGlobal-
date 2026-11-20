"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteResource, setStatus } from "@/lib/admin/actions";

export function RowActions({ resource, id, status, canEdit, canPublish, canDelete, previewHref }: {
  resource: string; id: string; status?: string; canEdit: boolean; canPublish: boolean; canDelete: boolean; previewHref?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); setMsg(r.ok ? null : r.message); router.refresh(); });

  return (
    <div className="flex items-center justify-end gap-1">
      {msg && <span role="alert" className="mr-2 text-xs text-red-700">{msg}</span>}
      {previewHref && <Link href={previewHref} className="rounded p-1.5 text-muted hover:bg-mist hover:text-ink" title="Preview" aria-label="Preview"><Eye className="h-4 w-4" /></Link>}
      {canEdit && <Link href={`/admin/${resource}/${id}`} className="rounded p-1.5 text-muted hover:bg-mist hover:text-ink" title="Edit" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>}
      {canPublish && status && (
        <button type="button" disabled={pending} onClick={() => run(() => setStatus(resource, id, status === "published" ? "draft" : "published"))}
          className="rounded px-2 py-1 text-xs font-semibold text-blue-deep hover:bg-mist disabled:opacity-50">
          {status === "published" ? "Unpublish" : "Publish"}
        </button>
      )}
      {canDelete && (
        <button type="button" disabled={pending} title="Delete" aria-label="Delete"
          onClick={() => { if (confirm("Delete this item permanently? This cannot be undone.")) run(() => deleteResource(resource, id)); }}
          className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
