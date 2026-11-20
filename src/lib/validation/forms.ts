import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const optionalEmail = z.string().trim().max(254).email("Enter a valid email address").optional().or(z.literal("")).transform((v) => (v ? v : undefined));

/** Common anti-spam fields: honeypot `website` must stay empty; `startedAt` = when the form rendered (ms). */
export const antiSpam = z.object({
  website: z.string().max(0, "Spam detected").optional().default(""),
  startedAt: z.coerce.number().int().positive(),
});

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
