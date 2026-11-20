// Row Level Security & database behaviour tests. Run: npm run test:db
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { as, createDb, makeUser, rejects } from "./harness.mjs";

let db, admin, editor, manager, prayerEditor, nobody, worshipId, prayerMinistryId;

before(async () => {
  db = await createDb();
  const { rows } = await db.query("select id, slug from public.ministries");
  worshipId = rows.find((r) => r.slug === "worship").id;
  prayerMinistryId = rows.find((r) => r.slug === "prayer").id;
  admin = await makeUser(db, "admin@example.test", ["super_admin"]);
  editor = await makeUser(db, "editor@example.test", ["content_editor"]);
  manager = await makeUser(db, "manager@example.test", [{ role: "ministry_manager", ministryId: worshipId }]);
  prayerEditor = await makeUser(db, "prayer@example.test", ["content_editor"], { prayerTeam: true });
  nobody = await makeUser(db, "visitor@example.test");
});

/* ------------------------------------------------------------ seed + public reads */
test("seed loaded: settings, homepage, ministries, sermons, events, gallery", async () => {
  const c = async (t) => (await db.query(`select count(*)::int n from public.${t}`)).rows[0].n;
  assert.ok(await c("site_settings") >= 10);
  assert.equal(await c("homepage_sections"), 10);
  assert.equal(await c("ministries"), 5);
  assert.ok(await c("sermons") >= 10);
  assert.equal(await c("events"), 3);
  assert.ok(await c("gallery_items") > 10);
  assert.equal(await c("leadership"), 4);
});

test("anon reads published content but never drafts or scheduled items", async () => {
  await db.query("update public.sermons set status='draft' where slug='the-courage-to-care'");
  await db.query("update public.sermons set status='published', published_at = now() + interval '7 days' where slug='lengthen-and-strengthen'");
  const rows = await as(db, "anon", (tx) => tx.query("select slug from public.sermons"));
  const slugs = rows.rows.map((r) => r.slug);
  assert.ok(slugs.includes("the-development-stages-of-marriage"));
  assert.ok(!slugs.includes("the-courage-to-care"), "draft must be hidden");
  assert.ok(!slugs.includes("lengthen-and-strengthen"), "scheduled must be hidden until its time");
  const staffView = await as(db, editor, (tx) => tx.query("select slug from public.sermons"));
  assert.ok(staffView.rows.some((r) => r.slug === "the-courage-to-care"), "staff can preview drafts");
  await db.query("update public.sermons set status='published', published_at = now() - interval '1 day' where slug in ('the-courage-to-care','lengthen-and-strengthen')");
});

test("hidden homepage sections are not public", async () => {
  const r = await as(db, "anon", (tx) => tx.query("select key from public.homepage_sections"));
  assert.ok(!r.rows.some((x) => x.key === "testimonies"));
  assert.ok(r.rows.some((x) => x.key === "hero"));
});

test("anon cannot write content", async () => {
  await rejects(as(db, "anon", (tx) => tx.query("insert into public.sermons (slug, title, speaker_name) values ('x-x','Hack','x')")));
  // anon has no UPDATE/DELETE privilege at all (stronger than RLS filtering)
  assert.match(await rejects(as(db, "anon", (tx) => tx.query("update public.events set title='Hacked'"))), /permission denied/);
  assert.match(await rejects(as(db, "anon", (tx) => tx.query("delete from public.ministries"))), /permission denied/);
});

/* ------------------------------------------------------------ private submissions */
test("anon can submit a prayer request but never read one back", async () => {
  await as(db, "anon", (tx) => tx.query("insert into public.prayer_requests (name, request, may_contact) values ('A', 'Please pray for my family', false)"));
  const err = await rejects(as(db, "anon", (tx) => tx.query("select * from public.prayer_requests")));
  assert.match(err, /permission denied/);
});

test("anon cannot pre-set status or internal notes on a submission", async () => {
  await rejects(as(db, "anon", (tx) => tx.query("insert into public.prayer_requests (request, status) values ('x x x', 'answered')")));
  await rejects(as(db, "anon", (tx) => tx.query("insert into public.contact_messages (name, email, message, internal_notes) values ('a','a@b.co','hi','sneaky')")));
});

test("prayer requests: content editors cannot read them; super admin and prayer team can", async () => {
  const e = await as(db, editor, (tx) => tx.query("select count(*)::int n from public.prayer_requests"));
  assert.equal(e.rows[0].n, 0, "content editor without prayer-team flag sees nothing");
  const a = await as(db, admin, (tx) => tx.query("select count(*)::int n from public.prayer_requests"));
  assert.ok(a.rows[0].n >= 1);
  const p = await as(db, prayerEditor, (tx) => tx.query("select count(*)::int n from public.prayer_requests"));
  assert.ok(p.rows[0].n >= 1);
  const m = await as(db, manager, (tx) => tx.query("select count(*)::int n from public.prayer_requests"));
  assert.equal(m.rows[0].n, 0);
});

test("only super admin may delete prayer requests", async () => {
  const del = await as(db, prayerEditor, (tx) => tx.query("delete from public.prayer_requests returning id"));
  assert.equal(del.rows.length, 0);
});

test("contact messages: editors read and update; ministry managers and signed-in non-staff cannot", async () => {
  await as(db, "anon", (tx) => tx.query("insert into public.contact_messages (kind, name, email, message) values ('visit','Sam','sam@example.com','Coming Sunday')"));
  const e = await as(db, editor, (tx) => tx.query("update public.contact_messages set status='read' returning id"));
  assert.ok(e.rows.length >= 1);
  const m = await as(db, manager, (tx) => tx.query("select count(*)::int n from public.contact_messages"));
  assert.equal(m.rows[0].n, 0);
  const n = await as(db, nobody, (tx) => tx.query("select count(*)::int n from public.contact_messages"));
  assert.equal(n.rows[0].n, 0);
});

test("newsletter: duplicate email (any case) rejected by unique index", async () => {
  await as(db, "anon", (tx) => tx.query("insert into public.newsletter_subscribers (email) values ('Friend@Example.com')"));
  const err = await rejects(as(db, "anon", (tx) => tx.query("insert into public.newsletter_subscribers (email) values ('friend@example.com')")));
  assert.match(err, /duplicate|unique/);
});

/* ------------------------------------------------------------ roles */
test("ministry manager edits only their own ministry, and cannot publish/unpublish it", async () => {
  const own = await as(db, manager, (tx) => tx.query("update public.ministries set summary='Updated by manager' where id=$1 returning id", [worshipId]));
  assert.equal(own.rows.length, 1);
  const other = await as(db, manager, (tx) => tx.query("update public.ministries set summary='nope' where id=$1 returning id", [prayerMinistryId]));
  assert.equal(other.rows.length, 0);
  const err = await rejects(as(db, manager, (tx) => tx.query("update public.ministries set status='draft' where id=$1", [worshipId])));
  assert.match(err, /cannot change/i);
  await rejects(as(db, manager, (tx) => tx.query("insert into public.ministries (slug, name) values ('new-one','New')")));
});

test("ministry manager may add gallery items only for their ministry", async () => {
  const { rows } = await db.query("select id from public.media_assets limit 1");
  const ok = await as(db, manager, (tx) => tx.query("insert into public.gallery_items (media_id, ministry_id) values ($1, $2) returning id", [rows[0].id, worshipId]));
  assert.equal(ok.rows.length, 1);
  await rejects(as(db, manager, (tx) => tx.query("insert into public.gallery_items (media_id, ministry_id) values ($1, $2)", [rows[0].id, prayerMinistryId])));
  await rejects(as(db, manager, (tx) => tx.query("insert into public.gallery_items (media_id) values ($1)", [rows[0].id])));
});

test("signed-in users without a role have no staff powers", async () => {
  const r = await as(db, nobody, (tx) => tx.query("update public.sermons set title='x' returning id"));
  assert.equal(r.rows.length, 0);
  const drafts = await as(db, nobody, (tx) => tx.query("select count(*)::int n from public.sermons where status='draft'"));
  assert.equal(drafts.rows[0].n, 0);
  await rejects(as(db, nobody, (tx) => tx.query("insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [nobody])));
});

test("only super admins manage roles; content editors cannot escalate", async () => {
  await rejects(as(db, editor, (tx) => tx.query("insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [editor])));
  const ok = await as(db, admin, (tx) => tx.query("insert into public.user_roles (user_id, role) values ($1, 'content_editor') returning id", [nobody]));
  assert.equal(ok.rows.length, 1);
  await db.query("delete from public.user_roles where user_id=$1", [nobody]);
});

test("role scope constraint: ministry manager needs a ministry; others must not have one", async () => {
  await rejects(db.query("insert into public.user_roles (user_id, role) values ($1, 'ministry_manager')", [nobody]));
  await rejects(db.query("insert into public.user_roles (user_id, role, ministry_id) values ($1, 'content_editor', $2)", [nobody, worshipId]));
});

test("the last super admin cannot be removed", async () => {
  const err = await rejects(as(db, admin, (tx) => tx.query("delete from public.user_roles where user_id=$1 and role='super_admin'", [admin])));
  assert.match(err, /last super admin/);
});

test("only a super admin can grant prayer-team access (even to themselves)", async () => {
  const err = await rejects(as(db, editor, (tx) => tx.query("update public.profiles set is_prayer_team = true where id=$1", [editor])));
  assert.match(err, /super admin/);
  const ok = await as(db, admin, (tx) => tx.query("update public.profiles set is_prayer_team = true where id=$1 returning id", [editor]));
  assert.equal(ok.rows.length, 1);
  await db.query("update public.profiles set is_prayer_team=false where id=$1", [editor]);
});

/* ------------------------------------------------------------ audit log */
test("admin changes are audited with actor; private text is never copied", async () => {
  await as(db, editor, (tx) => tx.query("update public.events set summary='Audit me' where slug='first-anniversary-2026'"));
  await as(db, admin, (tx) => tx.query("update public.prayer_requests set internal_notes='called them', status='praying'"));
  const log = await db.query("select actor_id, table_name, action, summary, changed from public.audit_logs order by id");
  const ev = log.rows.find((r) => r.table_name === "events" && r.actor_id === editor);
  assert.ok(ev, "event update audited");
  assert.deepEqual(ev.changed, ["summary"]);
  const pr = log.rows.find((r) => r.table_name === "prayer_requests");
  assert.ok(pr);
  assert.equal(pr.summary, null, "no prayer text in the log");
  assert.ok(!JSON.stringify(log.rows).includes("Please pray for my family"));
  // anon submissions are not "admin activity"
  assert.ok(!log.rows.some((r) => r.table_name === "prayer_requests" && r.action === "insert"));
});

test("audit log is readable only by super admins and cannot be tampered with", async () => {
  const e = await as(db, editor, (tx) => tx.query("select count(*)::int n from public.audit_logs"));
  assert.equal(e.rows[0].n, 0);
  const a = await as(db, admin, (tx) => tx.query("select count(*)::int n from public.audit_logs"));
  assert.ok(a.rows[0].n > 0);
  await rejects(as(db, admin, (tx) => tx.query("delete from public.audit_logs")));
  await rejects(as(db, admin, (tx) => tx.query("insert into public.audit_logs (action, table_name) values ('x','y')")));
});

/* ------------------------------------------------------------ functions */
test("rate limiter allows max hits per window then blocks", async () => {
  const hits = [];
  for (let i = 0; i < 4; i++) {
    const r = await as(db, "anon", (tx) => tx.query("select public.check_rate_limit('test:ip1', 3, 600) ok"));
    hits.push(r.rows[0].ok);
  }
  assert.deepEqual(hits, [true, true, true, false]);
  await rejects(as(db, "anon", (tx) => tx.query("select * from public.rate_limits")));
});

test("dashboard counts: staff only, prayer count hidden from non-prayer staff", async () => {
  await rejects(as(db, "anon", (tx) => tx.query("select public.dashboard_counts()")));
  const e = await as(db, editor, (tx) => tx.query("select public.dashboard_counts() c"));
  assert.equal(e.rows[0].c.prayer_pending, null);
  assert.ok(e.rows[0].c.sermons_published > 0);
  const a = await as(db, admin, (tx) => tx.query("select public.dashboard_counts() c"));
  assert.notEqual(a.rows[0].c.prayer_pending, null);
});

test("publishing without a date stamps published_at automatically", async () => {
  const r = await as(db, editor, (tx) => tx.query("insert into public.announcements (title, status) values ('Hello', 'published') returning published_at"));
  assert.ok(r.rows[0].published_at);
});

test("constraints: event end before start and bad slugs are rejected", async () => {
  await rejects(as(db, editor, (tx) => tx.query("insert into public.events (slug, title, starts_at, ends_at) values ('bad-ev','Bad', now(), now() - interval '1 hour')")));
  await rejects(as(db, editor, (tx) => tx.query("insert into public.sermons (slug, title, speaker_name) values ('Bad Slug!','T','x')")));
});

test("storage policies: anon cannot upload; staff can upload into the media bucket", async () => {
  await rejects(as(db, "anon", (tx) => tx.query("insert into storage.objects (bucket_id, name) values ('media','x.jpg')")));
  const ok = await as(db, manager, (tx) => tx.query("insert into storage.objects (bucket_id, name, owner) values ('media','uploads/a/b.jpg',$1) returning id", [manager]));
  assert.equal(ok.rows.length, 1);
  await rejects(as(db, nobody, (tx) => tx.query("insert into storage.objects (bucket_id, name) values ('media','y.jpg')")));
});
