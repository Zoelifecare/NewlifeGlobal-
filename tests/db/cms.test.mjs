// CMS round 2: identity workflow, versions, audit values, sermon rules, ministry events, identity correction.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { as, createDb, makeUser, rejects } from "./harness.mjs";

let db, admin, editor, manager, nobody, worshipId, prayerId, charlesId, enockId;

before(async () => {
  db = await createDb();
  const { rows } = await db.query("select id, slug from public.ministries");
  worshipId = rows.find((r) => r.slug === "worship").id;
  prayerId = rows.find((r) => r.slug === "prayer").id;
  const leaders = (await db.query("select id, slug from public.leadership")).rows;
  charlesId = leaders.find((l) => l.slug === "charles-mugisha").id;
  enockId = leaders.find((l) => l.slug === "enock-rwakatale").id;
  admin = await makeUser(db, "admin@example.test", ["super_admin"]);
  editor = await makeUser(db, "editor@example.test", ["content_editor"]);
  manager = await makeUser(db, "manager@example.test", [{ role: "ministry_manager", ministryId: worshipId }]);
  nobody = await makeUser(db, "visitor@example.test");
});

/* ------------------------------------------------------------ identity content: public read model */
test("public sees only published identity content, never drafts or unconfirmed entries", async () => {
  const pub = await as(db, "anon", (tx) => tx.query("select key from public.published_church_content order by key"));
  const keys = pub.rows.map((r) => r.key);
  assert.ok(keys.includes("about_intro"));
  for (const k of ["mission", "vision", "beliefs", "our_story", "core_values"]) assert.ok(!keys.includes(k), `${k} must not be public yet`);
  assert.match(await rejects(as(db, "anon", (tx) => tx.query("select * from public.church_content"))), /permission denied/);
  const n = await as(db, nobody, (tx) => tx.query("select count(*)::int n from public.church_content"));
  assert.equal(n.rows[0].n, 0, "signed-in non-staff cannot read drafts");
});

/* ------------------------------------------------------------ approval workflow */
test("content editor drafts and submits the mission but cannot publish it", async () => {
  await as(db, editor, (tx) => tx.query("select public.save_church_content_draft('mission', $1::jsonb)", [JSON.stringify({ title: "Our Mission", body: "Proposed mission text" })]));
  await as(db, editor, (tx) => tx.query("select public.submit_church_content('mission', 'Please review')"));
  const st = (await db.query("select status, published from public.church_content where key='mission'")).rows[0];
  assert.equal(st.status, "pending");
  assert.equal(st.published, null);
  assert.match(await rejects(as(db, editor, (tx) => tx.query("select public.publish_church_content('mission')"))), /approved by a super admin/);
  // direct table update is blocked too
  assert.match(await rejects(as(db, editor, (tx) => tx.query("update public.church_content set published = draft, status='published' where key='mission'"))), /approved by a super admin/);
});

test("ministry managers and non-staff cannot touch church identity", async () => {
  await rejects(as(db, manager, (tx) => tx.query("select public.save_church_content_draft('vision', '{\"body\":\"x\"}'::jsonb)")));
  const r = await as(db, manager, (tx) => tx.query("update public.church_content set draft='{\"body\":\"x\"}' where key='vision' returning key"));
  assert.equal(r.rows.length, 0);
  await rejects(as(db, nobody, (tx) => tx.query("select public.submit_church_content('vision')")));
});

test("super admin approves: content becomes public and a version is recorded", async () => {
  await as(db, admin, (tx) => tx.query("select public.publish_church_content('mission')"));
  const pub = await as(db, "anon", (tx) => tx.query("select published from public.published_church_content where key='mission'"));
  assert.equal(pub.rows[0].published.body, "Proposed mission text");
  const v = await db.query("select event from public.content_versions where entity_key='mission' order by id");
  assert.deepEqual(v.rows.map((r) => r.event), ["saved", "submitted", "published"]);
  const row = (await db.query("select approved_by from public.church_content where key='mission'")).rows[0];
  assert.equal(row.approved_by, admin);
});

test("an empty draft cannot be published", async () => {
  assert.match(await rejects(as(db, admin, (tx) => tx.query("select public.publish_church_content('vision')"))), /draft is empty/);
});

test("editing a published entry keeps the live version until it is approved again", async () => {
  await as(db, editor, (tx) => tx.query("select public.save_church_content_draft('mission', $1::jsonb)", [JSON.stringify({ title: "Our Mission", body: "Second draft" })]));
  const pub = await as(db, "anon", (tx) => tx.query("select published from public.published_church_content where key='mission'"));
  assert.equal(pub.rows[0].published.body, "Proposed mission text", "public still sees the approved text");
});

test("restore an earlier version into the draft", async () => {
  const v = (await db.query("select id from public.content_versions where entity_key='mission' and event='published' order by id limit 1")).rows[0];
  await as(db, editor, (tx) => tx.query("select public.restore_content_version($1)", [v.id]));
  const d = (await db.query("select draft, status from public.church_content where key='mission'")).rows[0];
  assert.equal(d.draft.body, "Proposed mission text");
  assert.equal(d.status, "draft");
});

test("super admin can send back with a note", async () => {
  await as(db, editor, (tx) => tx.query("select public.submit_church_content('mission')"));
  await as(db, admin, (tx) => tx.query("select public.reject_church_content('mission', 'Use the wording from Sunday')"));
  const d = (await db.query("select status, review_note from public.church_content where key='mission'")).rows[0];
  assert.equal(d.status, "draft");
  assert.equal(d.review_note, "Use the wording from Sunday");
});

test("non-approval content (visit page) can be published by a content editor", async () => {
  await as(db, editor, (tx) => tx.query("select public.save_church_content_draft('visit_kids', $1::jsonb)", [JSON.stringify({ title: "Kids", body: "Updated kids text" })]));
  await as(db, editor, (tx) => tx.query("select public.publish_church_content('visit_kids')"));
  const pub = await as(db, "anon", (tx) => tx.query("select published from public.published_church_content where key='visit_kids'"));
  assert.equal(pub.rows[0].published.body, "Updated kids text");
});

/* ------------------------------------------------------------ audit: previous and new values */
test("audit log records who, what, previous and new values, and the outcome", async () => {
  await as(db, editor, (tx) => tx.query("update public.events set title='Night of Prayer (July)' where slug='night-of-prayer-july-2026'"));
  const a = (await db.query("select actor_id, old_values, new_values from public.audit_logs where table_name='events' order by id desc limit 1")).rows[0];
  assert.equal(a.actor_id, editor);
  assert.equal(a.old_values.title, "Night of Prayer");
  assert.equal(a.new_values.title, "Night of Prayer (July)");
  const pubLog = (await db.query("select outcome from public.audit_logs where table_name='church_content' and record_id='mission' and outcome='published'")).rows;
  assert.ok(pubLog.length >= 1, "publishing is recorded with outcome 'published'");
});

test("private submissions never put their text in the audit log", async () => {
  await as(db, "anon", (tx) => tx.query("insert into public.prayer_requests (request) values ('Secret prayer text')"));
  await as(db, admin, (tx) => tx.query("update public.prayer_requests set status='praying', internal_notes='called'"));
  const a = (await db.query("select old_values, new_values, changed from public.audit_logs where table_name='prayer_requests'")).rows;
  assert.ok(a.length > 0);
  assert.ok(a.every((r) => r.old_values === null && r.new_values === null));
  assert.ok(!JSON.stringify(a).includes("Secret prayer text"));
});

test("site settings changes are versioned and restorable", async () => {
  await as(db, editor, (tx) => tx.query(`update public.site_settings set value = '"Changed tagline"'::jsonb where key='site.tagline'`));
  const v = (await db.query("select id, data from public.content_versions where entity='site_settings' and entity_key='site.tagline' order by id desc limit 1")).rows[0];
  assert.equal(v.data, "Worship • Grow • Serve", "the previous value is kept");
  await as(db, editor, (tx) => tx.query("select public.restore_content_version($1)", [v.id]));
  const now = (await db.query("select value from public.site_settings where key='site.tagline'")).rows[0];
  assert.equal(now.value, "Worship • Grow • Serve");
});

/* ------------------------------------------------------------ sermon publication rules */
const newSermon = (tx, slug, speakerId, extra) => tx.query(
  `insert into public.sermons (slug, title, speaker_id, speaker_name, status, preacher_verified, location_verified, preached_in_arizona)
   values ($1, 'Test', $2, 'x', $3, $4, $5, $6) returning id`,
  [slug, speakerId, extra.status, extra.pv, extra.lv, extra.az]);

test("sermon rule: unverified sermons cannot be published", async () => {
  const e = await rejects(as(db, editor, (tx) => newSermon(tx, "unverified", charlesId, { status: "published", pv: false, lv: false, az: false })));
  assert.match(e, /sermon_policy/);
  const ok = await as(db, editor, (tx) => newSermon(tx, "unverified-draft", charlesId, { status: "draft", pv: false, lv: false, az: false }));
  assert.equal(ok.rows.length, 1, "unverified sermons can be kept as drafts");
});

test("sermon rule: Pastor Charles may be published wherever he preached", async () => {
  const ok = await as(db, editor, (tx) => newSermon(tx, "charles-elsewhere", charlesId, { status: "published", pv: true, lv: true, az: false }));
  assert.equal(ok.rows.length, 1);
});

test("sermon rule: other preachers only when preached at the Arizona church", async () => {
  assert.match(await rejects(as(db, editor, (tx) => newSermon(tx, "enock-elsewhere", enockId, { status: "published", pv: true, lv: true, az: false }))), /Arizona/);
  assert.match(await rejects(as(db, editor, (tx) => newSermon(tx, "guest-elsewhere", null, { status: "published", pv: true, lv: true, az: false }))), /Arizona/);
  const ok = await as(db, editor, (tx) => newSermon(tx, "enock-arizona", enockId, { status: "published", pv: true, lv: true, az: true }));
  assert.equal(ok.rows.length, 1);
});

test("sermon rule also applies when an existing draft is published", async () => {
  const id = (await as(db, editor, (tx) => newSermon(tx, "guest-draft", null, { status: "draft", pv: true, lv: true, az: false }))).rows[0].id;
  assert.match(await rejects(as(db, editor, (tx) => tx.query("update public.sermons set status='published' where id=$1", [id]))), /Arizona/);
});

/* ------------------------------------------------------------ ministry managers and events */
test("ministry manager can create and edit events for their own ministry only", async () => {
  const ok = await as(db, manager, (tx) => tx.query(
    "insert into public.events (slug, title, starts_at, ministry_id, status) values ('worship-night-test','Worship night', now() + interval '3 days', $1, 'draft') returning id", [worshipId]));
  assert.equal(ok.rows.length, 1);
  await rejects(as(db, manager, (tx) => tx.query(
    "insert into public.events (slug, title, starts_at, ministry_id) values ('prayer-test','Prayer', now(), $1)", [prayerId])));
  await rejects(as(db, manager, (tx) => tx.query("insert into public.events (slug, title, starts_at) values ('general-test','General', now())")));
  const other = await as(db, manager, (tx) => tx.query("update public.events set title='x' where slug='first-anniversary-2026' returning id"));
  assert.equal(other.rows.length, 0, "cannot edit church-wide events");
});

test("hidden albums are not public", async () => {
  await db.query("update public.gallery_categories set is_visible=false where slug='celebrations'");
  const r = await as(db, "anon", (tx) => tx.query("select slug from public.gallery_categories"));
  assert.ok(!r.rows.some((x) => x.slug === "celebrations"));
});

test("dashboard counts include approvals waiting and items needing confirmation", async () => {
  const c = (await as(db, admin, (tx) => tx.query("select public.dashboard_counts() c"))).rows[0].c;
  assert.ok(typeof c.approvals_pending === "number");
  assert.ok(c.needs_confirmation >= 3, "story, vision, beliefs still need confirmation");
});

/* ------------------------------------------------------------ identity correction on an old database */
test("identity correction script removes earlier Rwanda seed content and is re-runnable", async () => {
  const fs = await import("node:fs/promises");
  const sql = await fs.readFile(new URL("../../supabase/identity-correction.sql", import.meta.url), "utf8");
  // simulate a database seeded before the correction
  await db.query("insert into public.homepage_sections (key, title, data) values ('global', 'Chandler and Kigali', '{}') on conflict (key) do nothing");
  await db.query(`insert into public.sermons (id, slug, title, speaker_name, status) values (md5('sm-25-years')::uuid, 'old-25-years', '25 Years', 'x', 'draft') on conflict do nothing`);
  await db.exec(sql.replace("notify pgrst, 'reload schema';", ""));
  await db.exec(sql.replace("notify pgrst, 'reload schema';", "")); // twice: idempotent
  assert.equal((await db.query("select count(*)::int n from public.homepage_sections where key='global'")).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::int n from public.sermons where id = md5('sm-25-years')::uuid")).rows[0].n, 0);
  const all = JSON.stringify((await db.query("select * from public.homepage_sections")).rows) + JSON.stringify((await db.query("select * from public.site_settings")).rows);
  assert.ok(!/rwanda|kigali|africa new life/i.test(all), "no Rwanda content remains in homepage or settings");
});
