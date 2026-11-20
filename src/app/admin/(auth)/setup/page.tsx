import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SetupPage() {
  if (isSupabaseConfigured) redirect("/admin/login");
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Connect the database</h1>
      <p className="mt-3 text-sm text-body">
        The admin dashboard needs a Supabase project. Until it is connected, the public website shows the verified starter content
        read-only, and forms cannot be saved.
      </p>
      <ol className="mt-6 grid list-decimal gap-2 pl-5 text-sm text-body">
        <li>Create a Supabase project.</li>
        <li>Run the SQL files in <code>supabase/migrations</code>, then <code>supabase/seed.sql</code>.</li>
        <li>Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>.</li>
        <li>Create the first super admin (see <code>docs/deployment.md</code>).</li>
      </ol>
      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-blue-deep">← Back to the website</Link>
    </>
  );
}
