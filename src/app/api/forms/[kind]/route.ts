import { NextResponse, type NextRequest } from "next/server";
import { FORM_SCHEMAS, antiSpam, type FormKind, type FormResult } from "@/lib/validation/forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { MIN_FILL_MS, allowRequest, clientKey } from "@/lib/security/rate-limit";

const LIMITS: Record<FormKind, [number, number]> = {
  prayer: [5, 600], contact: [5, 600], visit: [5, 600], newsletter: [5, 3600],
};

const SUCCESS: Record<FormKind, string> = {
  prayer: "Thank you. Your request has been received privately, and our prayer team will be praying for you.",
  contact: "Thank you for reaching out. A member of our team will get back to you soon.",
  visit: "We can't wait to meet you! Someone from our team will follow up before your visit.",
  newsletter: "You're subscribed. Thank you!",
};

const json = (body: FormResult, status = 200) => NextResponse.json(body, { status });

export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!(kind in FORM_SCHEMAS)) return json({ ok: false, message: "Unknown form." }, 404);
  const k = kind as FormKind;

  // same-origin check (defence against cross-site form posts)
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ ok: false, message: "Invalid origin." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const spam = antiSpam.safeParse(body);
  if (!spam.success || Date.now() - spam.data.startedAt < MIN_FILL_MS) {
    // Respond like a success so bots learn nothing; nothing is stored.
    return json({ ok: true, message: SUCCESS[k] });
  }

  const parsed = FORM_SCHEMAS[k].safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return json({ ok: false, message: "Please check the highlighted fields.", fieldErrors }, 422);
  }

  if (!isSupabaseConfigured) {
    return json({ ok: false, message: "The website database is not connected yet, so this form cannot be saved. Please try again later." }, 503);
  }

  const db = createSupabaseAnonClient();
  try {
    const [max, windowS] = LIMITS[k];
    if (!(await allowRequest(db, clientKey(req.headers, k), max, windowS))) {
      return json({ ok: false, message: "Too many submissions. Please wait a few minutes and try again." }, 429);
    }
  } catch (e) {
    console.error(e);
    return json({ ok: false, message: "Something went wrong. Please try again." }, 500);
  }

  const v = parsed.data as Record<string, unknown>;
  let error: { message: string; code?: string } | null = null;
  // inserts use the anon key: RLS allows INSERT only (no read-back), so we never call .select()
  if (k === "prayer") {
    ({ error } = await db.from("prayer_requests").insert({ name: v.name ?? null, email: v.email ?? null, request: v.request, may_contact: v.mayContact }));
  } else if (k === "contact") {
    ({ error } = await db.from("contact_messages").insert({ kind: "contact", name: v.name, email: v.email, phone: v.phone ?? null, subject: v.subject ?? null, message: v.message }));
  } else if (k === "visit") {
    ({ error } = await db.from("contact_messages").insert({ kind: "visit", name: v.name, email: v.email, phone: v.phone ?? null, subject: "Plan a visit", message: v.message, visit_date: v.visitDate ?? null, party_size: v.partySize ?? null }));
  } else {
    ({ error } = await db.from("newsletter_subscribers").insert({ email: String(v.email).toLowerCase(), name: v.name ?? null }));
    if (error?.code === "23505") error = null; // already subscribed — treat as success without revealing it
  }

  if (error) {
    console.error(`form ${k} insert failed`, error.message);
    return json({ ok: false, message: "Something went wrong saving your submission. Please try again." }, 500);
  }
  return json({ ok: true, message: SUCCESS[k] });
}
