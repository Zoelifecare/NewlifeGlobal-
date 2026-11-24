import "server-only";
import { createSupabaseServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { adminUrl } from "@/lib/site-url";
import {
  donorEmail, financeEmail, resendTransport, sendWithRetry,
  type EmailMessage, type FinanceNotificationType, type GivingRecord, type Transport,
} from "./core";

/**
 * Server-side email notifications. Recipients and switches come from finance_notification_settings
 * (managed by super admins); credentials come from env vars (RESEND_API_KEY, EMAIL_FROM).
 * Every attempt is logged in notification_log so failures can be found and resent.
 * Uses the service-role client because notification settings and logs are not readable by the public
 * submitter; the key never leaves the server.
 */

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function transport(): Transport | null {
  if (!emailConfigured()) return null;
  return resendTransport(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!);
}

async function deliver(audience: "finance" | "donor" | "test", type: string, msg: EmailMessage, rec?: { table?: string; id?: string; reference?: string }) {
  const db = createSupabaseServiceClient();
  const { data: log } = await db.from("notification_log").insert({
    audience, type, record_table: rec?.table ?? null, record_id: rec?.id ?? null, reference: rec?.reference ?? null,
    recipient: msg.to, subject: msg.subject, status: "queued",
  }).select("id").single();
  const t = transport();
  const result = t ? await sendWithRetry(t, msg) : { ok: false, attempts: 0, error: "Email service not configured (set RESEND_API_KEY and EMAIL_FROM)" };
  if (log) {
    await db.from("notification_log").update({
      status: result.ok ? "sent" : "failed", attempts: result.attempts, error: result.ok ? null : result.error ?? "failed",
      provider_id: "providerId" in result ? result.providerId ?? null : null, last_attempt_at: new Date().toISOString(),
    }).eq("id", log.id);
  }
  return result.ok;
}

interface Settings { recipients: string[]; enabled_types: string[] }
async function settings(): Promise<Settings | null> {
  const db = createSupabaseServiceClient();
  const { data } = await db.from("finance_notification_settings").select("recipients, enabled_types").eq("id", 1).maybeSingle();
  return (data as Settings) ?? null;
}

/**
 * Notify the finance team and (optionally) the donor about a saved giving record.
 * Never throws: a failed email must not undo or block the saved record. Failures are logged for resending.
 */
export async function notifyGiving(record: Omit<GivingRecord, "adminUrl">, opts: { table: string; id: string; adminPath: string; notifyDonor: boolean }) {
  if (!isServiceRoleConfigured()) {
    console.error("[notify] SUPABASE_SERVICE_ROLE_KEY missing: notification for", record.reference, "not sent");
    return;
  }
  try {
    const s = await settings();
    const full: GivingRecord = { ...record, adminUrl: `${adminUrl()}${opts.adminPath}` };
    const rec = { table: opts.table, id: opts.id, reference: record.reference };
    if (s && s.enabled_types.includes(record.type)) {
      for (const to of s.recipients) await deliver("finance", record.type, financeEmail(full, to), rec);
    }
    if (opts.notifyDonor && record.donorEmail && (!s || s.enabled_types.includes("donor_confirmations"))) {
      await deliver("donor", record.type, donorEmail(full, record.donorEmail), rec);
    }
  } catch (e) {
    console.error("[notify] unexpected error", e);
  }
}

/** Resend a logged notification (finance admin action). Rebuilds the message from the stored record. */
export async function resendLogged(logId: number, rebuild: (table: string, id: string, audience: string, to: string, type: string) => Promise<EmailMessage | null>) {
  const db = createSupabaseServiceClient();
  const { data: log } = await db.from("notification_log").select("*").eq("id", logId).maybeSingle();
  if (!log) return { ok: false, message: "Notification not found." };
  const msg = log.record_table && log.record_id ? await rebuild(log.record_table, log.record_id, log.audience, log.recipient, log.type) : null;
  if (!msg) return { ok: false, message: "The original record no longer exists." };
  const t = transport();
  if (!t) return { ok: false, message: "Email service is not configured (RESEND_API_KEY, EMAIL_FROM)." };
  const r = await sendWithRetry(t, msg);
  await db.from("notification_log").update({
    status: r.ok ? "sent" : "failed", attempts: (log.attempts ?? 0) + r.attempts, error: r.ok ? null : r.error,
    provider_id: r.providerId ?? null, last_attempt_at: new Date().toISOString(),
  }).eq("id", logId);
  return { ok: r.ok, message: r.ok ? "Sent." : `Still failing: ${r.error}` };
}

/** Test message to every configured recipient. */
export async function sendTestNotification(recipients: string[]) {
  let sent = 0;
  for (const to of recipients) {
    const ok = await deliver("test", "test", {
      to,
      subject: "[New Life Global] Test notification",
      text: "This is a test of the New Life Global finance notification settings. If you received it, notifications are working.",
      html: `<p style="font-family:Helvetica,Arial,sans-serif">This is a test of the New Life Global finance notification settings. If you received it, notifications are working.</p>`,
    });
    if (ok) sent++;
  }
  return sent;
}

export type { FinanceNotificationType };
