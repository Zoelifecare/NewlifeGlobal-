"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { FileAudio, FileText, FileVideo, Link2, Trash2, Upload, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import { addExternalMedia, deleteMedia, registerUpload, updateMedia } from "@/lib/admin/media-actions";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, MEDIA_CATEGORIES, PERMISSION_LABEL } from "@/lib/admin/media-constants";
import { btnDanger, btnPrimary, btnSecondary, inputCls } from "./ui";

interface Item {
  id: string; url: string; kind: string; alt: string; credit?: string | null; category?: string | null; sourceUrl?: string | null;
  caption: string | null; permission: string; note: string | null; path: string | null; createdAt: string; canEdit: boolean;
}

export function MediaLibrary({ items, userId }: { items: Item[]; userId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const list = useMemo(() => items.filter((m) =>
    (!cat || m.category === cat) && (!filter || `${m.alt} ${m.credit ?? ""} ${m.caption ?? ""}`.toLowerCase().includes(filter.toLowerCase()))), [items, filter, cat]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Uploader userId={userId} onDone={() => router.refresh()} />
        <ExternalForm onDone={() => router.refresh()} />
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search media…" aria-label="Search media" className={`${inputCls} max-w-xs`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} w-auto`} aria-label="Category">
          <option value="">All categories</option>{MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="self-center text-sm text-muted">{list.length} files</span>
      </div>
      {list.length === 0 ? <p className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No media yet.</p> : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {list.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-lg border border-line bg-white">
              <button type="button" onClick={() => setEditing(m)} className="block w-full text-left" aria-label={`Edit details: ${m.alt || "untitled"}`}>
                <span className="relative block aspect-[4/3] bg-paper">
                  {m.kind === "image" ? <Image src={m.url} alt="" fill sizes="240px" className="object-cover" /> : (
                    <span className="flex h-full items-center justify-center text-muted">{m.kind === "video" ? <FileVideo className="h-8 w-8" /> : m.kind === "audio" ? <FileAudio className="h-8 w-8" /> : <FileText className="h-8 w-8" />}</span>
                  )}
                </span>
                <span className="grid gap-1 p-2.5">
                  <span className="truncate text-xs font-medium text-ink">{m.alt || "(no description)"}</span>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${m.permission === "pending" ? "bg-amber-50 text-amber-800" : "bg-sky-50 text-sky-900"}`}>{PERMISSION_LABEL[m.permission]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && <EditDialog item={editing} onClose={() => { setEditing(null); router.refresh(); }} />}
    </div>
  );
}

function Uploader({ userId, onDone }: { userId: string; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) return setMsg({ ok: false, text: "Choose at least one file." });
    const alt = String(fd.get("alt") ?? "").trim();
    setBusy(true); setMsg(null);
    const supabase = getSupabaseBrowserClient();
    let done = 0;
    for (const file of files) {
      if (!ALLOWED_MIME.includes(file.type)) { setMsg({ ok: false, text: `${file.name}: file type not allowed.` }); continue; }
      if (file.size > MAX_UPLOAD_BYTES) { setMsg({ ok: false, text: `${file.name}: larger than 15 MB.` }); continue; }
      const dims = file.type.startsWith("image/") ? await imageSize(file) : undefined;
      const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `uploads/${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (error) { setMsg({ ok: false, text: `${file.name}: upload failed (${error.message}).` }); continue; }
      const r = await registerUpload({
        path, mime: file.type, size: file.size, width: dims?.w, height: dims?.h,
        alt: alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        credit: String(fd.get("credit") ?? ""), category: String(fd.get("category") ?? ""), permission: String(fd.get("permission") ?? "pending"),
      });
      if (!r.ok) setMsg({ ok: false, text: `${file.name}: ${r.message}` }); else done++;
    }
    setBusy(false);
    if (done) { setMsg({ ok: true, text: `${done} file${done > 1 ? "s" : ""} uploaded.` }); form.reset(); onDone(); }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Upload className="h-4 w-4" aria-hidden />Upload files</h2>
      <input ref={fileRef} type="file" multiple accept={ALLOWED_MIME.join(",")} aria-label="Files" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-2 file:text-sm file:font-semibold" />
      <input name="alt" placeholder="Description / alt text (applies to all selected files)" maxLength={300} className={inputCls} aria-label="Description" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="credit" placeholder="Credit (e.g. New Life Global AZ)" maxLength={200} className={inputCls} aria-label="Credit" />
        <select name="category" className={inputCls} aria-label="Category"><option value="">Category…</option>{MEDIA_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select name="permission" defaultValue="owner_approved" className={inputCls} aria-label="Permission">{Object.entries(PERMISSION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      <p className="text-xs text-muted">JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MP3, M4A or PDF · max 15 MB each.</p>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-blue-deep" : "text-red-700"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-fit`}>{busy ? "Uploading…" : "Upload"}</button>
    </form>
  );
}

function ExternalForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(async (p: Awaited<ReturnType<typeof addExternalMedia>> | null, fd: FormData) => {
    const r = await addExternalMedia(p, fd); if (r.ok) onDone(); return r;
  }, null);
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4" aria-hidden />Add a YouTube video thumbnail</h2>
      <input name="url" type="url" required placeholder="https://www.youtube.com/watch?v=…" className={inputCls} aria-label="Video link" />
      <input name="alt" required placeholder="Description / alt text" maxLength={300} className={inputCls} aria-label="Description" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="credit" placeholder="Credit" maxLength={200} className={inputCls} aria-label="Credit" />
        <select name="category" className={inputCls} aria-label="Category"><option value="">Category…</option>{MEDIA_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select name="permission" defaultValue="embed_only" className={inputCls} aria-label="Permission">{Object.entries(PERMISSION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
      <button type="submit" disabled={pending} className={`${btnSecondary} w-fit`}>{pending ? "Adding…" : "Add to library"}</button>
    </form>
  );
}

function EditDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const [state, action, pending] = useActionState(updateMedia.bind(null, item.id), null);
  const [delPending, start] = useTransition();
  const [delMsg, setDelMsg] = useState<string | null>(null);
  return (
    <div role="dialog" aria-modal="true" aria-label="Media details" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white md:grid-cols-2">
        <div className="relative min-h-60 bg-paper">
          {item.kind === "image" ? <Image src={item.url} alt={item.alt} fill sizes="400px" className="object-contain" /> : <a href={item.url} className="flex h-full items-center justify-center text-sm text-blue-deep" target="_blank" rel="noreferrer">Open file ↗</a>}
        </div>
        <form action={action} className="grid content-start gap-3 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Media details</h2><button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>
          <fieldset disabled={!item.canEdit} className="grid gap-3">
            <label className="grid gap-1 text-sm">Description (alt text)<input name="alt" defaultValue={item.alt} maxLength={300} className={inputCls} /></label>
            <label className="grid gap-1 text-sm">Caption<input name="caption" defaultValue={item.caption ?? ""} maxLength={500} className={inputCls} /></label>
            <label className="grid gap-1 text-sm">Credit<input name="credit" defaultValue={item.credit ?? ""} maxLength={200} className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">Category<select name="category" defaultValue={item.category ?? ""} className={inputCls}><option value="">—</option>{MEDIA_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="grid gap-1 text-sm">Permission<select name="permission" defaultValue={item.permission} className={inputCls}>{Object.entries(PERMISSION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            </div>
            <label className="grid gap-1 text-sm">Permission note<textarea name="note" defaultValue={item.note ?? ""} rows={2} maxLength={500} className={inputCls} /></label>
          </fieldset>
          {item.sourceUrl && <p className="truncate text-xs text-muted">Source: <a className="text-blue-deep" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceUrl}</a></p>}
          {state && <p role="status" className={`text-sm ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
          {delMsg && <p role="alert" className="text-sm text-red-700">{delMsg}</p>}
          {item.canEdit && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save"}</button>
              <button type="button" disabled={delPending} className={btnDanger}
                onClick={() => { if (confirm("Delete this file permanently? Pages using it will lose the image.")) start(async () => { const r = await deleteMedia(item.id); if (r.ok) onClose(); else setDelMsg(r.message); }); }}>
                <Trash2 className="h-4 w-4" aria-hidden />Delete
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function imageSize(file: File): Promise<{ w: number; h: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(undefined); URL.revokeObjectURL(url); };
    img.src = url;
  });
}
