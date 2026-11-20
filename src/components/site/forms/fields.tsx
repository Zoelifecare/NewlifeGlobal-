"use client";
import { useId } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FormResult } from "@/lib/validation/forms";

export function Field({
  name, label, error, hint, type = "text", required, textarea, autoComplete, ...rest
}: {
  name: string; label: string; error?: string; hint?: string; type?: string; required?: boolean; textarea?: boolean; autoComplete?: string;
} & Record<string, unknown>) {
  const id = `f-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  const common = { id, name, required, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, className: "nl-input", autoComplete, ...rest };
  return (
    <div className="nl-field">
      <label htmlFor={id}>{label}{required ? <span aria-hidden className="text-blue-deep"> *</span> : <span className="font-normal text-muted"> (optional)</span>}</label>
      {textarea ? <textarea {...common} /> : <input type={type} {...common} />}
      {hint && <p id={`${id}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="nl-error">{error}</p>}
    </div>
  );
}

/** Honeypot: hidden from people and assistive tech; bots fill it. */
export function Honeypot() {
  const id = useId();
  return (
    <div className="nl-hp" aria-hidden="true">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function FormStatus({ status, result }: { status: string; result?: FormResult }) {
  if (status === "done" && result) {
    return (
      <div role="status" className="flex gap-3 border border-blue/30 bg-mist p-5 text-ink">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-deep" aria-hidden />
        <p className="m-0">{result.message}</p>
      </div>
    );
  }
  if (status === "error" && result) {
    return <p role="alert" className="m-0 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{result.message}</p>;
  }
  return null;
}
