"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { GivingMethod, GivingSettings, NavItem } from "@/lib/content/types";
import { saveGiving, saveNavigation, saveVisitFaq } from "@/lib/admin/identity-actions";
import { btnPrimary, inputCls } from "./ui";

function useSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.message }); if (r.ok) router.refresh(); });
  return { pending, msg, save };
}

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return msg ? <p role="status" className={`text-sm ${msg.ok ? "text-blue-deep" : "text-red-700"}`}>{msg.text}</p> : null;
}

const move = <T,>(list: T[], i: number, d: -1 | 1) => {
  const j = i + d; if (j < 0 || j >= list.length) return list;
  const copy = [...list]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
};

/* ------------------------------------------------------------------ giving */
export function GivingEditor({ initial }: { initial: GivingSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [methods, setMethods] = useState<GivingMethod[]>(initial.methods);
  const { pending, msg, save } = useSave();
  const set = (i: number, patch: Partial<GivingMethod>) => setMethods(methods.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <div className="grid gap-5 rounded-lg border border-line bg-white p-6">
      <p className="rounded-md border border-line bg-[#f6f8fa] p-4 text-sm text-body">
        The website does not process payments. Add only giving methods the church has approved, with the secure https link from the giving
        provider. Without a method, the Give page tells visitors that online giving is coming soon.
      </p>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />
        Show the Give page and Give buttons
      </label>
      <ol className="grid gap-3">
        {methods.map((m, i) => (
          <li key={i} className="grid gap-3 rounded-md border border-line p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">Method name<input value={m.label} maxLength={80} onChange={(e) => set(i, { label: e.target.value })} className={inputCls} placeholder="e.g. Give online" /></label>
              <label className="grid gap-1 text-sm font-medium">Approved giving link (https)<input type="url" value={m.url ?? ""} maxLength={500} onChange={(e) => set(i, { url: e.target.value })} className={inputCls} placeholder="https://" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Description<input value={m.description} maxLength={400} onChange={(e) => set(i, { description: e.target.value })} className={inputCls} /></label>
            <label className="grid gap-1 text-sm font-medium">Note (shown when there is no link)<input value={m.note ?? ""} maxLength={200} onChange={(e) => set(i, { note: e.target.value })} className={inputCls} /></label>
            <button type="button" onClick={() => setMethods(methods.filter((_, j) => j !== i))} className="inline-flex w-fit items-center gap-1 text-sm text-red-700"><Trash2 className="h-4 w-4" />Remove</button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setMethods([...methods, { label: "", description: "", url: null, note: null }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add giving method</button>
      <div className="flex items-center gap-3"><button type="button" disabled={pending} onClick={() => save(() => saveGiving({ enabled, methods }))} className={btnPrimary}>{pending ? "Saving…" : "Save giving"}</button><Status msg={msg} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ visit FAQ */
export function FaqEditor({ initial }: { initial: { q: string; a: string }[] }) {
  const [faq, setFaq] = useState(initial);
  const { pending, msg, save } = useSave();
  return (
    <div className="grid gap-4 rounded-lg border border-line bg-white p-6">
      <p className="text-sm text-muted">Shown as numbered questions on Plan Your Visit. The page introduction, what to expect and kids text are edited under Church content.</p>
      {faq.map((f, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-line p-4">
          <input aria-label="Question" placeholder="Question" value={f.q} maxLength={200} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} className={inputCls} />
          <textarea aria-label="Answer" placeholder="Answer" rows={2} value={f.a} maxLength={1500} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} className={inputCls} />
          <div className="flex gap-3 text-sm">
            <button type="button" aria-label="Move up" onClick={() => setFaq(move(faq, i, -1))}><ArrowUp className="h-4 w-4" /></button>
            <button type="button" aria-label="Move down" onClick={() => setFaq(move(faq, i, 1))}><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-red-700">Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setFaq([...faq, { q: "", a: "" }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add question</button>
      <div className="flex items-center gap-3"><button type="button" disabled={pending} onClick={() => save(() => saveVisitFaq(faq))} className={btnPrimary}>{pending ? "Saving…" : "Save questions"}</button><Status msg={msg} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ navigation & page visibility */
const PAGES: [string, string][] = [["about", "About"], ["ministries", "Ministries"], ["messages", "Messages"], ["events", "Events"], ["gallery", "Gallery"], ["prayer", "Prayer requests"], ["visit", "Plan Your Visit"], ["contact", "Contact"], ["give", "Give"]];

export function NavigationEditor({ initialNav, initialPages }: { initialNav: NavItem[]; initialPages: Record<string, boolean> }) {
  const [nav, setNav] = useState<NavItem[]>(initialNav);
  const [pages, setPages] = useState(initialPages);
  const { pending, msg, save } = useSave();
  const setItem = (i: number, patch: Partial<NavItem>) => setNav(nav.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const setChild = (i: number, c: number, patch: Partial<NavItem>) =>
    setItem(i, { children: (nav[i].children ?? []).map((x, k) => (k === c ? { ...x, ...patch } : x)) });

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 rounded-lg border border-line bg-white p-6">
        <h2 className="font-semibold">Page visibility</h2>
        <p className="text-sm text-muted">A hidden page is removed from menus and returns &quot;not found&quot;. Content is kept.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PAGES.map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pages[k] !== false} onChange={(e) => setPages({ ...pages, [k]: e.target.checked })} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />{l}
            </label>
          ))}
        </div>
      </section>
      <section className="grid gap-3 rounded-lg border border-line bg-white p-6">
        <h2 className="font-semibold">Main menu</h2>
        <p className="text-sm text-muted">Items with sub-items open a numbered dropdown. Links must start with / (a page on this site) or https://.</p>
        {nav.map((n, i) => (
          <div key={i} className="grid gap-3 rounded-md border border-line p-4">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
              <input aria-label="Label" value={n.label} maxLength={40} onChange={(e) => setItem(i, { label: e.target.value })} className={inputCls} />
              <input aria-label="Link" value={n.href} maxLength={300} onChange={(e) => setItem(i, { href: e.target.value })} className={inputCls} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={n.visible} onChange={(e) => setItem(i, { visible: e.target.checked })} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />Visible</label>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Move up" onClick={() => setNav(move(nav, i, -1))}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label="Move down" onClick={() => setNav(move(nav, i, 1))}><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label="Remove item" onClick={() => setNav(nav.filter((_, j) => j !== i))} className="text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid gap-2 border-l-2 border-line pl-4">
              {(n.children ?? []).map((c, k) => (
                <div key={k} className="grid gap-2 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
                  <input aria-label="Sub-item label" value={c.label} maxLength={40} onChange={(e) => setChild(i, k, { label: e.target.value })} className={inputCls} />
                  <input aria-label="Sub-item link" value={c.href} maxLength={300} onChange={(e) => setChild(i, k, { href: e.target.value })} className={inputCls} />
                  <input aria-label="Sub-item description" placeholder="Description" value={c.description ?? ""} maxLength={80} onChange={(e) => setChild(i, k, { description: e.target.value })} className={inputCls} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.visible} onChange={(e) => setChild(i, k, { visible: e.target.checked })} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />Visible</label>
                  <button type="button" aria-label="Remove sub-item" onClick={() => setItem(i, { children: (n.children ?? []).filter((_, x) => x !== k) })} className="text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setItem(i, { children: [...(n.children ?? []), { label: "", href: "/", visible: true }] })} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add sub-item</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setNav([...nav, { label: "", href: "/", visible: true }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add menu item</button>
      </section>
      <div className="flex items-center gap-3"><button type="button" disabled={pending} onClick={() => save(() => saveNavigation({ navigation: nav, pages }))} className={btnPrimary}>{pending ? "Saving…" : "Save navigation"}</button><Status msg={msg} /></div>
    </div>
  );
}
