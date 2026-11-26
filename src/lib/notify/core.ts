/**
 * Pure notification logic (no server-only imports) so it can be unit-tested:
 * message building, a provider transport and retry with backoff.
 * Messages never include bank details, card data or passwords: only what the donor typed
 * about themselves, the amount, method, designation, date and reference.
 */

export type FinanceNotificationType =
  | "pledge" | "donation_one_time" | "donation_recurring" | "zelle_confirmation" | "cashapp_confirmation"
  | "bank_transfer_confirmation" | "cash_drop_notice" | "online_payment" | "cash_recorded" | "donation_recorded";

export const FINANCE_TYPE_LABEL: Record<FinanceNotificationType, string> = {
  pledge: "New pledge",
  donation_one_time: "One-time donation intention",
  donation_recurring: "Recurring donation intention",
  zelle_confirmation: "Zelle payment confirmation (to verify)",
  cashapp_confirmation: "Cash App payment confirmation (to verify)",
  bank_transfer_confirmation: "Bank transfer confirmation (to verify)",
  cash_drop_notice: "Cash Drop notification (to verify)",
  online_payment: "Online payment verified",
  cash_recorded: "Cash donation recorded",
  donation_recorded: "Donation received and recorded",
};

export interface GivingRecord {
  type: FinanceNotificationType;
  reference: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  frequency?: string | null;
  method?: string | null;
  designation?: string | null;
  submittedAt: string; // ISO
  adminUrl: string;
  expectedBy?: string | null;
}

/** Types that describe money actually received (confirmed donations). */
export const RECEIVED: FinanceNotificationType[] = ["online_payment", "cash_recorded", "donation_recorded"];

export interface EmailMessage { to: string; subject: string; text: string; html: string; replyTo?: string }

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Phoenix", dateStyle: "medium", timeStyle: "short" });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const FREQ: Record<string, string> = { one_time: "One time", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annually: "Annually" };

function layout(title: string, rows: [string, string][], intro: string, footer: string, cta?: { label: string; url: string }) {
  const text = [intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", cta ? `${cta.label}: ${cta.url}` : "", footer].filter((l) => l !== undefined).join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f8fa;font-family:Helvetica,Arial,sans-serif;color:#0b2624">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e6ea">
<tr><td style="background:#0b2624;color:#ffffff;padding:20px 28px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:700">New Life Global</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:600">${esc(title)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4c515a">${esc(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e6ea">
${rows.map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e6ea;font-size:13px;color:#5c636e;width:40%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e2e6ea;font-size:14px">${esc(v)}</td></tr>`).join("")}
</table>
${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#003f82;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${esc(cta.label)}</a></p>` : ""}
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#5c636e">${esc(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}

/** Email to the finance administrator(s). */
export function financeEmail(r: GivingRecord, to: string): EmailMessage {
  const label = FINANCE_TYPE_LABEL[r.type];
  const rows: [string, string][] = [
    ["Notification", label],
    ["Reference", r.reference],
    ["Donor", r.donorName || "Not provided"],
    ["Donor email", r.donorEmail || "Not provided"],
    ["Amount", money(r.amount)],
    ["Payment method / pledge type", [r.method, r.frequency ? FREQ[r.frequency] ?? r.frequency : null].filter(Boolean).join(" · ") || "Not specified"],
    ["Giving designation", r.designation || "General giving"],
    ["Submitted", when(r.submittedAt)],
  ];
  if (r.expectedBy) rows.push(["Expected by", r.expectedBy]);
  const status = r.type === "pledge" ? "This is a pledge: a commitment to give. No money has been received yet."
    : RECEIVED.includes(r.type) ? "This money has been received and recorded as a confirmed donation."
    : "This is a submission from the donor. Verify that the money was received before confirming it.";
  const { text, html } = layout(label, rows, status, "Automatic notification from the New Life Global website. Sensitive financial details are never included in email.", { label: "View in admin", url: r.adminUrl });
  return { to, subject: `[New Life Global] ${label} · ${money(r.amount)} · ${r.reference}`, text, html };
}

/** Confirmation to the donor; wording distinguishes pledge, submission and received donation. */
export function donorEmail(r: GivingRecord, to: string): EmailMessage {
  const name = r.donorName?.split(" ")[0] || "friend";
  let subject: string, title: string, intro: string;
  if (r.type === "pledge") {
    subject = `Your pledge to New Life Global (${r.reference})`;
    title = "Thank you for your pledge";
    intro = `Dear ${name}, thank you for your pledge. Your pledge has been recorded, but no payment has been made yet. When you give toward it, our finance team will record it against this pledge.`;
  } else if (RECEIVED.includes(r.type)) {
    subject = `Your gift to New Life Global was received (${r.reference})`;
    title = "Your gift was received";
    intro = `Dear ${name}, thank you. Your gift has been received and recorded by our finance team.`;
  } else if (r.type === "donation_one_time" || r.type === "donation_recurring") {
    subject = `We received your giving details (${r.reference})`;
    title = "Thank you for choosing to give";
    intro = `Dear ${name}, we have recorded your intention to give. This is not a receipt: your gift is confirmed only after our finance team has received it.`;
  } else {
    subject = `We received your payment confirmation (${r.reference})`;
    title = "Thank you, we will verify your gift";
    intro = `Dear ${name}, thank you for letting us know about your gift. Our finance team will confirm it once the payment has been received. This message is not a receipt.`;
  }
  const rows: [string, string][] = [
    ["Reference", r.reference],
    ["Amount", money(r.amount)],
    ["Type", r.type === "pledge" ? `Pledge (${FREQ[r.frequency ?? "one_time"] ?? "One time"})` : r.method || "Gift"],
    ["Designation", r.designation || "General giving"],
    ["Date", when(r.submittedAt)],
  ];
  const { text, html } = layout(title, rows, intro, "If you did not submit this, please reply to let us know. New Life Global, Chandler, Arizona.");
  return { to, subject, text, html };
}

// ------------------------------------------------------------------ website message alerts

export type WebsiteMessageKind = "contact" | "visit" | "prayer";

/**
 * Alert to the church office that a website form was submitted. Contact and visit alerts include what the
 * visitor typed (so staff can reply straight from their inbox; Reply goes to the visitor). Prayer alerts
 * never include the request or the person's details: those stay confidential in the admin.
 */
export function websiteMessageEmail(kind: WebsiteMessageKind, v: Record<string, unknown>, to: string, adminLink: string, at: string): EmailMessage {
  const str = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : null);
  const footer = "Sent by the New Life Global website. Mark it as replied in the admin so the team knows it is handled.";
  if (kind === "prayer") {
    const { text, html } = layout("New prayer request", [["Received", when(at)]],
      "A new prayer request was sent through the website. It is confidential, so its details are only in the admin.",
      "Sent by the New Life Global website.", { label: "Open prayer requests", url: adminLink });
    return { to, subject: "New prayer request (website)", text, html };
  }
  const name = str(v.name) ?? "Someone";
  const rows: [string, string][] = [["Name", name], ["Email", str(v.email) ?? "—"]];
  if (str(v.phone)) rows.push(["Phone", str(v.phone)!]);
  if (kind === "visit") {
    if (str(v.visitDate)) rows.push(["Planned date", str(v.visitDate)!]);
    if (v.partySize) rows.push(["Number of people", String(v.partySize)]);
  } else if (str(v.subject)) rows.push(["Subject", str(v.subject)!]);
  rows.push(["Message", str(v.message) ?? "—"], ["Received", when(at)]);
  const title = kind === "visit" ? `${name} is planning a visit` : `New message from ${name}`;
  const subject = kind === "visit" ? `Plan a visit: ${name}` : `Website message: ${str(v.subject) ?? name}`;
  const intro = kind === "visit" ? "Someone let us know they are coming. Reply to this email to welcome them." : "A new message was sent through the website contact form. Reply to this email to answer them.";
  const { text, html } = layout(title, rows, intro, footer, { label: "Open in the admin", url: adminLink });
  return { to, subject: subject.slice(0, 150), text, html, replyTo: str(v.email) ?? undefined };
}

export interface SendResult { ok: boolean; providerId?: string; error?: string }
export type Transport = (msg: EmailMessage) => Promise<SendResult>;

/** Resend (https://resend.com) REST transport. Credentials come from server env vars only. */
export function resendTransport(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): Transport {
  return async (msg) => {
    try {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html, ...(msg.replyTo ? { reply_to: msg.replyTo } : {}) }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) return { ok: false, error: `${res.status} ${body.message ?? res.statusText}`.slice(0, 300) };
      return { ok: true, providerId: body.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "network error" };
    }
  };
}

/** Retry transient failures (network / 5xx / 429) with exponential backoff. */
export async function sendWithRetry(transport: Transport, msg: EmailMessage, opts: { attempts?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}) {
  const attempts = opts.attempts ?? 3;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  let last: SendResult = { ok: false, error: "not attempted" };
  for (let i = 1; i <= attempts; i++) {
    last = await transport(msg);
    if (last.ok) return { ...last, attempts: i };
    const transient = !last.error || /network|timeout|fetch|^5\d\d|^429/i.test(last.error);
    if (!transient || i === attempts) return { ...last, attempts: i };
    await sleep((opts.baseDelayMs ?? 400) * 2 ** (i - 1));
  }
  return { ...last, attempts };
}

export const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 254;
