"use client";
import { useActionState } from "react";
import { setPassword } from "@/lib/admin/auth-actions";
import { btnPrimary, inputCls } from "./ui";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, null);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">New password<input name="password" type="password" minLength={10} required autoComplete="new-password" className={inputCls} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Confirm password<input name="confirm" type="password" minLength={10} required autoComplete="new-password" className={inputCls} /></label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${btnPrimary} py-2.5`}>{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
