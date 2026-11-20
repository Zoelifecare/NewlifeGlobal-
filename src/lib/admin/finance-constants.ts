/** Labels and option lists shared by finance pages, forms and actions. */

export const PLEDGE_STATUSES = ["new", "acknowledged", "partially_fulfilled", "fulfilled", "cancelled", "past_due"] as const;
export const PLEDGE_STATUS_LABEL: Record<string, string> = {
  new: "New", acknowledged: "Acknowledged", partially_fulfilled: "Partially fulfilled", fulfilled: "Fulfilled", cancelled: "Cancelled", past_due: "Past due",
};

export const DONATION_METHODS = ["cash", "check", "zelle", "cashapp", "bank_transfer", "online", "other"] as const;
export const METHOD_LABEL: Record<string, string> = {
  cash: "Cash", check: "Check", zelle: "Zelle", cashapp: "Cash App", bank_transfer: "Bank transfer", online: "Online", other: "Other",
};
export const SOURCE_LABEL: Record<string, string> = {
  manual_entry: "Entered by finance", cash_drop: "Cash Drop", verified_submission: "Verified donor confirmation", online_provider: "Online provider",
};

export const PAYMENT_KINDS = ["online_link", "zelle", "cashapp", "bank_transfer", "cash_drop", "check", "other"] as const;
export const KIND_LABEL: Record<string, string> = {
  online_link: "Online giving link", zelle: "Zelle", cashapp: "Cash App", bank_transfer: "Bank transfer", cash_drop: "Cash Drop", check: "Check", other: "Other",
};

export const SUBMISSION_KIND_LABEL: Record<string, string> = {
  donation_one_time: "One-time giving intention", donation_recurring: "Recurring giving intention", zelle_confirmation: "Zelle confirmation",
  cashapp_confirmation: "Cash App confirmation", bank_transfer_confirmation: "Bank transfer confirmation", cash_drop_notice: "Cash Drop notice",
};

export const FREQ_LABEL: Record<string, string> = { one_time: "One time", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annually: "Yearly" };

export const NOTIFY_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "pledge", label: "New pledges", hint: "Commitments to give; not money received." },
  { value: "donation_one_time", label: "One-time giving intentions", hint: "Donor chose an online method and continued to the provider." },
  { value: "donation_recurring", label: "Recurring giving intentions", hint: "" },
  { value: "zelle_confirmation", label: "Zelle confirmations", hint: "Donor says they sent money; verify before confirming." },
  { value: "cashapp_confirmation", label: "Cash App confirmations", hint: "" },
  { value: "bank_transfer_confirmation", label: "Bank transfer confirmations", hint: "" },
  { value: "cash_drop_notice", label: "Cash Drop notices", hint: "Donor says they dropped cash; finance counts it." },
  { value: "online_payment", label: "Verified online payments", hint: "Only once an online provider is connected." },
  { value: "cash_recorded", label: "Cash recorded by finance", hint: "" },
  { value: "donation_recorded", label: "Other donations recorded by finance", hint: "" },
  { value: "donor_confirmations", label: "Send confirmation emails to donors", hint: "Pledge, submission and received wording are different." },
];

export const money = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
