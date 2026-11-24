"use client";
import { useEffect, useRef, useState } from "react";
import type { FormKind, FormResult } from "@/lib/validation/forms";

export function usePublicForm(kind: FormKind) {
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error"; result?: FormResult }>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    form.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach((c) => (body[c.name] = c.checked));
    body.fillMs = Date.now() - startedAt.current;
    setState({ status: "sending" });
    try {
      const res = await fetch(`/api/forms/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = (await res.json()) as FormResult;
      setState({ status: result.ok ? "done" : "error", result });
      if (result.ok) form.reset();
      else if (result.fieldErrors) {
        const first = Object.keys(result.fieldErrors)[0];
        form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      }
    } catch {
      setState({ status: "error", result: { ok: false, message: "Network error. Please check your connection and try again." } });
    }
  }

  const err = (name: string) => state.result?.fieldErrors?.[name];
  return { state, onSubmit, err };
}
