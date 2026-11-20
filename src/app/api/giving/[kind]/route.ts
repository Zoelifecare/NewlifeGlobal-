import { NextResponse, after, type NextRequest } from "next/server";
import { antiSpam } from "@/lib/validation/forms";
import { GIVING_FORMS, type GivingFormKind } from "@/lib/validation/giving";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { MIN_FILL_MS, allowRequest, clientKey } from "@/lib/security/rate-limit";
import { notifyGiving } from "@/lib/notify";
import type { FinanceNotificationType } from "@/lib/notify/core";

interface Result { ok: boolean; message: string; reference?: string; fieldErrors?: Record<string, string> }
const json = (b: Result, status = 200) => NextResponse.json(b, { status });

/**
 * Public giving submissions: pledges, donation intentions and manual payment confirmations.
 * None of these is counted as money received. They are saved through submit_pledge / submit_giving,
 * then the finance team (and the donor) are emailed after the response is sent.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!(kind in GIVING_FORMS)) return json({ ok: false, message: "Unknown form." }, 404);
  const k = kind as GivingFormKind;

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ ok: false, message: "Invalid origin." }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, message: "Invalid request." }, 400); }

  const spam = antiSpam.safeParse(body);
  if (!spam.success || Date.now() - spam.data.startedAt < MIN_FILL_MS) {
    return json({ ok: true, message: "Thank you.", reference: undefined }); // bots learn nothing, nothing is stored
  }

  const parsed = GIVING_FORMS[k].safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return json({ ok: false, message: "Please check the highlighted fields.", fieldErrors }, 422);
  }
  if (!isSupabaseConfigured) return json({ ok: false, message: "Giving forms are not available yet. Please try again later." }, 503);

  const db = createSupabaseAnonClient();
  try {
    if (!(await allowRequest(db, clientKey(req.headers, `giving-${k}`), 6, 900))) {
      return json({ ok: false, message: "Too many submissions. Please wait a few minutes and try again." }, 429);
    }
  } catch (e) {
    console.error(e);
    return json({ ok: false, message: "Something went wrong. Please try again." }, 500);
  }

  // names for the notification (public catalogue only)
  const lookup = async (designationId: string | null, methodId: string | null) => {
    const [d, m] = await Promise.all([
      designationId ? db.from("giving_designations").select("name").eq("id", designationId).maybeSingle() : Promise.resolve({ data: null }),
      methodId ? db.from("payment_methods").select("label, kind").eq("id", methodId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { designation: (d.data as { name: string } | null)?.name ?? null, method: (m.data as { label: string; kind: string } | null) };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = parsed.data as Record<string, any>;
  const now = new Date().toISOString();

  if (k === "pledge") {
    const p = parsed.data as import("zod").infer<typeof GIVING_FORMS.pledge>;
    const { data, error } = await db.rpc("submit_pledge", {
      p_name: p.name, p_email: p.email, p_phone: p.phone, p_amount: p.amount, p_frequency: p.frequency,
      p_designation: p.designationId, p_method: p.intendedMethod, p_expected: p.expectedBy, p_message: p.message,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) { console.error("pledge failed", error?.message); return json({ ok: false, message: "We couldn't save your pledge. Please try again." }, 500); }
    const { designation } = await lookup(p.designationId, null);
    after(() => notifyGiving(
      { type: "pledge", reference: row.reference, donorName: p.name, donorEmail: p.email, amount: p.amount, frequency: p.frequency,
        method: p.intendedMethod, designation, submittedAt: now, expectedBy: p.expectedBy },
      { table: "pledges", id: row.id, adminPath: `/admin/giving/pledges/${row.id}`, notifyDonor: true },
    ));
    return json({ ok: true, reference: row.reference, message: "Your pledge has been recorded. No payment has been made yet." });
  }

  const isDonation = k === "donation";
  const kindValue = isDonation ? ((v.frequency as string) === "one_time" ? "donation_one_time" : "donation_recurring") : (v.kind as string);
  const { data, error } = await db.rpc("submit_giving", {
    p_kind: kindValue, p_name: v.name, p_email: v.email, p_phone: v.phone, p_amount: v.amount,
    p_frequency: isDonation ? v.frequency : "one_time", p_designation: v.designationId, p_method: v.methodId ?? null,
    p_sent_on: isDonation ? null : v.sentOn, p_donor_reference: isDonation ? null : v.donorReference, p_message: v.message,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) { console.error("giving submission failed", error?.message); return json({ ok: false, message: "We couldn't save this. Please try again." }, 500); }
  const { designation, method } = await lookup(v.designationId, v.methodId ?? null);
  after(() => notifyGiving(
    { type: kindValue as FinanceNotificationType, reference: row.reference, donorName: v.name, donorEmail: v.email, amount: v.amount,
      frequency: isDonation ? v.frequency : null, method: method?.label ?? null, designation, submittedAt: now },
    { table: "giving_submissions", id: row.id, adminPath: `/admin/giving/submissions/${row.id}`, notifyDonor: Boolean(v.email) },
  ));
  return json({
    ok: true, reference: row.reference,
    message: isDonation
      ? "Thank you. Your giving details were recorded; your gift is confirmed once our finance team receives it."
      : "Thank you. We'll confirm your gift once our finance team has verified it was received.",
  });
}
