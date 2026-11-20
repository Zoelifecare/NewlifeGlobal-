import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** CSV export of active subscribers (content editors and super admins). */
export async function GET() {
  const staff = await getStaff();
  if (!staff?.canEditContent) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("email, name, created_at").eq("status", "subscribed").order("created_at");
  if (error) return new NextResponse("Error", { status: 500 });
  // neutralise spreadsheet formula injection
  const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const csv = ["email,name,joined", ...(data ?? []).map((r) => [r.email, r.name, r.created_at].map(cell).join(","))].join("\r\n");
  return new NextResponse(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
