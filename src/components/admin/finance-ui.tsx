"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/actions";
import { btnPrimary, btnSecondary } from "./ui";

type FormAction = (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;

/** A form bound to a server action; shows the result, refreshes the page on success. Children are the fields. */
export function ActionForm({ action, children, submitLabel = "Save", pendingLabel = "Saving…", className = "grid gap-4", reset = false, danger = false, confirmText, redirectTo }: {
  action: FormAction; children: React.ReactNode; submitLabel?: string; pendingLabel?: string; className?: string;
  reset?: boolean; danger?: boolean; confirmText?: string; redirectTo?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => {
    if (!state?.ok) return;
    if (reset) ref.current?.reset();
    if (redirectTo) router.push(redirectTo); else router.refresh();
  }, [state, reset, redirectTo, router]);
  return (
    <form ref={ref} action={formAction} className={className}
      onSubmit={(e) => { if (confirmText && !confirm(confirmText)) e.preventDefault(); }}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={danger ? `${btnSecondary} !border-red-200 !text-red-700 hover:!bg-red-50` : btnPrimary}>{pending ? pendingLabel : submitLabel}</button>
        {state && <p role={state.ok ? "status" : "alert"} className={`m-0 text-sm ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

/** A single button that runs a server action (optionally after a confirm). */
export function ActionButton({ run, label, confirmText, className = btnSecondary, redirectTo }: {
  run: () => Promise<ActionResult>; label: string; confirmText?: string; className?: string; redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className={className}
        onClick={() => { if (confirmText && !confirm(confirmText)) return; start(async () => { const r = await run(); setMsg(r); if (r.ok) { if (redirectTo) router.push(redirectTo); else router.refresh(); } }); }}>
        {pending ? "Working…" : label}
      </button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-blue-deep" : "text-red-700"}`}>{msg.message}</span>}
    </span>
  );
}

/** Collapsible editor row used by the catalogue pages. */
export function Disclosure({ summary, children, defaultOpen = false }: { summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-line bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="ml-auto text-xs font-semibold text-blue-deep group-open:hidden">Edit</span>
        <span className="ml-auto hidden text-xs font-semibold text-muted group-open:inline">Close</span>
      </summary>
      <div className="border-t border-line p-5">{children}</div>
    </details>
  );
}
