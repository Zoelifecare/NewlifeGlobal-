// Giving: notification wording, safety, retry; validation of public giving forms. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { donorEmail, financeEmail, resendTransport, sendWithRetry } from "../../src/lib/notify/core.ts";
import { confirmationSchema, donationIntentSchema, pledgeSchema } from "../../src/lib/validation/giving.ts";

const base = {
  reference: "PL-2611-01001", donorName: "Jane Donor", donorEmail: "jane@example.test", amount: 500, frequency: "monthly",
  method: "Zelle", designation: "Building fund", submittedAt: "2026-11-20T18:00:00Z", adminUrl: "https://example.test/admin/giving/pledges/1",
};

test("finance email carries the required fields and the admin link", () => {
  const m = financeEmail({ ...base, type: "pledge" }, "finance@example.test");
  for (const s of ["New pledge", "PL-2611-01001", "Jane Donor", "jane@example.test", "$500.00", "Zelle", "Monthly", "Building fund", "View in admin", base.adminUrl]) {
    assert.ok(m.text.includes(s), `missing ${s}`);
  }
  assert.match(m.text, /No money has been received yet/);
  assert.equal(m.to, "finance@example.test");
});

test("finance email distinguishes verification-needed from received", () => {
  assert.match(financeEmail({ ...base, type: "zelle_confirmation" }, "f@example.test").text, /Verify that the money was received/);
  assert.match(financeEmail({ ...base, type: "cash_recorded" }, "f@example.test").text, /has been received and recorded/);
});

test("donor wording differs for pledge, submission and received donation", () => {
  const p = donorEmail({ ...base, type: "pledge" }, base.donorEmail);
  const s = donorEmail({ ...base, type: "zelle_confirmation" }, base.donorEmail);
  const i = donorEmail({ ...base, type: "donation_one_time" }, base.donorEmail);
  const r = donorEmail({ ...base, type: "donation_recorded" }, base.donorEmail);
  assert.match(p.text, /no payment has been made yet/i);
  assert.match(s.text, /not a receipt/i);
  assert.match(i.text, /not a receipt/i);
  assert.match(r.text, /has been received and recorded/);
  assert.equal(new Set([p.subject, s.subject, r.subject].map((x) => x.split(" (")[0])).size, 3);
  assert.ok(!p.text.includes("/admin/"), "donor emails never link to the admin");
});

test("emails escape HTML from donor input", () => {
  const m = financeEmail({ ...base, type: "pledge", donorName: "<script>alert(1)</script>" }, "f@example.test");
  assert.ok(!m.html.includes("<script>"));
  assert.ok(m.html.includes("&lt;script&gt;"));
});

test("emails contain no card or bank number fields", () => {
  const m = financeEmail({ ...base, type: "bank_transfer_confirmation" }, "f@example.test");
  assert.doesNotMatch(m.text, /routing|account number|card number|password|cvv/i);
});

test("retry: transient failures are retried, then succeed", async () => {
  let calls = 0;
  const t = async () => (++calls < 3 ? { ok: false, error: "503 Service Unavailable" } : { ok: true, providerId: "abc" });
  const r = await sendWithRetry(t, { to: "a@example.test", subject: "s", text: "t", html: "h" }, { sleep: async () => {} });
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 3);
  assert.equal(r.providerId, "abc");
});

test("retry: permanent errors are not retried and are reported", async () => {
  let calls = 0;
  const t = async () => { calls++; return { ok: false, error: "422 Invalid `to` field" }; };
  const r = await sendWithRetry(t, { to: "bad", subject: "s", text: "t", html: "h" }, { sleep: async () => {} });
  assert.equal(r.ok, false);
  assert.equal(calls, 1);
  assert.match(r.error, /422/);
});

test("retry: gives up after the attempt limit", async () => {
  const t = async () => ({ ok: false, error: "network error" });
  const r = await sendWithRetry(t, { to: "a@example.test", subject: "s", text: "t", html: "h" }, { attempts: 3, sleep: async () => {} });
  assert.equal(r.ok, false);
  assert.equal(r.attempts, 3);
});

test("Resend transport sends server-side with the key in the header only", async () => {
  let seen;
  const fake = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ id: "em_1" }), { status: 200 }); };
  const r = await resendTransport("re_test_key", "New Life Global <giving@example.test>", fake)({ to: "a@example.test", subject: "s", text: "t", html: "h" });
  assert.deepEqual(r, { ok: true, providerId: "em_1" });
  assert.equal(seen.url, "https://api.resend.com/emails");
  assert.equal(seen.init.headers.authorization, "Bearer re_test_key");
  assert.ok(!seen.init.body.includes("re_test_key"));
  const thrown = await resendTransport("k", "f", async () => { throw new Error("fetch failed"); })({ to: "a", subject: "s", text: "t", html: "h" });
  assert.equal(thrown.ok, false);
});

test("pledge form: name, email and a positive amount are required", () => {
  assert.equal(pledgeSchema.safeParse({ name: "Jane", email: "jane@example.test", amount: "500" }).success, true);
  assert.equal(pledgeSchema.safeParse({ name: "", email: "jane@example.test", amount: 500 }).success, false);
  assert.equal(pledgeSchema.safeParse({ name: "Jane", email: "nope", amount: 500 }).success, false);
  assert.equal(pledgeSchema.safeParse({ name: "Jane", email: "jane@example.test", amount: 0 }).success, false);
  assert.equal(pledgeSchema.safeParse({ name: "Jane", email: "jane@example.test", amount: 50, frequency: "hourly" }).success, false);
  assert.equal(pledgeSchema.parse({ name: "Jane", email: "jane@example.test", amount: "12.345" }).amount, 12.35);
});

test("giving intention needs an email and a chosen method; confirmations may be anonymous", () => {
  assert.equal(donationIntentSchema.safeParse({ email: "a@example.test", amount: 20 }).success, false);
  assert.equal(donationIntentSchema.safeParse({ email: "a@example.test", amount: 20, methodId: "6f1c8a1e-1d2b-4c3d-8e9f-0a1b2c3d4e5f" }).success, true);
  assert.equal(confirmationSchema.safeParse({ kind: "cash_drop_notice", amount: 40 }).success, true);
  assert.equal(confirmationSchema.safeParse({ kind: "card_payment", amount: 40 }).success, false);
});
