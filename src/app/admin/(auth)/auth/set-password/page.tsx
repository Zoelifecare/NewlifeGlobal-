import { SetPasswordForm } from "@/components/admin/set-password-form";

export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Choose a password</h1>
      <p className="mb-8 mt-2 text-sm text-muted">Use at least 10 characters. A passphrase works well.</p>
      <SetPasswordForm />
    </>
  );
}
