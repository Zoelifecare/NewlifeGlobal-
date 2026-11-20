"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCapability } from "@/lib/auth/staff";
import { notifyGiving, resendLogged, sendTestNotification, emailConfigured } from "@/lib/notify";
import { donorEmail, financeEmail, isEmail, type FinanceNotificationType, type GivingRecord } from "@/lib/notify/core";
import { siteUrl } from "@/lib/site-url";
import type { ActionResult } from "./actions";
import { DONATION_METHODS as METHODS, METHOD_LABEL, NOTIFY_TYPES, PAYMENT_KINDS as KINDS, PLEDGE_STATUSES } from "./finance-constants";

/**
 * Finance actions. Every write goes through the signed-in finance user's own session, so RLS
 * (can_manage_finance) applies and the audit triggers record who changed what.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max) || null;
const uuid = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? ""); return UUID.test(v) ? v : null; };
const date = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? ""); return DATE.test(v) ? v : null; };
const money = (fd: FormData, k: string) => {
  const n = Number(String(fd.get(k) ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : null;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const fail = (message: string): ActionResult => ({ ok: false, message });
const done = (message: string, ...paths: string[]): ActionResult => { for (const p of paths) revalidatePath(p); return { ok: true, message }; };
const pgMessage = (e: { message?: string } | null) => (e?.message && !/permission|policy|42501/i.test(e.message) ? e.message : "You don't have permission to do this.");


/* ---------------------------------------------------------------- pledges */
export async function updatePledge(id: string, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  if (!UUID.test(id)) return fail("Invalid pledge.");
  const status = String(fd.get("status") ?? "");
  if (!(PLEDGE_STATUSES as readonly string[]).includes(status)) return fail("Choose a valid status.");
  const supabase = await createSupabaseServerClient();
  const { data: cur } = await supabase.from("pledges").select("status").eq("id", id).maybeSingle();
  if (!cur) return fail("Pledge not found.");
  if ((status === "fulfilled" || status === "partially_fulfilled") && cur.status !== status) {
    return fail("Fulfilment is set automatically when confirmed donations are linked to this pledge. Record a payment toward it instead.");
  }
  const { error, count } = await supabase.from("pledges").update({
    status, internal_notes: str(fd, "internal_notes", 4000), expected_by: date(fd, "expected_by"),
  }, { count: "exact" }).eq("id", id);
  if (error || !count) return fail(pgMessage(error));
  return done("Pledge updated.", "/admin/giving/pledges", `/admin/giving/pledges/${id}`);
}

export async function markPastDue(): Promise<ActionResult> {
  await requireCapability("finance");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("mark_past_due_pledges");
  if (error) return fail(pgMessage(error));
  return done(`${data ?? 0} pledge(s) marked past due.`, "/admin/giving/pledges");
}

/* ---------------------------------------------------------------- donations (the only revenue) */
export async function recordDonation(_p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const staff = await requireCapability("finance");
  const amount = money(fd, "amount");
  if (!amount) return fail("Enter the amount actually received.");
  const method = String(fd.get("method") ?? "");
  if (!(METHODS as readonly string[]).includes(method)) return fail("Choose how the gift was received.");
  const received_on = date(fd, "received_on");
  if (!received_on) return fail("Enter the date the gift was received.");
  const email = str(fd, "donor_email", 254);
  if (email && !isEmail(email)) return fail("The donor email is not valid.");
  const source = method === "cash" && fd.get("source") === "cash_drop" ? "cash_drop" : "manual_entry";
  const anonymous = bool(fd, "is_anonymous");
  const supabase = await createSupabaseServerClient();
  const row = {
    amount, method, received_on, source, designation_id: uuid(fd, "designation_id"), donor_name: anonymous ? null : str(fd, "donor_name", 120),
    donor_email: email, is_anonymous: anonymous, is_recurring: bool(fd, "is_recurring"), pledge_id: uuid(fd, "pledge_id"),
    receipt_number: str(fd, "receipt_number", 80), notes: str(fd, "notes"), recorded_by: staff.id,
  };
  const { data, error } = await supabase.from("donations").insert(row).select("id, reference, designation:giving_designations(name)").single();
  if (error || !data) return fail(pgMessage(error));
  if (bool(fd, "notify_donor") && email) {
    const type: FinanceNotificationType = method === "cash" ? "cash_recorded" : "donation_recorded";
    after(() => notifyGiving(
      { type, reference: data.reference, donorName: row.donor_name, donorEmail: email, amount, method: METHOD_LABEL[method],
        designation: (data.designation as unknown as { name: string } | null)?.name ?? null, submittedAt: new Date().toISOString() },
      { table: "donations", id: data.id, adminPath: `/admin/giving/donations?q=${data.reference}`, notifyDonor: true },
    ));
  }
  return done(`Donation ${data.reference} recorded.`, "/admin/giving", "/admin/giving/donations", "/admin/giving/pledges");
}

export async function deleteDonation(id: string): Promise<ActionResult> {
  const staff = await requireCapability("finance");
  if (!staff.isAdmin) return fail("Only a super admin can delete a confirmed donation.");
  if (!UUID.test(id)) return fail("Invalid donation.");
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("donations").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return fail(pgMessage(error));
  return done("Donation deleted. The audit log keeps a copy.", "/admin/giving", "/admin/giving/donations", "/admin/giving/pledges");
}

/* ---------------------------------------------------------------- pending submissions */
export async function verifySubmission(id: string, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  if (!UUID.test(id)) return fail("Invalid submission.");
  const amount = money(fd, "amount");
  if (!amount) return fail("Enter the amount actually received.");
  const supabase = await createSupabaseServerClient();
  const { data: donationId, error } = await supabase.rpc("verify_giving_submission", {
    p_submission: id, p_amount: amount, p_received_on: date(fd, "received_on"), p_pledge: uuid(fd, "pledge_id"), p_notes: str(fd, "notes"),
  });
  if (error || !donationId) return fail(pgMessage(error));
  if (bool(fd, "notify_donor")) {
    const { data: d } = await supabase.from("donations").select("id, reference, donor_name, donor_email, method, designation:giving_designations(name)").eq("id", donationId).single();
    if (d?.donor_email) {
      after(() => notifyGiving(
        { type: d.method === "cash" ? "cash_recorded" : "donation_recorded", reference: d.reference, donorName: d.donor_name, donorEmail: d.donor_email,
          amount, method: METHOD_LABEL[d.method], designation: (d.designation as unknown as { name: string } | null)?.name ?? null, submittedAt: new Date().toISOString() },
        { table: "donations", id: d.id, adminPath: `/admin/giving/donations?q=${d.reference}`, notifyDonor: true },
      ));
    }
  }
  return done("Verified. A confirmed donation was recorded.", "/admin/giving", "/admin/giving/submissions", `/admin/giving/submissions/${id}`, "/admin/giving/donations");
}

export async function rejectSubmission(id: string, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  if (!UUID.test(id)) return fail("Invalid submission.");
  const notes = str(fd, "internal_notes", 4000);
  if (!notes) return fail("Add a note explaining why (for example: no matching payment found).");
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("giving_submissions").update({ status: "rejected", internal_notes: notes }, { count: "exact" }).eq("id", id).eq("status", "pending");
  if (error || !count) return fail(pgMessage(error));
  return done("Marked as not received.", "/admin/giving/submissions", `/admin/giving/submissions/${id}`);
}

export async function saveSubmissionNotes(id: string, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  if (!UUID.test(id)) return fail("Invalid submission.");
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("giving_submissions").update({ internal_notes: str(fd, "internal_notes", 4000) }, { count: "exact" }).eq("id", id);
  if (error || !count) return fail(pgMessage(error));
  return done("Notes saved.", `/admin/giving/submissions/${id}`);
}

/* ---------------------------------------------------------------- catalogue: methods, designations, bank accounts */
export async function savePaymentMethod(id: string | null, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  const kind = String(fd.get("kind") ?? "");
  if (!(KINDS as readonly string[]).includes(kind)) return fail("Choose a method type.");
  const label = str(fd, "label", 80);
  if (!label || label.length < 2) return fail("Enter a label.");
  const url = str(fd, "url", 500);
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return fail("Links must start with https://");
  const active = bool(fd, "is_active");
  if (active && kind === "online_link" && !url) return fail("An online giving method needs its secure https link before it can be shown.");
  if (active && (kind === "zelle" || kind === "cashapp") && !str(fd, "handle")) return fail("Add the Zelle recipient or $Cashtag the church has approved before showing this method.");
  if (active && kind === "cash_drop" && !str(fd, "instructions") && !str(fd, "location")) return fail("Add the approved Cash Drop instructions or location before showing it.");
  const row = {
    kind, label, description: str(fd, "description", 300), instructions: str(fd, "instructions"), handle: str(fd, "handle", 120), url,
    location: str(fd, "location", 300), reference_info: str(fd, "reference_info", 300), image_id: uuid(fd, "image_id"),
    supports_recurring: bool(fd, "supports_recurring"), is_active: active, sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
  const supabase = await createSupabaseServerClient();
  const { error } = id && UUID.test(id) ? await supabase.from("payment_methods").update(row).eq("id", id) : await supabase.from("payment_methods").insert(row);
  if (error) return fail(pgMessage(error));
  revalidatePath("/give");
  return done(active ? "Saved. It is now shown on the Giving page." : "Saved. It stays hidden until you mark it active.", "/admin/giving/methods");
}

export async function deleteCatalogRow(table: "payment_methods" | "giving_designations" | "bank_accounts", id: string): Promise<ActionResult> {
  await requireCapability("finance");
  if (!UUID.test(id) || !["payment_methods", "giving_designations", "bank_accounts"].includes(table)) return fail("Invalid item.");
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("id", id);
  if (error || !count) return fail(pgMessage(error));
  revalidatePath("/give");
  return done("Deleted.", "/admin/giving/methods", "/admin/giving/designations", "/admin/giving/bank-accounts");
}

export async function saveDesignation(id: string | null, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  const name = str(fd, "name", 80);
  if (!name || name.length < 2) return fail("Enter a name.");
  const row = { name, description: str(fd, "description", 300), is_active: bool(fd, "is_active"), sort_order: Number(fd.get("sort_order") ?? 0) || 0 };
  const supabase = await createSupabaseServerClient();
  const { error } = id && UUID.test(id) ? await supabase.from("giving_designations").update(row).eq("id", id) : await supabase.from("giving_designations").insert(row);
  if (error) return fail(error.code === "23505" ? "A designation with that name already exists." : pgMessage(error));
  revalidatePath("/give");
  return done("Saved.", "/admin/giving/designations");
}

export async function saveBankAccount(id: string | null, _p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireCapability("finance");
  const nickname = str(fd, "nickname", 80);
  if (!nickname || nickname.length < 2) return fail("Enter a nickname.");
  const last4 = str(fd, "last4", 4);
  if (last4 && !/^\d{4}$/.test(last4)) return fail("Only the last 4 digits are stored. Never enter a full account or routing number.");
  const row = {
    nickname, bank_name: str(fd, "bank_name", 120), account_holder: str(fd, "account_holder", 120), last4,
    purpose: str(fd, "purpose", 200), notes: str(fd, "notes", 1000), is_active: bool(fd, "is_active"),
  };
  if (/\d{6,}/.test(`${row.notes ?? ""} ${row.purpose ?? ""}`)) return fail("Notes look like they contain an account number. Remove it: only the last 4 digits may be stored.");
  const supabase = await createSupabaseServerClient();
  const { error } = id && UUID.test(id) ? await supabase.from("bank_accounts").update(row).eq("id", id) : await supabase.from("bank_accounts").insert(row);
  if (error) return fail(pgMessage(error));
  return done("Saved.", "/admin/giving/bank-accounts");
}

/* ---------------------------------------------------------------- notifications */
export async function saveNotificationSettings(_p: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const staff = await requireCapability("admin");
  const recipients = [...new Set(String(fd.get("recipients") ?? "").split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const bad = recipients.filter((r) => !isEmail(r));
  if (bad.length) return fail(`Not a valid email: ${bad.join(", ")}`);
  if (recipients.length > 10) return fail("Up to 10 recipients.");
  const enabled = fd.getAll("enabled_types").map(String).filter((t) => NOTIFY_TYPES.some((n) => n.value === t));
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase.from("finance_notification_settings").update({ recipients, enabled_types: enabled, updated_by: staff.id }, { count: "exact" }).eq("id", 1);
  if (error || !count) return fail(pgMessage(error));
  return done("Notification settings saved.", "/admin/giving/notifications");
}

export async function sendTest(): Promise<ActionResult> {
  await requireCapability("admin");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("finance_notification_settings").select("recipients").eq("id", 1).maybeSingle();
  const recipients = (data?.recipients ?? []) as string[];
  if (!recipients.length) return fail("Add at least one recipient and save first.");
  const sent = await sendTestNotification(recipients);
  revalidatePath("/admin/giving/notifications");
  if (!emailConfigured()) return fail("Email service is not configured on the server (RESEND_API_KEY and EMAIL_FROM). The attempt was logged as failed.");
  return sent === recipients.length ? { ok: true, message: `Test sent to ${sent} recipient(s).` } : fail(`Sent to ${sent} of ${recipients.length}. See the log below for errors.`);
}

export async function resendNotification(logId: number): Promise<ActionResult> {
  await requireCapability("finance");
  if (!Number.isInteger(logId)) return fail("Invalid notification.");
  const supabase = await createSupabaseServerClient();
  const r = await resendLogged(logId, async (table, id, audience, to, type) => {
    const rec = await loadRecord(supabase, table, id, type as FinanceNotificationType);
    if (!rec) return null;
    return audience === "donor" ? donorEmail(rec, to) : financeEmail(rec, to);
  });
  revalidatePath("/admin/giving/notifications");
  return r;
}

type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;
async function loadRecord(db: Db, table: string, id: string, type: FinanceNotificationType): Promise<GivingRecord | null> {
  if (table === "pledges") {
    const { data: p } = await db.from("pledges").select("*, designation:giving_designations(name)").eq("id", id).maybeSingle();
    if (!p) return null;
    return { type, reference: p.reference, donorName: p.donor_name, donorEmail: p.donor_email, amount: Number(p.amount), frequency: p.frequency,
      method: p.intended_method, designation: p.designation?.name ?? null, submittedAt: p.created_at, expectedBy: p.expected_by, adminUrl: `${siteUrl()}/admin/giving/pledges/${id}` };
  }
  if (table === "giving_submissions") {
    const { data: s } = await db.from("giving_submissions").select("*, designation:giving_designations(name), method:payment_methods(label)").eq("id", id).maybeSingle();
    if (!s) return null;
    return { type, reference: s.reference, donorName: s.donor_name, donorEmail: s.donor_email, amount: Number(s.amount), frequency: s.frequency,
      method: s.method?.label ?? null, designation: s.designation?.name ?? null, submittedAt: s.created_at, adminUrl: `${siteUrl()}/admin/giving/submissions/${id}` };
  }
  if (table === "donations") {
    const { data: d } = await db.from("donations").select("*, designation:giving_designations(name)").eq("id", id).maybeSingle();
    if (!d) return null;
    return { type, reference: d.reference, donorName: d.donor_name, donorEmail: d.donor_email, amount: Number(d.amount), method: METHOD_LABEL[d.method],
      designation: d.designation?.name ?? null, submittedAt: d.created_at, adminUrl: `${siteUrl()}/admin/giving/donations?q=${d.reference}` };
  }
  return null;
}
