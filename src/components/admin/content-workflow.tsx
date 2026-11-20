"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Eye, History, Plus, Trash2 } from "lucide-react";
import type { ChurchContentValue } from "@/lib/content/types";
import { publishContent, rejectContent, restoreVersion, saveContentDraft, submitContent, unpublishContent } from "@/lib/admin/identity-actions";
import { btnDanger, btnPrimary, btnSecondary, fmtDate, inputCls } from "./ui";

export interface ContentRow {
  key: string; label: string; sort_order: number; requires_approval: boolean;
  draft: ChurchContentValue; published: ChurchContentValue | null;
  status: "draft" | "pending" | "published" | "needs_confirmation";
  review_note: string | null; submitted_at: string | null; published_at: string | null; updated_at: string;
}
export interface VersionRow {
  id: number; entity: string; entity_key: string; event: string; data: unknown; actor_id: string | null; note: string | null; created_at: string;
}

const STATUS: Record<ContentRow["status"], { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-sky-50 text-sky-900 ring-sky-200" },
  pending: { label: "Awaiting approval", cls: "bg-amber-50 text-amber-900 ring-amber-200" },
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-700 ring-gray-200" },
  needs_confirmation: { label: "Needs confirmation", cls: "bg-rose-50 text-rose-800 ring-rose-200" },
};
const LIST_KEYS = new Set(["core_values", "beliefs"]);

export function ContentWorkflow({ rows, versions, names, isAdmin }: { rows: ContentRow[]; versions: VersionRow[]; names: Record<string, string>; isAdmin: boolean }) {
  const [open, setOpen] = useState<string | null>(rows.find((r) => r.status === "pending")?.key ?? null);
  if (!rows.length) return <p className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-muted">No church content found. Run the database migrations and seed.</p>;
  return (
    <ol className="grid gap-3">
      {rows.map((r) => (
        <li key={r.key} className="rounded-lg border border-line bg-white">
          <button type="button" onClick={() => setOpen(open === r.key ? null : r.key)} aria-expanded={open === r.key} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left">
            <span className="flex-1 font-semibold">{r.label}</span>
            {r.requires_approval && <span className="text-xs text-muted">Approval required</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
            {r.published && r.status !== "published" && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-900 ring-1 ring-inset ring-sky-200">Live version on site</span>}
            <ChevronDown className={`h-4 w-4 transition-transform ${open === r.key ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {open === r.key && <Editor row={r} versions={versions.filter((v) => v.entity_key === r.key)} names={names} isAdmin={isAdmin} />}
        </li>
      ))}
    </ol>
  );
}

function Editor({ row, versions, names, isAdmin }: { row: ContentRow; versions: VersionRow[]; names: Record<string, string>; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [title, setTitle] = useState(row.draft.title ?? "");
  const [body, setBody] = useState(row.draft.body ?? "");
  const [items, setItems] = useState(row.draft.items ?? []);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(false);
  const isList = LIST_KEYS.has(row.key) || (row.draft.items?.length ?? 0) > 0;
  const draft: ChurchContentValue = isList ? { title, body, items } : { title, body };

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => start(async () => {
    const r = await fn(); setMsg({ ok: r.ok, text: r.message }); if (r.ok) router.refresh();
  });
  // publishing/submitting always uses the saved draft: save first
  const saveThen = (next: () => Promise<{ ok: boolean; message: string }>) => run(async () => {
    const s = await saveContentDraft(row.key, draft); if (!s.ok) return s; return next();
  });
  const canPublish = !row.requires_approval || isAdmin;

  return (
    <div className="grid gap-5 border-t border-line p-5">
      {row.review_note && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{row.status === "pending" ? "Note from the editor: " : row.status === "needs_confirmation" ? "Needs confirmation: " : "Reviewer note: "}</strong>{row.review_note}
        </p>
      )}
      <label className="grid gap-1 text-sm font-medium">Heading<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={inputCls} /></label>
      <label className="grid gap-1 text-sm font-medium">Text
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={isList ? 3 : 8} maxLength={12000} className={inputCls} placeholder="Leave a blank line between paragraphs." />
      </label>
      {isList && (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">{row.key === "beliefs" ? "Beliefs" : "Values"} (each one appears as a numbered card)</legend>
          {items.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_2fr_auto]">
              <input aria-label="Title" placeholder="Title" value={it.title} maxLength={160} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputCls} />
              <textarea aria-label="Description" placeholder="Description" rows={2} value={it.text} maxLength={2000} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} className={inputCls} />
              <button type="button" aria-label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-md border border-line px-3 text-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { title: "", text: "" }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add</button>
        </fieldset>
      )}

      {preview && (
        <section aria-label="Preview" className="rounded-lg border border-blue/40 bg-[#f6f8fa] p-6">
          <p className="nl-label mb-3">Preview: how the website will show it</p>
          {draft.title && <h3 className="nl-h3 mb-3">{draft.title}</h3>}
          {draft.body && <div className="grid gap-3 text-body">{draft.body.split(/\n{2,}/).map((p, i) => <p key={i} className="m-0 whitespace-pre-line">{p}</p>)}</div>}
          {isList && items.length > 0 && (
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {items.filter((x) => x.title || x.text).map((x, i) => <li key={i} className="border border-line bg-white p-4"><span className="text-xs text-blue-deep">{String(i + 1).padStart(2, "0")}</span><p className="m-0 font-semibold">{x.title}</p><p className="m-0 text-sm">{x.text}</p></li>)}
            </ol>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => saveContentDraft(row.key, draft))} className={btnSecondary}>Save draft</button>
        <button type="button" onClick={() => setPreview((p) => !p)} className={btnSecondary}><Eye className="h-4 w-4" aria-hidden />{preview ? "Hide preview" : "Preview"}</button>
        {canPublish ? (
          <button type="button" disabled={pending} onClick={() => { if (confirm(row.requires_approval ? "Approve and publish this to the website?" : "Publish this to the website?")) saveThen(() => publishContent(row.key)); }} className={btnPrimary}>
            {row.requires_approval ? "Approve & publish" : "Publish"}
          </button>
        ) : (
          <button type="button" disabled={pending || row.status === "pending"} onClick={() => saveThen(() => submitContent(row.key, note))} className={btnPrimary}>
            {row.status === "pending" ? "Awaiting approval" : "Submit for approval"}
          </button>
        )}
        {isAdmin && row.status === "pending" && (
          <button type="button" disabled={pending} onClick={() => run(() => rejectContent(row.key, note))} className={btnSecondary}>Send back with note</button>
        )}
        {isAdmin && row.published && (
          <button type="button" disabled={pending} onClick={() => { if (confirm("Remove this section from the website? The draft is kept.")) run(() => unpublishContent(row.key)); }} className={btnDanger}>Unpublish</button>
        )}
      </div>
      {(!canPublish || (isAdmin && row.status === "pending")) && (
        <label className="grid gap-1 text-sm font-medium">{isAdmin ? "Note to the editor (required to send back)" : "Note for the approver (optional)"}
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className={inputCls} />
        </label>
      )}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-blue-deep" : "text-red-700"}`}>{msg.text}</p>}
      <p className="text-xs text-muted">Last change {fmtDate(row.updated_at, true)}{row.published_at ? ` · live since ${fmtDate(row.published_at, true)}` : " · not on the website yet"}</p>

      <details className="rounded-md border border-line">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold"><History className="h-4 w-4" aria-hidden />Version history ({versions.length})</summary>
        {versions.length === 0 ? <p className="px-4 pb-4 text-sm text-muted">No versions yet.</p> : (
          <ul className="divide-y divide-line">
            {versions.slice(0, 20).map((v) => {
              const d = v.data as ChurchContentValue;
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-28 font-medium capitalize">{v.event}</span>
                  <span className="text-muted">{fmtDate(v.created_at, true)} · {v.actor_id ? names[v.actor_id] ?? "Staff" : "System"}</span>
                  <span className="min-w-0 flex-1 truncate text-body">{d?.body?.slice(0, 90) || d?.items?.map((i) => i.title).join(", ") || "(empty)"}</span>
                  <button type="button" disabled={pending} onClick={() => run(() => restoreVersion(v.id))} className="text-xs font-semibold text-blue-deep">Restore to draft</button>
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </div>
  );
}

export function SettingsVersionList({ versions, names }: { versions: VersionRow[]; names: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <details className="rounded-lg border border-line bg-white">
      <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-semibold"><History className="h-4 w-4" aria-hidden />Settings history ({versions.length})</summary>
      <p className="px-5 text-xs text-muted">Each entry is the value a setting had before it was changed. Restoring makes it live again.</p>
      {msg && <p role="status" className="px-5 pt-2 text-sm text-blue-deep">{msg}</p>}
      <ul className="mt-2 divide-y divide-line">
        {versions.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
            <span className="w-40 font-medium">{v.entity_key.replace("site.", "").replace(/_/g, " ")}</span>
            <span className="text-muted">{fmtDate(v.created_at, true)} · {v.actor_id ? names[v.actor_id] ?? "Staff" : "System"}</span>
            <code className="min-w-0 flex-1 truncate text-xs text-body">{JSON.stringify(v.data).slice(0, 120)}</code>
            <button type="button" disabled={pending} onClick={() => { if (confirm("Restore this earlier value? It goes live immediately.")) start(async () => { const r = await restoreVersion(v.id); setMsg(r.message); router.refresh(); }); }} className="text-xs font-semibold text-blue-deep">Restore</button>
          </li>
        ))}
      </ul>
    </details>
  );
}
