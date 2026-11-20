"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveResource, type ActionResult } from "@/lib/admin/actions";
import { toLocalInput, type Field } from "@/lib/admin/resources";
import type { Media } from "@/lib/content/types";
import { MediaPicker } from "./media-picker";
import { btnPrimary, btnSecondary, inputCls } from "./ui";

type Values = Record<string, unknown>;
interface Opt { value: string; label: string }

export function ResourceForm({
  resourceKey, singular, id, fields, initial, options, media, managerOnly, previewHref, publicHref,
}: {
  resourceKey: string; singular: string; id: string | null; fields: Field[]; initial: Values;
  options: Record<string, Opt[]>; media: Media[]; managerOnly: boolean; previewHref?: string; publicHref?: string;
}) {
  const router = useRouter();
  const bound = saveResource.bind(null, resourceKey, id);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(bound, null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      if (!id && state.id) router.replace(`/admin/${resourceKey}/${state.id}?created=1`);
      else router.refresh();
    }
  }, [state, id, resourceKey, router]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const visible = fields.filter((f) => !(managerOnly && f.editorOnly));
  const err = (n: string) => state?.fieldErrors?.[n];

  return (
    <form
      onSubmit={(e) => {
        // Submit via a transition (not <form action>) so React does not reset the fields when validation fails.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setDirty(false);
        startTransition(() => action(fd));
      }}
      onChange={() => setDirty(true)}
      className="grid gap-6"
      noValidate
    >
      <div className="grid gap-x-6 gap-y-5 rounded-lg border border-line bg-white p-5 sm:grid-cols-2 sm:p-7">
        {visible.map((f) => (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            <FieldInput f={f} value={initial[f.name] ?? (f.name === "leaders" ? initial.ministry_leaders : undefined)} error={err(f.name)} options={options} media={media} />
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-[#f4f6f9]/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Saving…" : id ? "Save changes" : `Create ${singular.toLowerCase()}`}</button>
        <Link href={`/admin/${resourceKey}`} className={btnSecondary}>Back to list</Link>
        {previewHref && id && <Link href={previewHref} className={btnSecondary}>Preview</Link>}
        {publicHref && <a href={publicHref} target="_blank" rel="noopener noreferrer" className={btnSecondary}>View on site ↗</a>}
        <p role="status" aria-live="polite" className={`text-sm ${state?.ok ? "text-blue-deep" : "text-red-700"}`}>
          {state?.message}{!state && dirty ? <span className="text-muted">Unsaved changes</span> : null}
        </p>
      </div>
    </form>
  );
}

function FieldInput({ f, value, error, options, media }: { f: Field; value: unknown; error?: string; options: Record<string, Opt[]>; media: Media[] }) {
  const id = `fld-${f.name}`;
  const describedBy = [f.help ? `${id}-help` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, name: f.name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  const label = (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
      {f.label}{f.required && <span className="text-red-600" aria-hidden> *</span>}
    </label>
  );
  const foot = (
    <>
      {f.help && <p id={`${id}-help`} className="mt-1 text-xs text-muted">{f.help}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </>
  );
  const str = value === null || value === undefined ? "" : String(value);

  switch (f.type) {
    case "textarea":
      return <>{label}<textarea {...common} defaultValue={str} rows={f.rows ?? 4} maxLength={f.max} className={inputCls} />{foot}</>;
    case "boolean":
      return (
        <>
          <label className="flex items-center gap-3 pt-6 text-sm font-medium text-ink">
            <input type="checkbox" {...common} defaultChecked={Boolean(value)} className="h-4 w-4 accent-[var(--nl-blue-deep)]" />{f.label}
          </label>
          {foot}
        </>
      );
    case "select":
      return <>{label}<select {...common} defaultValue={str || f.options?.[0]?.value} className={inputCls}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{foot}</>;
    case "relation":
      return (
        <>{label}
          <select {...common} defaultValue={str} className={inputCls}>
            <option value="">None</option>
            {(options[f.name] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>{foot}
        </>
      );
    case "date":
      return <>{label}<input type="date" {...common} defaultValue={str.slice(0, 10)} className={inputCls} />{foot}</>;
    case "datetime":
      return <>{label}<input type="datetime-local" {...common} defaultValue={toLocalInput(str || null)} className={inputCls} />{foot}</>;
    case "number":
      return <>{label}<input type="number" step={1} {...common} defaultValue={str} className={inputCls} />{foot}</>;
    case "tags":
      return <>{label}<textarea {...common} rows={4} defaultValue={Array.isArray(value) ? (value as string[]).join("\n") : ""} className={inputCls} />{foot}</>;
    case "media":
      return <>{label}<MediaPicker name={f.name} initialId={str || null} media={media} required={f.required} />{foot}</>;
    case "ministryLeaders":
      return <>{label}<LeadersEditor initial={(value as { leadership_id: string; role_title: string | null }[]) ?? []} options={options.__leaders ?? []} />{foot}</>;
    default:
      return <>{label}<input type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} {...common} defaultValue={str} maxLength={f.max} className={inputCls} />{foot}</>;
  }
}

function LeadersEditor({ initial, options }: { initial: { leadership_id: string; role_title: string | null }[]; options: Opt[] }) {
  const [rows, setRows] = useState(initial.map((r) => ({ leadership_id: r.leadership_id, role_title: r.role_title ?? "" })));
  return (
    <div className="grid gap-2">
      <input type="hidden" name="leaders" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <select aria-label="Leader" value={r.leadership_id} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, leadership_id: e.target.value } : x)))} className={inputCls}>
            <option value="">Choose a leader…</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input aria-label="Role in this ministry" placeholder="Role (e.g. Ministry Leader)" value={r.role_title} maxLength={120}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, role_title: e.target.value } : x)))} className={inputCls} />
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-md border border-line px-3 text-muted hover:text-red-700" aria-label="Remove leader"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { leadership_id: "", role_title: "" }])} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add leader</button>
    </div>
  );
}
