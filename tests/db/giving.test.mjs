// Round 3: pledges, donations, submissions, Cash Drop, finance RLS and reporting buckets.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { as, createDb, makeUser, rejects } from "./harness.mjs";

let db, admin, finance, editor, nobody, cashMethod, zelleMethod;

before(async () => {
  db = await createDb();
  admin = await makeUser(db, "admin@example.test", ["super_admin"]);
  finance = await makeUser(db, "finance@example.test", ["finance_manager"]);
  editor = await makeUser(db, "editor@example.test", ["content_editor"]);
  nobody = await makeUser(db, "visitor@example.test");
  const m = (await db.query("select id, kind from public.payment_methods")).rows;
  cashMethod = m.find((x) => x.kind === "cash_drop").id;
  zelleMethod = m.find((x) => x.kind === "zelle").id;
});

const pledge = (tx, amount = 500) => tx.query(
  "select * from public.submit_pledge('Jane Donor', 'jane@example.test', null, $1, 'one_time', null, 'Zelle', null, 'For the building')", [amount]);
const submit = (tx, kind, amount, method) => tx.query(
  "select * from public.submit_giving($1, 'Sam Giver', 'sam@example.test', null, $2, 'one_time', null, $3, current_date, 'memo 123', null)", [kind, amount, method]);

test("01 Zelle, Cash App, bank transfer and Cash Drop are shown; the online link stays hidden until set", async () => {
  const r = await as(db, "anon", (tx) => tx.query("select kind from public.payment_methods order by kind"));
  assert.deepEqual(r.rows.map((x) => x.kind), ["bank_transfer", "cash_drop", "cashapp", "zelle"]);
  const online = (await db.query("select id from public.payment_methods where kind = 'online_link'")).rows[0].id;
  assert.match(await rejects(as(db, "anon", (tx) => submit(tx, "zelle_confirmation", 10, online))), /invalid payment method/);
});

/* ------------------------------------------------------------ pledges */
test("a visitor can pledge, gets a reference, but cannot read pledges back", async () => {
  const r = await as(db, "anon", (tx) => pledge(tx));
  assert.match(r.rows[0].reference, /^PL-\d{4}-\d{5}$/);
  assert.match(await rejects(as(db, "anon", (tx) => tx.query("select * from public.pledges"))), /permission denied/);
  const n = await as(db, nobody, (tx) => tx.query("select count(*)::int n from public.pledges"));
  assert.equal(n.rows[0].n, 0, "signed-in non-finance users see no pledges");
  const e = await as(db, editor, (tx) => tx.query("select count(*)::int n from public.pledges"));
  assert.equal(e.rows[0].n, 0, "content editors see no pledges");
});

test("the public cannot insert a pledge that claims to be fulfilled", async () => {
  await rejects(as(db, "anon", (tx) => tx.query(
    "insert into public.pledges (donor_name, donor_email, amount, status, fulfilled_amount) values ('X', 'x@example.test', 100, 'fulfilled', 100)")));
});

test("$500 pledge + $200 donation = partially fulfilled, $300 remaining; never counted as revenue", async () => {
  const { rows: [p] } = await as(db, "anon", (tx) => pledge(tx, 500));
  let s = (await as(db, finance, (tx) => tx.query("select public.giving_summary() s"))).rows[0].s;
  const confirmedBefore = Number(s.confirmed_total);

  await as(db, finance, (tx) => tx.query(
    "insert into public.donations (amount, method, pledge_id, recorded_by) values (200, 'zelle', $1, $2)", [p.id, finance]));
  let row = (await db.query("select status, fulfilled_amount, amount from public.pledges where id = $1", [p.id])).rows[0];
  assert.equal(row.status, "partially_fulfilled");
  assert.equal(Number(row.fulfilled_amount), 200);
  assert.equal(Number(row.amount) - Number(row.fulfilled_amount), 300);

  s = (await as(db, finance, (tx) => tx.query("select public.giving_summary() s"))).rows[0].s;
  assert.equal(Number(s.confirmed_total) - confirmedBefore, 200, "only the $200 actually received counts");
  assert.ok(Number(s.pledged_total) >= 500, "pledges are reported in their own bucket");

  await as(db, finance, (tx) => tx.query("insert into public.donations (amount, method, pledge_id) values (300, 'cash', $1)", [p.id]));
  row = (await db.query("select status, fulfilled_amount from public.pledges where id = $1", [p.id])).rows[0];
  assert.equal(row.status, "fulfilled");

  // deleting a donation re-opens the pledge
  await as(db, admin, (tx) => tx.query("delete from public.donations where pledge_id = $1 and amount = 300", [p.id]));
  row = (await db.query("select status, fulfilled_amount from public.pledges where id = $1", [p.id])).rows[0];
  assert.equal(row.status, "partially_fulfilled");
  assert.equal(Number(row.fulfilled_amount), 200);
});

test("overdue unfulfilled pledges can be marked past due", async () => {
  const { rows: [p] } = await as(db, "anon", (tx) => pledge(tx, 50));
  await db.query("update public.pledges set expected_by = current_date - 3 where id = $1", [p.id]);
  await as(db, finance, (tx) => tx.query("select public.mark_past_due_pledges()"));
  assert.equal((await db.query("select status from public.pledges where id = $1", [p.id])).rows[0].status, "past_due");
  await rejects(as(db, editor, (tx) => tx.query("select public.mark_past_due_pledges()")));
});

/* ------------------------------------------------------------ submissions, verification, cash drop */
test("a Zelle confirmation stays pending and is not revenue until finance verifies it", async () => {
  const before = (await as(db, finance, (tx) => tx.query("select public.giving_summary() s"))).rows[0].s;
  const { rows: [g] } = await as(db, "anon", (tx) => submit(tx, "zelle_confirmation", 75, zelleMethod));
  assert.match(g.reference, /^GS-/);
  let s = (await as(db, finance, (tx) => tx.query("select public.giving_summary() s"))).rows[0].s;
  assert.equal(Number(s.confirmed_total), Number(before.confirmed_total), "pending is not received");
  assert.equal(Number(s.pending_count), Number(before.pending_count) + 1);

  // cannot shortcut the verification
  assert.match(await rejects(as(db, finance, (tx) => tx.query("update public.giving_submissions set status = 'verified' where id = $1", [g.id]))), /Verify received/);
  await rejects(as(db, editor, (tx) => tx.query("select public.verify_giving_submission($1, 75, current_date)", [g.id])));

  const d = await as(db, finance, (tx) => tx.query("select public.verify_giving_submission($1, 70, current_date) id", [g.id]));
  const don = (await db.query("select amount, method, source, submission_id from public.donations where id = $1", [d.rows[0].id])).rows[0];
  assert.equal(Number(don.amount), 70, "the amount actually received is recorded");
  assert.equal(don.method, "zelle");
  assert.equal(don.source, "verified_submission");
  s = (await as(db, finance, (tx) => tx.query("select public.giving_summary() s"))).rows[0].s;
  assert.equal(Number(s.confirmed_total) - Number(before.confirmed_total), 70);
  assert.equal(Number(s.pending_count), Number(before.pending_count));
  assert.match(await rejects(as(db, finance, (tx) => tx.query("select public.verify_giving_submission($1, 70, current_date)", [g.id]))), /already been verified/);
});

test("a Cash Drop notice is pending; verified it becomes a cash donation", async () => {
  const { rows: [g] } = await as(db, "anon", (tx) => submit(tx, "cash_drop_notice", 40, cashMethod));
  assert.equal((await db.query("select status from public.giving_submissions where id = $1", [g.id])).rows[0].status, "pending");
  const d = await as(db, finance, (tx) => tx.query("select public.verify_giving_submission($1, 40, current_date) id", [g.id]));
  assert.equal((await db.query("select method from public.donations where id = $1", [d.rows[0].id])).rows[0].method, "cash");
});

test("the public cannot record donations or read finance data", async () => {
  await rejects(as(db, "anon", (tx) => tx.query("insert into public.donations (amount, method) values (10, 'cash')")));
  for (const t of ["donations", "bank_accounts", "finance_notification_settings", "notification_log", "giving_submissions"]) {
    assert.match(await rejects(as(db, "anon", (tx) => tx.query(`select * from public.${t}`))), /permission denied/, t);
    const r = await as(db, editor, (tx) => tx.query(`select count(*)::int n from public.${t}`));
    assert.equal(r.rows[0].n, 0, `content editor must not see ${t}`);
  }
  await rejects(as(db, "anon", (tx) => tx.query("select public.giving_summary()")));
  await rejects(as(db, editor, (tx) => tx.query("select public.giving_summary()")));
});

test("only a super admin changes notification recipients; finance can read them", async () => {
  await rejects(as(db, finance, async (tx) => {
    const r = await tx.query("update public.finance_notification_settings set recipients = array['x@example.test'] where id = 1");
    if (!r.affectedRows) throw new Error("not updated");
  }));
  await as(db, admin, (tx) => tx.query("update public.finance_notification_settings set recipients = array['finance@example.test'] where id = 1"));
  const r = await as(db, finance, (tx) => tx.query("select recipients from public.finance_notification_settings"));
  assert.deepEqual(r.rows[0].recipients, ["finance@example.test"]);
});

test("finance changes are audited with old and new values", async () => {
  const { rows: [p] } = await as(db, "anon", (tx) => pledge(tx, 120));
  await as(db, finance, (tx) => tx.query("update public.pledges set status = 'acknowledged' where id = $1", [p.id]));
  const a = (await db.query("select actor_id, old_values->>'status' o, new_values->>'status' n from public.audit_logs where table_name = 'pledges' and record_id = $1 and action = 'update' order by id desc limit 1", [p.id])).rows[0];
  assert.equal(a.o, "new");
  assert.equal(a.n, "acknowledged");
  assert.equal(a.actor_id, finance);
});

test("dashboard counts expose finance numbers only to finance staff", async () => {
  const f = (await as(db, finance, (tx) => tx.query("select public.dashboard_counts() c"))).rows[0].c;
  assert.equal(typeof f.giving_pending, "number");
  const e = (await as(db, editor, (tx) => tx.query("select public.dashboard_counts() c"))).rows[0].c;
  assert.equal(e.giving_pending, null);
  assert.equal(e.pledges_new, null);
});
