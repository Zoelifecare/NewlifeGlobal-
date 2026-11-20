"use client";
import { useActionState, useState } from "react";
import { requestPasswordReset, signIn } from "@/lib/admin/auth-actions";
import { btnPrimary, inputCls } from "./ui";

export function LoginForm({ next, startWithReset }: { next: string; startWithReset: boolean }) {
  const [mode, setMode] = useState<"login" | "reset">(startWithReset ? "reset" : "login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, null);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, null);

  if (mode === "reset") {
    return (
      <form action={resetAction} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className={inputCls} /></label>
        {resetState?.error && <p role="alert" className="text-sm text-red-700">{resetState.error}</p>}
        {resetState?.message && <p role="status" className="rounded-md bg-mist p-3 text-sm">{resetState.message}</p>}
        <button type="submit" disabled={resetPending} className={`${btnPrimary} py-2.5`}>{resetPending ? "Sending…" : "Send reset link"}</button>
        <button type="button" onClick={() => setMode("login")} className="text-sm text-muted hover:text-ink">← Back to sign in</button>
      </form>
    );
  }
  return (
    <form action={loginAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 text-sm font-medium">Email<input name="email" type="email" required autoComplete="username" className={inputCls} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className={inputCls} /></label>
      {loginState?.error && <p role="alert" className="text-sm text-red-700">{loginState.error}</p>}
      <button type="submit" disabled={loginPending} className={`${btnPrimary} py-2.5`}>{loginPending ? "Signing in…" : "Sign in"}</button>
      <button type="button" onClick={() => setMode("reset")} className="text-sm text-muted hover:text-ink">Forgot your password?</button>
    </form>
  );
}
