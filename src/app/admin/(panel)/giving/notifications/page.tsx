import { requireStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/notify";
import { Card, PageTitle, btnSecondary, fmtDate, inputCls } from "@/components/admin/ui";
import { F, Pill } from "@/components/admin/finance-fields";
import { ActionButton, ActionForm } from "@/components/admin/finance-ui";
import { resendNotification, saveNotificationSettings, sendTest } from "@/lib/admin/finance-actions";
import { NOTIFY_TYPES } from "@/lib/admin/finance-constants";

export default async function Notifications({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [staff, sp] = await Promise.all([requireStaff(), searchParams]);
  const supabase = await createSupabaseServerClient();
  let lq = supabase.from("notification_log").select("*").order("created_at", { ascending: false }).limit(200);
  if (sp.status === "failed" || sp.status === "sent" || sp.status === "queued") lq = lq.eq("status", sp.status);
  const [{ data: settings }, { data: log }] = await Promise.all([
    supabase.from("finance_notification_settings").select("*").eq("id", 1).maybeSingle(),
    lq,
  ]);
  const enabled = new Set<string>((settings?.enabled_types as string[] | undefined) ?? NOTIFY_TYPES.map((t) => t.value));
  const configured = emailConfigured();

  return (
    <>
      <PageTitle title="Finance notifications" description="Automatic emails to the finance team for every giving submission, and confirmations to donors. Emails never include bank details, card data or passwords." />
      <p className={`mb-6 rounded-md border p-3 text-sm ${configured ? "border-sky-200 bg-sky-50 text-sky-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {configured ? "Email service is configured on the server." : "Email service is not configured yet. Set RESEND_API_KEY and EMAIL_FROM in the hosting environment (Vercel › Settings › Environment Variables) and redeploy. Until then every notification is logged here as failed so nothing is lost; submissions are still saved."}
      </p>
      <div className="grid gap-6 xl:grid-cols-[26rem_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-semibold">Settings</h2>
          {staff.isAdmin ? (
            <>
              <ActionForm action={saveNotificationSettings}>
                <F label="Finance recipients" hint="One or more addresses, separated by commas. Stored in the database, never in the website code.">
                  <textarea name="recipients" rows={3} defaultValue={((settings?.recipients as string[] | undefined) ?? []).join(", ")} className={inputCls} placeholder="finance@yourdomain.org" />
                </F>
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-sm font-medium">Send emails for</legend>
                  {NOTIFY_TYPES.map((t) => (
                    <label key={t.value} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" name="enabled_types" value={t.value} defaultChecked={enabled.has(t.value)} className="mt-0.5 h-4 w-4 accent-[#163a33]" />
                      <span>{t.label}{t.hint && <span className="block text-xs text-muted">{t.hint}</span>}</span>
                    </label>
                  ))}
                </fieldset>
              </ActionForm>
              <div className="mt-5 border-t border-line pt-4"><ActionButton run={sendTest} label="Send a test email" /></div>
            </>
          ) : (
            <p className="text-sm text-muted">Only a Super Admin can change recipients and notification types. Current recipients: {((settings?.recipients as string[] | undefined) ?? []).length || "none"}.</p>
          )}
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold">Notification log</h2>
            <form className="ml-auto flex gap-2">
              <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className={`${inputCls} w-auto`}><option value="">All</option><option value="failed">Failed</option><option value="sent">Sent</option><option value="queued">Queued</option></select>
              <button type="submit" className={btnSecondary}>Filter</button>
            </form>
          </div>
          {!log?.length ? <p className="p-5 text-sm text-muted">No notifications yet.</p> : (
            <ul>
              {log.map((l) => (
                <li key={l.id} className="grid gap-1 border-b border-line px-5 py-3 text-sm last:border-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <Pill status={l.status} /><span className="rounded bg-mist px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-deep">{l.audience}</span>
                    <span className="font-medium">{l.subject}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span>To {l.recipient}</span><span>{fmtDate(l.created_at, true)}</span><span>{l.attempts} attempt(s)</span>
                    {l.error && <span className="text-red-700">{l.error}</span>}
                    {l.status === "failed" && l.record_id && <span className="ml-auto"><ActionButton run={resendNotification.bind(null, l.id)} label="Resend" className="text-xs font-semibold text-blue-deep hover:underline" /></span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
