import test from "node:test";
import assert from "node:assert/strict";
import { websiteMessageEmail } from "../../src/lib/notify/core.ts";

const at = "2026-11-25T18:00:00.000Z";
const link = "https://app.newlifeglobalaz.org/admin/messages";

test("contact alert: includes what the visitor typed and replies go to the visitor", () => {
  const m = websiteMessageEmail("contact", { name: "Grace", email: "grace@example.com", subject: "Sunday", message: "What time is service?" }, "support@newlifeglobalaz.org", link, at);
  assert.equal(m.to, "support@newlifeglobalaz.org");
  assert.equal(m.replyTo, "grace@example.com");
  assert.match(m.subject, /Sunday/);
  assert.match(m.text, /What time is service\?/);
  assert.match(m.html, /Open in the admin/);
});

test("contact alert: escapes HTML typed by visitors", () => {
  const m = websiteMessageEmail("contact", { name: "<b>x</b>", email: "a@b.co", message: "<script>alert(1)</script>" }, "s@x.org", link, at);
  assert.ok(!m.html.includes("<script>alert(1)</script>"));
  assert.ok(m.html.includes("&lt;script&gt;"));
});

test("prayer alert: never includes the request or the person's details", () => {
  const m = websiteMessageEmail("prayer", { name: "Private Name", email: "p@x.org", request: "Very private request" }, "s@x.org", "https://app/admin/prayer", at);
  for (const secret of ["Private Name", "p@x.org", "Very private request"]) {
    assert.ok(!m.text.includes(secret) && !m.html.includes(secret) && !m.subject.includes(secret), secret);
  }
  assert.equal(m.replyTo, undefined);
});

test("visit alert: shows the planned date and party size", () => {
  const m = websiteMessageEmail("visit", { name: "Sam", email: "sam@example.com", visitDate: "2026-12-06", partySize: 3, message: "Planning a visit" }, "s@x.org", link, at);
  assert.match(m.subject, /Plan a visit: Sam/);
  assert.match(m.text, /2026-12-06/);
  assert.match(m.text, /Number of people: 3/);
});
