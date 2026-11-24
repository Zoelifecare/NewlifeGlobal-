// Validation rules for public forms (shared by client and server). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { antiSpam, filledTooFast, contactSchema, newsletterSchema, prayerSchema, visitSchema } from "../../src/lib/validation/forms.ts";

test("prayer: name and email optional, request required", () => {
  assert.equal(prayerSchema.safeParse({ request: "Please pray for my mother" }).success, true);
  assert.equal(prayerSchema.safeParse({ request: "" }).success, false);
  assert.equal(prayerSchema.safeParse({ request: "x".repeat(4001) }).success, false);
});

test("prayer: permission to contact requires an email", () => {
  const r = prayerSchema.safeParse({ request: "Pray for me", mayContact: true });
  assert.equal(r.success, false);
  assert.equal(r.error.issues[0].path[0], "email");
  assert.equal(prayerSchema.safeParse({ request: "Pray for me", mayContact: true, email: "a@b.co" }).success, true);
});

test("contact: requires name, valid email and message", () => {
  assert.equal(contactSchema.safeParse({ name: "Ana", email: "ana@example.com", message: "Hello" }).success, true);
  assert.equal(contactSchema.safeParse({ name: "Ana", email: "not-an-email", message: "Hello" }).success, false);
  assert.equal(contactSchema.safeParse({ name: "", email: "ana@example.com", message: "Hello" }).success, false);
});

test("visit: optional date/party size are validated", () => {
  assert.equal(visitSchema.safeParse({ name: "Sam", email: "s@x.co", visitDate: "2026-12-13", partySize: "3" }).success, true);
  assert.equal(visitSchema.safeParse({ name: "Sam", email: "s@x.co", visitDate: "13/12/2026" }).success, false);
  const r = visitSchema.parse({ name: "Sam", email: "s@x.co", partySize: "500" });
  assert.equal(r.partySize, undefined, "out-of-range party size is dropped");
});

test("newsletter: email required", () => {
  assert.equal(newsletterSchema.safeParse({ email: "a@b.co" }).success, true);
  assert.equal(newsletterSchema.safeParse({ email: "" }).success, false);
});

test("anti-spam: fill time is measured on the visitor's device, so clock differences don't matter", () => {
  assert.equal(antiSpam.safeParse({ website: "", fillMs: 9000 }).success, true);
  assert.equal(filledTooFast({ fillMs: 900 }, 2500), true);
  assert.equal(filledTooFast({ fillMs: 9000 }, 2500), false);
  // visitor clock 60s ahead of the server: the old startedAt field must not silently drop the message
  assert.equal(filledTooFast({ startedAt: Date.now() + 60_000 }, 2500), false);
  assert.equal(filledTooFast({ startedAt: Date.now() - 500 }, 2500), true);
});

test("anti-spam: honeypot must be empty and a start time present", () => {
  assert.equal(antiSpam.safeParse({ website: "", startedAt: Date.now() }).success, true);
  assert.equal(antiSpam.safeParse({ website: "http://spam", startedAt: Date.now() }).success, false);
  assert.equal(antiSpam.safeParse({}).success, false);
});
