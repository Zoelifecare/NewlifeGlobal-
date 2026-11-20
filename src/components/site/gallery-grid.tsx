"use client";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryCategory, GalleryItem } from "@/lib/content/types";

export function GalleryGrid({ items, categories }: { items: GalleryItem[]; categories: GalleryCategory[] }) {
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const used = useMemo(() => categories.filter((c) => items.some((i) => i.category?.id === c.id)), [categories, items]);
  const shown = useMemo(() => (cat === "all" ? items : items.filter((i) => i.category?.slug === cat)), [cat, items]);

  const close = useCallback(() => { setOpen(null); lastTrigger.current?.focus(); }, []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") { e.preventDefault(); dialogRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open, close, step]);

  const current = open !== null ? shown[open] : null;

  return (
    <>
      <div role="group" aria-label="Filter photos" className="mb-10 flex flex-wrap gap-2">
        {[{ slug: "all", name: "All" }, ...used].map((c) => (
          <button key={c.slug} type="button" onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug}
            className={`border px-4 py-2 text-sm transition-colors ${cat === c.slug ? "border-blue-deep bg-blue-deep text-white" : "border-line text-ink hover:border-blue"}`}>
            {c.name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="border border-dashed border-line p-10 text-center text-muted">No photos in this category yet.</p>
      ) : (
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {shown.map((it, i) => (
            <li key={it.id} className="break-inside-avoid">
              <button type="button" onClick={(e) => { lastTrigger.current = e.currentTarget; setOpen(i); }}
                className="group nl-zoom relative block w-full bg-paper" aria-label={`Open photo: ${it.media.alt}`}>
                <Image src={it.media.url} alt={it.media.alt} width={it.media.width ?? 1200} height={it.media.height ?? 960}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full" />
                {it.category && <span className="absolute bottom-0 left-0 bg-ink/80 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{it.category.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {current && (
          <motion.div
            ref={dialogRef}
            role="dialog" aria-modal="true" aria-label={current.media.alt} tabIndex={-1}
            className="fixed inset-0 z-[200] flex flex-col bg-ink/95 text-white outline-none backdrop-blur"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <div className="flex items-center justify-between px-[var(--nl-pad)] py-4">
              <p className="nl-num text-sm text-white/70">{(open ?? 0) + 1} / {shown.length}</p>
              <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center hover:bg-white/10" aria-label="Close"><X className="h-6 w-6" /></button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-14 pb-4 sm:px-20" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
              <motion.div key={current.id} className="relative h-full w-full"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Image src={current.media.url} alt={current.media.alt} fill sizes="100vw" className="object-contain" />
              </motion.div>
              {shown.length > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 hover:bg-white/10 sm:left-5" aria-label="Previous photo"><ChevronLeft className="h-6 w-6" /></button>
                  <button type="button" onClick={() => step(1)} className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 hover:bg-white/10 sm:right-5" aria-label="Next photo"><ChevronRight className="h-6 w-6" /></button>
                </>
              )}
            </div>
            <div className="px-[var(--nl-pad)] pb-6 text-center text-sm text-white/75">
              <p className="m-0">{current.caption ?? current.media.alt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
