import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { okDate } from "@/lib/admin/finance-loaders";
import { DONATION_METHODS, FREQ_LABEL, METHOD_LABEL, PLEDGE_STATUSES, PLEDGE_STATUS_LABEL, SOURCE_LABEL, SUBMISSION_KIND_LABEL } from "@/lib/admin/finance-constants";

/**
 * CSV exports for finance. One file per bucket (confirmed donations, pledges, submissions) so
 * pledged, pending and received money are never combined in a single figure.
 */
export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff?.canManageFinance) return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const from = okDate(sp.get("from") ?? undefined), to = okDate(sp.get("to") ?? undefined);
  const supabase = await createSupabaseServerClient();
  let header: string[] = [], rows: unknown[][] = [];

  if (type === "donations") {
    let q = supabase.from("donations").select("*, designation:giving_designations(name), pledge:pledges(reference)").order("received_on").limit(20000);
    if (from) q = q.gte("received_on", from);
    if (to) q = q.lte("received_on", to);
    const m = sp.get("method"); if (m && (DONATION_METHODS as readonly string[]).includes(m)) q = q.eq("method", m);
    const s = sp.get("source"); if (s && s in SOURCE_LABEL) q = q.eq("source", s);
    const { data, error } = await q;
    if (error) return new NextResponse("Error", { status: 500 });
    header = ["reference", "received_on", "amount_usd", "method", "source", "designation", "donor_name", "donor_email", "anonymous", "recurring", "pledge", "receipt_number", "notes"];
    rows = (data ?? []).map((d) => [d.reference, d.received_on, Number(d.amount).toFixed(2), METHOD_LABEL[d.method], SOURCE_LABEL[d.source], d.designation?.name ?? "General giving",
      d.is_anonymous ? "" : d.donor_name, d.is_anonymous ? "" : d.donor_email, d.is_anonymous ? "yes" : "no", d.is_recurring ? "yes" : "no", d.pledge?.reference ?? "", d.receipt_number, d.notes]);
  } else if (type === "pledges") {
    let q = supabase.from("pledges").select("*, designation:giving_designations(name)").order("created_at").limit(20000);
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", `${to}T23:59:59`);
    const st = sp.get("status"); if (st && (PLEDGE_STATUSES as readonly string[]).includes(st)) q = q.eq("status", st);
    const { data, error } = await q;
    if (error) return new NextResponse("Error", { status: 500 });
    header = ["reference", "created_at", "status", "pledged_usd", "fulfilled_usd", "remaining_usd", "frequency", "designation", "donor_name", "donor_email", "donor_phone", "intended_method", "expected_by"];
    rows = (data ?? []).map((p) => [p.reference, p.created_at, PLEDGE_STATUS_LABEL[p.status], Number(p.amount).toFixed(2), Number(p.fulfilled_amount).toFixed(2),
      Math.max(0, Number(p.amount) - Number(p.fulfilled_amount)).toFixed(2), FREQ_LABEL[p.frequency], p.designation?.name ?? "General giving", p.donor_name, p.donor_email, p.donor_phone, p.intended_method, p.expected_by]);
  } else if (type === "submissions") {
    let q = supabase.from("giving_submissions").select("*, designation:giving_designations(name), method:payment_methods(label)").order("created_at").limit(20000);
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", `${to}T23:59:59`);
    const st = sp.get("status"); if (st && ["pending", "verified", "rejected"].includes(st)) q = q.eq("status", st);
    const k = sp.get("kind"); if (k && k in SUBMISSION_KIND_LABEL) q = q.eq("kind", k);
    const { data, error } = await q;
    if (error) return new NextResponse("Error", { status: 500 });
    header = ["reference", "created_at", "status", "type", "amount_claimed_usd", "frequency", "method", "designation", "sent_on", "donor_reference", "donor_name", "donor_email"];
    rows = (data ?? []).map((s) => [s.reference, s.created_at, s.status === "rejected" ? "not received" : s.status, SUBMISSION_KIND_LABEL[s.kind], Number(s.amount).toFixed(2),
      FREQ_LABEL[s.frequency], s.method?.label ?? "", s.designation?.name ?? "General giving", s.sent_on, s.donor_reference, s.donor_name, s.donor_email]);
  } else {
    return new NextResponse("Unknown export", { status: 400 });
  }

  // neutralise spreadsheet formula injection
  const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const csv = [header.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
  return new NextResponse(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
