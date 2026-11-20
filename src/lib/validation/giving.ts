import { z } from "zod";

export const FREQUENCIES = ["one_time", "weekly", "monthly", "quarterly", "annually"] as const;
export const CONFIRMATION_KINDS = ["zelle_confirmation", "cashapp_confirmation", "bank_transfer_confirmation", "cash_drop_notice"] as const;

const amount = z.coerce.number({ message: "Enter an amount" })
  .refine((n) => Number.isFinite(n), "Enter an amount")
  .refine((n) => n >= 1, "The minimum is $1")
  .refine((n) => n <= 1_000_000, "Please contact us for gifts over $1,000,000")
  .transform((n) => Math.round(n * 100) / 100);
const uuidOrNull = z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : null));
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const dateOrNull = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").optional().or(z.literal("")).transform((v) => (v ? v : null));

export const pledgeSchema = z.object({
  name: z.string().trim().min(1, "Please enter your full name").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address"),
  phone: optText(40),
  amount,
  frequency: z.enum(FREQUENCIES).default("one_time"),
  designationId: uuidOrNull,
  intendedMethod: optText(60),
  expectedBy: dateOrNull,
  message: optText(2000),
});

export const donationIntentSchema = z.object({
  name: optText(120),
  email: z.string().trim().max(254).email("Enter a valid email address"),
  phone: optText(40),
  amount,
  frequency: z.enum(FREQUENCIES).default("one_time"),
  designationId: uuidOrNull,
  methodId: z.string().uuid("Choose how you will give"),
  message: optText(2000),
});

export const confirmationSchema = z.object({
  kind: z.enum(CONFIRMATION_KINDS),
  name: optText(120),
  email: z.string().trim().max(254).email("Enter a valid email address").optional().or(z.literal("")).transform((v) => (v ? v : null)),
  phone: optText(40),
  amount,
  designationId: uuidOrNull,
  methodId: uuidOrNull,
  sentOn: dateOrNull,
  donorReference: optText(120),
  message: optText(2000),
});

export const GIVING_FORMS = { pledge: pledgeSchema, donation: donationIntentSchema, confirmation: confirmationSchema } as const;
export type GivingFormKind = keyof typeof GIVING_FORMS;
