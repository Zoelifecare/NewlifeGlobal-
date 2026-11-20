# Architecture — New Life Global Website & Admin

## 1. Overview

```
Browser ──► Vercel (Next.js App Router, React Server Components)
              │  public site  (/ , /about, /ministries, /messages, /events, /gallery, /prayer, /visit, /contact)
              │  admin        (/admin/**  — auth-gated in middleware + per-request role check + RLS)
              │  route handlers (/api/forms/*)  — validation (zod), honeypot, rate limit
              ▼
          Supabase
              ├─ Postgres  (tables, constraints, RLS, audit triggers, rate-limit RPC)
              ├─ Auth      (email + password / magic link; staff only — no public sign-up)
              └─ Storage   (bucket `media`, public read; staff-only writes; MIME + size limits)
```

**Security principle:** the browser only ever holds the **anon key** and the user's own session. The service-role key exists only on the server, is used only by the explicitly marked `admin-only` user-management module, and is never imported into a client component (enforced with the `server-only` package).

## 2. Technology

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS custom-property design tokens (`--nl-*`) |
| Motion | `motion` (Framer Motion), with every animation honoring `prefers-reduced-motion` |
| Icons | lucide-react |
| Data | `@supabase/ssr` + `@supabase/supabase-js` |
| Validation | zod (shared by client forms and server handlers) |
| Hosting | Vercel + Supabase; custom domain, HTTPS by default |

## 3. Source layout

```
src/
  app/
    (site)/                  public website (shared header/footer layout)
      page.tsx               home
      about/ ministries/[slug]/ messages/[slug]/ events/[slug]/ gallery/
      prayer/ visit/ contact/
    admin/                   dashboard (own layout; requires staff session)
      login/  page.tsx (overview)
      homepage/ ministries/ sermons/ events/ gallery/ leadership/
      announcements/ prayer/ messages/ subscribers/ media/ users/ settings/ audit/
    api/forms/{prayer,contact,visit,newsletter}/route.ts
    sitemap.ts  robots.ts  opengraph-image
  components/
    site/        header, drawer, hero-slider, section-head, pathway-card, row-list, …
    admin/       data table, editor forms, media picker, status badge, …
    ui/          button, input, textarea, select, dialog, lightbox, …
  lib/
    supabase/    server.ts (RSC/cookies) · client.ts (browser) · admin.ts (service role, server-only)
    auth/        getStaff(), requireRole()
    content/     typed read functions for every public entity
    validation/  zod schemas
    security/    rate-limit, honeypot, sanitize
  styles/tokens.css
supabase/
  migrations/    ordered SQL migrations (schema, RLS, triggers, storage, seed)
  seed.sql       verified starter content
tests/           db (PGlite RLS tests) · e2e
docs/
```

## 4. Content model and publishing
- Every publishable entity (sermons, events, ministries, announcements, gallery items, leadership, homepage sections) has `status` (`draft` | `published` | `archived`) and `published_at`.
- **Public visibility** = `status = 'published' AND published_at <= now()`. A future `published_at` therefore acts as **scheduling**, enforced by RLS, not by UI code.
- **Preview:** staff are authenticated, so RLS lets them read drafts. `/admin/**/preview` renders the public component with draft data.
- Nothing editable is hard-coded. Site name, service times, address, socials, hero copy, section order and visibility all live in `site_settings` / `homepage_sections`.

## 5. Roles and authorization (defense in depth)

| Role | Can |
|---|---|
| `super_admin` | Everything, including users/roles, settings, prayer requests, audit log |
| `content_editor` | Create, edit, publish all content and media; read contact messages and visitor enquiries |
| `ministry_manager` | Edit only the ministries they are assigned to (via `user_roles.ministry_id`), and those ministries' leaders and gallery items |

Enforcement happens at three layers:
1. **Middleware:** `/admin/**` requires a session, otherwise redirect to `/admin/login`.
2. **Server actions:** `requireRole()` before every mutation.
3. **Postgres RLS:** helper functions `is_staff()`, `has_role(role)` and `can_manage_ministry(id)` (`SECURITY DEFINER`, fixed `search_path`). If layers 1–2 were bypassed, the database still refuses.

**Prayer requests** are readable only by `super_admin`, plus users individually granted the `prayer_team` flag. They are never exposed to anon users and never included in exports or analytics.

## 6. Public forms
Prayer, contact, visit enquiry and newsletter forms POST to route handlers, which:
1. Validate with zod (length limits, email format).
2. Reject submissions where the honeypot field is filled or the form was completed in under 2 seconds.
3. Call the `check_rate_limit(key, max, window)` RPC, keyed on a hashed IP + form (e.g. 5 per 10 minutes).
4. Insert using the **anon** client. RLS allows anon `INSERT` only, with no `SELECT`, so a submission can never be read back publicly.

## 7. Media
- One Supabase Storage bucket, `media`: public read, 15 MB limit, allowed MIME types `image/jpeg, png, webp, avif, gif, video/mp4, audio/mpeg`.
- Writes are allowed only for staff (storage RLS).
- Every file has a `media_assets` row (path, alt text, credit, source URL, permission status, category). Pages reference `media_assets.id`, so admins can replace any image without code changes.
- External video (YouTube) is stored as a URL and rendered with `youtube-nocookie.com` embeds. Instagram posts can be added as oEmbed links.
- Images are served via `next/image` (responsive sizes, lazy loading, AVIF/WebP).

## 8. Audit log
A generic trigger on all content and admin tables writes `audit_logs(actor_id, action, table_name, record_id, changed_fields, created_at)`. The log is insert-only: no update or delete for anyone, and only super admins can read it.

## 9. Performance and SEO
- Server components plus ISR (`revalidate`). Admin mutations call `revalidatePath` for the affected public routes.
- Metadata API per page, Open Graph, `sitemap.ts`, `robots.ts` (disallow `/admin`), JSON-LD `Church` schema with address and service times.
- Fonts are self-hosted via `next/font` (Inter, Newsreader).

## 10. Accessibility
Semantic landmarks, a skip link, visible focus rings, a focus-trapped drawer and lightbox, keyboard-operable slider (arrow keys, pause button), labelled form fields with error messages linked by `aria-describedby`, reduced-motion support, and AA contrast (verified in brand-guidelines).

## 11. Environments and secrets

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (all environments) + `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server env only; never prefixed `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL |
| `RATE_LIMIT_SALT` | Server only; used to hash IPs |

**Local development without Supabase credentials:** the content layer falls back to the verified seed content (`src/lib/content/seed.ts`, mirroring `supabase/seed.sql`) so the public site can be previewed. In that mode forms and admin show a clear "Database not connected" state and **do not pretend to save**.

## 12. CMS round 2 (2026-11-20)

- **Church identity content** lives in `church_content` (draft and published JSON per section). The public site reads only the `published_church_content` view; drafts, review notes and approval data are never exposed. Publishing goes through security-definer functions (`save_church_content_draft`, `submit_church_content`, `publish_church_content`, `reject_church_content`, `unpublish_church_content`, `restore_content_version`). A trigger blocks editors from publishing approval-required sections even with a direct UPDATE.
- **Versioning:** `content_versions` keeps every saved, submitted, published, sent-back and restored version of identity content, plus the previous value of every site setting. Restore is one action.
- **Audit:** `audit_logs.old_values`, `new_values` and `outcome` record what changed from what to what, except on private tables (prayer, messages, subscribers, profiles), where only column names are kept.
- **Sermon rules** are a database trigger (`enforce_sermon_policy`), so no client, script or role can publish a sermon that breaks them.
- **Settings-driven UI:** navigation (with dropdown groups), page visibility, giving methods, visit FAQ and logo are settings keys, so the header, footer and pages need no code changes for routine updates.
- **Resilience:** content reads fall back to the verified seed content (60-second circuit breaker) when the database is unreachable or not migrated, so a database problem cannot break a deploy.
- **404s:** the site route group has no streaming `loading.tsx`, so unknown or removed items return a real 404 status.
