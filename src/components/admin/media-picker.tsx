"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { Media } from "@/lib/content/types";
import { inputCls } from "./ui";

/** Choose an image from the media library. Stores the media_assets id in a hidden input. */
export function MediaPicker({ name, initialId, media, required, onChange }: { name: string; initialId: string | null; media: Media[]; required?: boolean; onChange?: (id: string | null) => void }) {
  const [selected, setSelected] = useState<string | null>(initialId);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const current = media.find((m) => m.id === selected) ?? null;
  const list = useMemo(() => media.filter((m) => !q || `${m.alt} ${m.category ?? ""} ${m.credit ?? ""}`.toLowerCase().includes(q.toLowerCase())), [media, q]);

  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);

  const choose = (id: string | null) => {
    setSelected(id);
    setOpen(false);
    onChange?.(id);
    // let the parent <form onChange> know the value changed
    dialog.current?.closest("form")?.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected ?? ""} required={required} />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
          {current ? <Image src={current.url} alt={current.alt} fill sizes="112px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-muted">No image</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-mist"><ImagePlus className="h-4 w-4" />{current ? "Change" : "Choose image"}</button>
          {current && <button type="button" onClick={() => choose(null)} className="rounded-md px-3 py-2 text-sm text-muted hover:text-red-700">Remove</button>}
        </div>
      </div>
      {current && <p className="mt-1 truncate text-xs text-muted">{current.alt}</p>}

      <dialog ref={dialog} onClose={() => setOpen(false)} className="m-auto w-[min(56rem,94vw)] rounded-lg p-0 backdrop:bg-ink/50">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-semibold">Choose an image</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by description or category" className={`${inputCls} max-w-sm`} aria-label="Search media" />
            <Link href="/admin/media" target="_blank" className="text-sm font-semibold text-blue-deep">Upload new ↗</Link>
          </div>
          {list.length === 0 ? <p className="py-10 text-center text-sm text-muted">No images found. Upload images in the media library.</p> : (
            <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
              {list.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => choose(m.id)} className={`group block w-full overflow-hidden rounded-md border-2 text-left ${m.id === selected ? "border-blue-deep" : "border-transparent hover:border-line"}`}>
                    <span className="relative block aspect-[4/3] bg-paper"><Image src={m.url} alt="" fill sizes="200px" className="object-cover" /></span>
                    <span className="block truncate p-1.5 text-xs text-muted">{m.alt || "(no description)"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </div>
  );
}
