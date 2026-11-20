// Validation rules for public forms (shared by client and server). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { antiSpam, contactSchema, newsletterSchema, prayerSchema, visitSchema } from "../../src/lib/validation/forms.ts";

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

test("anti-spam: honeypot must be empty and a start time present", () => {
  assert.equal(antiSpam.safeParse({ website: "", startedAt: Date.now() }).success, true);
  assert.equal(antiSpam.safeParse({ website: "http://spam", startedAt: Date.now() }).success, false);
  assert.equal(antiSpam.safeParse({}).success, false);
});
