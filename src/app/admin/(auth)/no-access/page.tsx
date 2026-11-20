import { signOut } from "@/lib/admin/auth-actions";

export default function NoAccessPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">No access yet</h1>
      <p className="mt-3 text-sm text-body">You&apos;re signed in, but your account hasn&apos;t been given a staff role. Ask a super admin to assign one.</p>
      <form action={signOut} className="mt-8"><button type="submit" className="text-sm font-semibold text-blue-deep">Sign out</button></form>
    </>
  );
}
