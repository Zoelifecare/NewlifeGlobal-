import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const optionalEmail = z.string().trim().max(254).email("Enter a valid email address").optional().or(z.literal("")).transform((v) => (v ? v : undefined));

/**
 * Common anti-spam fields: honeypot `website` must stay empty, plus how long the form took to fill.
 * `fillMs` is measured entirely on the visitor's device, so it does not depend on the visitor's clock
 * matching the server's. `startedAt` (when the form rendered) is the older field, still accepted.
 */
export const antiSpam = z.object({
  website: z.string().max(0, "Spam detected").optional().default(""),
  fillMs: z.coerce.number().int().min(0).optional().catch(undefined),
  startedAt: z.coerce.number().int().positive().optional().catch(undefined),
}).refine((v) => v.fillMs !== undefined || v.startedAt !== undefined, { message: "Missing timing" });

/** True when the form was submitted faster than a person could fill it in. */
export function filledTooFast(v: { fillMs?: number; startedAt?: number }, minMs: number, now = Date.now()) {
  if (v.fillMs !== undefined) return v.fillMs < minMs;
  const elapsed = now - (v.startedAt ?? now);
  // a negative value means the visitor's clock is ahead of ours: don't punish them for it
  return elapsed >= 0 && elapsed < minMs;
}

export const prayerSchema = z.object({
  name: optionalText(120),
  email: optionalEmail,
  request: z.string().trim().min(3, "Please share your prayer request").max(4000, "Please keep it under 4000 characters"),
  mayContact: z.coerce.boolean().default(false),
}).superRefine((v, ctx) => {
  if (v.mayContact && !v.email) ctx.addIssue({ code: "custom", path: ["email"], message: "Add an email so we can contact you" });
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address"),
  phone: optionalText(40),
  subject: optionalText(200),
  message: z.string().trim().min(1, "Please write a message").max(4000),
});

export const visitSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address"),
  phone: optionalText(40),
  visitDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date").optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  partySize: z.coerce.number().int().min(1).max(50).optional().catch(undefined),
  message: z.string().trim().max(4000).optional().transform((v) => v || "Planning a visit"),
});

export const newsletterSchema = z.object({
  email: z.string().trim().max(254).email("Enter a valid email address"),
  name: optionalText(120),
});

export const FORM_SCHEMAS = { prayer: prayerSchema, contact: contactSchema, visit: visitSchema, newsletter: newsletterSchema } as const;
export type FormKind = keyof typeof FORM_SCHEMAS;

export interface FormResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}
