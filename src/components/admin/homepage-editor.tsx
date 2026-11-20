"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { Media } from "@/lib/content/types";
import { saveHomepageSection } from "@/lib/admin/site-actions";
import { MediaPicker } from "./media-picker";
import { btnPrimary, inputCls } from "./ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Section { key: string; kicker: string | null; title: string | null; body: string | null; data: any; sort_order: number; is_visible: boolean }

const NAMES: Record<string, string> = {
  hero: "Hero slider", stats: "Stats strip", chapters: "Three chapters (01 / 02 / 03)", "invite-band": "Visit invitation band",
  discover: "Discover New Life pathways", pathways: "Featured message & event", ministries: "Ministry highlights",
  global: "Rwanda & global connection", testimonies: "Testimonies", invitation: "Final invitation",
};

export function HomepageEditor({ sections, media }: { sections: Section[]; media: Media[] }) {
  const [open, setOpen] = useState<string | null>("hero");
  return (
    <ol className="grid gap-3">
      {sections.map((s) => (
        <li key={s.key} className="rounded-lg border border-line bg-white">
          <button type="button" onClick={() => setOpen(open === s.key ? null : s.key)} aria-expanded={open === s.key}
            className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <span className="w-8 text-xs font-semibold tabular-nums text-muted">{String(s.sort_order).padStart(2, "0")}</span>
            <span className="flex-1 font-semibold">{NAMES[s.key] ?? s.key}</span>
            {s.is_visible ? <Eye className="h-4 w-4 text-blue-deep" aria-label="Visible" /> : <EyeOff className="h-4 w-4 text-muted" aria-label="Hidden" />}
            <ChevronDown className={`h-4 w-4 transition-transform ${open === s.key ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {open === s.key && <SectionForm s={s} media={media} />}
        </li>
      ))}
    </ol>
  );
}

function SectionForm({ s, media }: { s: Section; media: Media[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [kicker, setKicker] = useState(s.kicker ?? "");
  const [title, setTitle] = useState(s.title ?? "");
  const [body, setBody] = useState(s.body ?? "");
  const [visible, setVisible] = useState(s.is_visible);
  const [order, setOrder] = useState(s.sort_order);
  const [data, setData] = useState<any>(s.data ?? {});
  const [json, setJson] = useState(JSON.stringify(s.data ?? {}, null, 2));

  const save = () => start(async () => {
    let payloadData = data;
    if (!["hero", "chapters"].includes(s.key)) {
      try { payloadData = JSON.parse(json); } catch { setMsg({ ok: false, text: "The advanced settings are not valid JSON." }); return; }
    }
    const r = await saveHomepageSection(s.key, { kicker, title, body, isVisible: visible, sortOrder: order, data: payloadData });
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) router.refresh();
  });

  const field = (label: string, value: string, set: (v: string) => void, opts: { area?: boolean; max?: number } = {}) => (
    <label className="grid gap-1 text-sm font-medium">{label}
      {opts.area ? <textarea value={value} onChange={(e) => set(e.target.value)} rows={3} maxLength={opts.max} className={inputCls} />
        : <input value={value} onChange={(e) => set(e.target.value)} maxLength={opts.max} className={inputCls} />}
    </label>
  );

  return (
    <div className="grid gap-5 border-t border-line p-5">
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />Show on homepage</label>
        <label className="flex items-center gap-2 text-sm font-medium">Order<input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={`${inputCls} w-20`} /></label>
      </div>
      {s.key !== "hero" && (
        <div className="grid gap-4 md:grid-cols-2">
          {field("Kicker (small label)", kicker, setKicker, { max: 120 })}
          {field("Heading", title, setTitle, { max: 200 })}
          <div className="md:col-span-2">{field("Intro text", body, setBody, { area: true, max: 2000 })}</div>
        </div>
      )}

      {s.key === "hero" && (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {(["primaryCta", "secondaryCta"] as const).map((k) => (
              <fieldset key={k} className="grid gap-2 rounded-md border border-line p-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">{k === "primaryCta" ? "Primary button" : "Secondary button"}</legend>
                <input aria-label="Label" placeholder="Label" value={data[k]?.label ?? ""} onChange={(e) => setData({ ...data, [k]: { ...data[k], label: e.target.value } })} className={inputCls} />
                <input aria-label="Link" placeholder="/visit or #chapters" value={data[k]?.href ?? ""} onChange={(e) => setData({ ...data, [k]: { ...data[k], href: e.target.value } })} className={inputCls} />
              </fieldset>
            ))}
          </div>
          {(data.slides ?? []).map((sl: any, i: number) => (
            <fieldset key={i} className="grid gap-3 rounded-md border border-line p-4">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Slide {String(i + 1).padStart(2, "0")}</legend>
              <div className="grid gap-3 md:grid-cols-2">
                <input aria-label="Chapter label" placeholder="Chapter label (e.g. Faith & Worship)" value={sl.label ?? ""} onChange={(e) => upd(i, { label: e.target.value })} className={inputCls} />
                <input aria-label="Caption" placeholder="Caption under the label" value={sl.caption ?? ""} onChange={(e) => upd(i, { caption: e.target.value })} className={inputCls} />
              </div>
              <textarea aria-label="Headline" placeholder="Headline (press Enter for a new line)" rows={2} value={sl.headline ?? ""} onChange={(e) => upd(i, { headline: e.target.value })} className={inputCls} />
              <textarea aria-label="Description" placeholder="Description" rows={3} value={sl.body ?? ""} onChange={(e) => upd(i, { body: e.target.value })} className={inputCls} />
              <MediaPicker name={`slide-${i}`} initialId={sl.mediaId ?? null} media={media} onChange={(id) => upd(i, { mediaId: id })} />
              <button type="button" onClick={() => setData({ ...data, slides: data.slides.filter((_: unknown, j: number) => j !== i) })} className="inline-flex w-fit items-center gap-1 text-sm text-red-700"><Trash2 className="h-4 w-4" />Remove slide</button>
            </fieldset>
          ))}
          {(data.slides?.length ?? 0) < 5 && <button type="button" onClick={() => setData({ ...data, slides: [...(data.slides ?? []), { label: "", caption: "", headline: "", body: "" }] })} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add slide</button>}
        </div>
      )}

      {s.key === "chapters" && (
        <div className="grid gap-5">
          {(data.chapters ?? []).map((c: any, i: number) => (
            <fieldset key={i} className="grid gap-3 rounded-md border border-line p-4">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Chapter {String(i + 1).padStart(2, "0")}</legend>
              <div className="grid gap-3 md:grid-cols-2">
                <input aria-label="Title" placeholder="Title" value={c.title ?? ""} onChange={(e) => updC(i, { title: e.target.value })} className={inputCls} />
                <input aria-label="Lead sentence" placeholder="Lead sentence" value={c.lead ?? ""} onChange={(e) => updC(i, { lead: e.target.value })} className={inputCls} />
              </div>
              <textarea aria-label="Text" placeholder="Text" rows={4} value={c.body ?? ""} onChange={(e) => updC(i, { body: e.target.value })} className={inputCls} />
              <textarea aria-label="Points" placeholder="Bullet points (one per line)" rows={3} value={(c.points ?? []).join("\n")} onChange={(e) => updC(i, { points: e.target.value.split("\n") })} className={inputCls} />
              <div className="grid gap-3 md:grid-cols-3">
                <input aria-label="Button label" placeholder="Link label" value={c.cta?.label ?? ""} onChange={(e) => updC(i, { cta: { ...c.cta, label: e.target.value } })} className={inputCls} />
                <input aria-label="Button link" placeholder="/messages" value={c.cta?.href ?? ""} onChange={(e) => updC(i, { cta: { ...c.cta, href: e.target.value } })} className={inputCls} />
                <input aria-label="YouTube video ID (plays on hover)" placeholder="YouTube ID for hover video" value={c.videoId ?? ""} onChange={(e) => updC(i, { videoId: e.target.value.trim() })} className={inputCls} />
              </div>
              <MediaPicker name={`chapter-${i}`} initialId={c.mediaId ?? null} media={media} onChange={(id) => updC(i, { mediaId: id })} />
            </fieldset>
          ))}
        </div>
      )}

      {!["hero", "chapters"].includes(s.key) && (
        <details className="rounded-md border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold">Advanced settings (JSON)</summary>
          <p className="mt-2 text-xs text-muted">Items, links and media ids used by this section. Keep the structure; edit values only.</p>
          <textarea aria-label="Advanced settings" value={json} onChange={(e) => setJson(e.target.value)} rows={12} spellCheck={false} className={`${inputCls} mt-2 font-mono text-xs`} />
        </details>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save section"}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-blue-deep" : "text-red-700"}`}>{msg.text}</p>}
      </div>
    </div>
  );

  function upd(i: number, patch: Record<string, unknown>) { setData({ ...data, slides: data.slides.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) }); }
  function updC(i: number, patch: Record<string, unknown>) { setData({ ...data, chapters: data.chapters.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) }); }
}
