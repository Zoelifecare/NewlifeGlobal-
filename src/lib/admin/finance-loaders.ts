import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { money } from "./finance-constants";

/** Options for finance forms: designations and pledges that can still receive gifts. */
export async function loadFinanceOptions() {
  const supabase = await createSupabaseServerClient();
  const [d, p] = await Promise.all([
    supabase.from("giving_designations").select("id, name").order("sort_order"),
    supabase.from("pledges").select("id, reference, donor_name, amount, fulfilled_amount").not("status", "in", "(cancelled,fulfilled)").order("created_at", { ascending: false }).limit(500),
  ]);
  return {
    designations: (d.data ?? []) as { id: string; name: string }[],
    pledges: ((p.data ?? []) as { id: string; reference: string; donor_name: string; amount: number; fulfilled_amount: number }[])
      .map((x) => ({ id: x.id, name: `${x.reference} · ${x.donor_name} · ${money(Number(x.amount) - Number(x.fulfilled_amount))} remaining` })),
  };
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const okDate = (v?: string) => (v && DATE_RE.test(v) ? v : undefined);
