# Database Schema

The **source of truth** is the SQL in [`supabase/migrations/`](../supabase/migrations):

| Migration | Contents |
|---|---|
| `20261119000100_schema.sql` | Tables, constraints, indexes, `updated_at` / `published_at` triggers, auth → profile trigger |
| `20261119000200_security.sql` | Role helper functions, RLS policies, guards, audit trigger, rate-limit RPC, dashboard counts |
| `20261119000300_storage.sql` | `media` storage bucket + storage policies |
| `supabase/seed.sql` | Verified starter content (generated from `src/lib/content/seed.ts`) |

## Entity map

```
auth.users 1─1 profiles 1─* user_roles *─1 ministries
                                │
media_assets ◄── ministries.image_id, leadership.photo_id, sermons.thumbnail_id,
             ◄── events.image_id, gallery_items.media_id
ministries *─* leadership            (ministry_leaders)
sermons *─1 sermon_categories ; sermons *─1 leadership (speaker)
gallery_items *─1 gallery_categories ; gallery_items *─1 ministries / events (optional)
site_settings (key → jsonb) ; homepage_sections (ordered, visible flag, jsonb config)
prayer_requests ; contact_messages (kind contact|visit) ; newsletter_subscribers   ← public INSERT only
audit_logs (append-only, written by trigger) ; rate_limits (RPC only)
```

## Tables

| Table | Purpose | Key columns / constraints |
|---|---|---|
| `profiles` | Staff profile per auth user | `is_prayer_team` (only super admin can change) |
| `user_roles` | Role grants | `role ∈ {super_admin, content_editor, ministry_manager}`; a ministry manager **must** have `ministry_id`, other roles must not; unique per (user, role, ministry); the last super admin cannot be removed |
| `site_settings` | Global editable settings | `key` such as `church.name`, `church.address`, `services`, `social`, `contact` |
| `homepage_sections` | Homepage blocks | `key`, `sort_order`, `is_visible`, `data jsonb` (slides, CTAs, featured ids) |
| `media_assets` | Every image/video/audio/embed | `path` or `external_url` required; `permission_status`, `credit`, `source_url`, `alt_text` |
| `ministries` | Ministry directory | slug, schedule, activities[], image, status / published_at |
| `ministry_leaders` | Ministry ↔ leader | composite PK |
| `leadership` | Pastors and leaders | `role_group`, `needs_review` |
| `sermon_categories`, `sermons` | Messages | video/audio URLs, scripture, series, featured, generated `tsvector` for search |
| `events` | Events | `starts_at`/`ends_at` (end ≥ start), venue, registration URL, featured |
| `gallery_categories`, `gallery_items` | Gallery | optional ministry/event link |
| `announcements` | Site announcements | pinned, expires_at |
| `prayer_requests` | **Confidential** | name/email optional; `may_contact`; status workflow; internal notes |
| `contact_messages` | Contact + visit enquiries | `kind`; visit date and party size |
| `newsletter_subscribers` | Email list | case-insensitive unique email |
| `audit_logs` | Admin activity | actor, action, table, record, summary, changed column names (never private text) |
| `rate_limits` | Form throttling | accessed only via `check_rate_limit()` |

## Publishing rule
`is_live(status, published_at)` = `status = 'published' AND published_at <= now()`. Setting `status = 'published'` with a future `published_at` **schedules** the item. A trigger fills `published_at` automatically when an item is published without one.

## RLS summary

| Data | anon | content_editor | ministry_manager | super_admin |
|---|---|---|---|---|
| Live published content | read | read all + write | read all; update own ministry, its leaders and gallery items | all |
| Drafts | — | read/write | read | all |
| Site settings, homepage | read | write | read | write |
| Prayer requests | insert only | — (unless `is_prayer_team`) | — (unless `is_prayer_team`) | all |
| Contact / visit messages | insert only | read/update | — | all + delete |
| Newsletter | insert only | read/update | — | all + delete |
| Users and roles | — | own role | own role | all |
| Audit log | — | — | — | read |
| Storage `media` | read | upload/update/delete | upload; edit own files | all |

Ministry managers cannot change a ministry's slug, status, publication date or order (trigger guard).

Tests for these rules are in `tests/db/rls.test.mjs`. They run the real migrations in an embedded Postgres (PGlite) with Supabase-compatible `auth.uid()` and role switching.

## CMS round 2: `20261120000100_cms.sql`

| Object | Purpose |
|---|---|
| `church_content` | Identity sections: `key`, `label`, `requires_approval`, `draft`, `published`, `status` (draft / pending / published / needs_confirmation), review and approval fields |
| `published_church_content` (view) | The only public read path: `key`, `published`, `published_at` where published |
| `content_versions` | Version history for identity content and site settings (`event`: saved / submitted / published / rejected / restored) |
| Functions | `save_church_content_draft`, `submit_church_content`, `publish_church_content`, `reject_church_content`, `unpublish_church_content`, `restore_content_version` |
| `audit_logs` + columns | `old_values`, `new_values`, `outcome` |
| `sermons` + columns | `location`, `preached_in_arizona`, `preacher_verified`, `location_verified`; trigger `sermons_policy` |
| `leadership` + column | `publish_sermons_anywhere` |
| `events` + column | `ministry_id`; ministry managers may insert, update and delete their ministry's events |
| `ministries` + column | `is_featured` |
| `gallery_categories` + columns | `description`, `is_visible`, `cover_media_id` (albums; hidden albums not public) |
| `dashboard_counts()` | adds `approvals_pending`, `needs_confirmation` |

Settings keys added: `site.statement` (replaces `site.affiliation`), `site.giving`, `site.navigation`, `site.pages`, `site.visit_faq`.

### RLS additions

| Data | anon | content_editor | ministry_manager | super_admin |
|---|---|---|---|---|
| Identity content (published) | read via view | read | read | read |
| Identity drafts | — | read, save, submit; publish if no approval needed | — | all, including approve |
| Content versions | — | read, restore | — | read, restore |
| Events of own ministry | — | all | create / edit / delete | all |

`supabase/identity-correction.sql` (generated) removes the Rwanda-related seed rows from databases seeded before 2026-11-20.
