"use client";
import { ArrowRight } from "lucide-react";
import { usePublicForm } from "./use-public-form";
import { Honeypot } from "./fields";

export function NewsletterForm() {
  const { state, onSubmit, err } = usePublicForm("newsletter");
  if (state.status === "done") return <p role="status" className="text-sm text-blue">{state.result?.message}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-2" aria-label="Newsletter">
      <Honeypot />
      <label htmlFor="nl-email" className="text-xs text-white/60">Get church updates by email</label>
      <div className="flex">
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com"
          aria-invalid={err("email") ? true : undefined}
          className="min-w-0 flex-1 border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-blue focus:outline-none" />
        <button type="submit" disabled={state.status === "sending"} aria-label="Subscribe" className="flex w-11 items-center justify-center bg-blue-deep text-white hover:bg-blue hover:text-blue-ink">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {(err("email") || state.status === "error") && <p role="alert" className="text-xs text-red-300">{err("email") ?? state.result?.message}</p>}
    </form>
  );
}
