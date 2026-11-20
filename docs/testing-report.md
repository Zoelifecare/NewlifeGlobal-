# Testing Report (2026-11-20)

## Summary

| Area | Method | Result |
|---|---|---|
| Type safety | `tsc --noEmit` | ✅ no errors |
| Lint | `eslint src` (Next.js + React Compiler rules) | ✅ no errors or warnings |
| Production build | `next build` | ✅ 33 routes |
| Build with database down | `next build` with an unreachable Supabase URL | ✅ completes, serves seed content |
| Database security and CMS rules | 44 tests on the real migrations + seed in embedded Postgres (PGlite) as `anon` / `authenticated` | ✅ 44 / 44 |
| Form validation | 6 unit tests | ✅ 6 / 6 |
| Public routes | HTTP smoke test of every page, dev and production | ✅ 200 for pages; 404 for unknown and removed items (production) |
| Identity correction | Rendered-text scan of every public page for Rwanda, Kigali, Africa New Life, ANLM, 25 years | ✅ none (only the language word "Kinyarwanda") |
| Dashes in wording | Rendered-text scan | ✅ none |
| Dropdown navigation | DOM test: open, numbered items, Escape closes, Give present | ✅ |
| Menu hides unpublished About sections | DOM test | ✅ only "Who We Are" and "Leadership" until approved |

## Database tests (`npm run test:db`)
**Row Level Security (24):** public reads only live content; drafts and scheduled items hidden; anon cannot write; prayer requests are insert-only for the public; prayer readable only by super admin and the prayer team; contact messages only by editors; ministry-manager scope; role escalation blocked; last super admin protected; prayer-team flag admin-only; audit log admin-only and tamper-proof; rate limiter; dashboard counts; constraints; storage policies.

**CMS round 2 (20):**
- the public read model exposes only published identity content;
- editors can draft and submit, but cannot publish approval-required content, either through the function or with a direct UPDATE;
- ministry managers and non-staff cannot touch identity;
- super admin approval publishes the content and records a version;
- an empty draft cannot be published;
- the live version stays until a new one is approved;
- an earlier version can be restored;
- the super admin can send content back with a note;
- non-approval content can be published by editors;
- the audit log records actor, previous value, new value and outcome;
- private submissions never put their text in the audit log;
- settings are versioned and restorable;
- sermon rules: unverified sermons are blocked; Pastor Charles is allowed anywhere; other preachers only in Arizona; drafts are checked again when published;
- ministry-manager events are limited to their own ministry;
- hidden albums are not public;
- dashboard approval counts;
- the identity-correction script removes old Rwanda content and can be run twice.

## Not yet tested (needs a connected Supabase project)
These depend on Supabase Auth, Storage and PostgREST, which can't run in this environment (no Docker, and no project credentials provided):
- signing in to `/admin` and the invite and reset emails;
- saving from the admin screens through the live API and seeing the change on the public site;
- media upload to the Storage bucket;
- form submissions saving to the database (validation, spam and rate-limit paths are tested; the final insert needs the database);
- role behavior in the actual admin UI (the same rules are tested at the database level above).

**Next step:** connect a Supabase project (migrations → `seed.sql`, or `identity-correction.sql` on an existing database) and set `.env.local`, then run the end-to-end checklist in `docs/deployment.md`.

## Visual checks
The app's browser pane was hidden during this session, so layouts were verified through the DOM (dimensions, overflow, navigation behavior) rather than screenshots. The mobile layout was verified structurally (drawer, single-column grids, no horizontal overflow) in round 1. A visual pass on a real phone and desktop is recommended after deployment.
