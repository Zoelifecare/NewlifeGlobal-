# Admin Dashboard Guide (`/admin`)

Staff sign in at `/admin/login` (invite only). Every action is checked three times: the proxy (signed in?), the server action (role?) and Postgres Row Level Security (allowed for this row?). Every change is written to the audit log.

## Roles

| Capability | Super Admin | Content Editor | Ministry Manager |
|---|:-:|:-:|:-:|
| Church Identity: edit drafts | ✓ | ✓ | ✗ |
| Church Identity: approve and publish mission, vision, beliefs, story | ✓ | submits for approval | ✗ |
| Church Identity: publish visit and giving text (no approval needed) | ✓ | ✓ | ✗ |
| Church info, contact, service times, social, logo, giving, navigation, page visibility | ✓ | ✓ | ✗ |
| Homepage sections | ✓ | ✓ | ✗ |
| Sermons, announcements, leadership | ✓ | ✓ | ✗ |
| Ministries | ✓ | ✓ | edit own ministry (not its slug, status or order) |
| Events | ✓ | ✓ | create and edit own ministry's events (drafts) |
| Gallery photos | ✓ | ✓ | own ministry's items (drafts) |
| Media library | ✓ | ✓ | upload; edit own uploads |
| Contact messages, visit enquiries, subscribers | ✓ | ✓ | ✗ |
| Prayer requests | ✓ | only with "prayer team" access | only with "prayer team" access |
| Users and roles, audit log, deleting submissions | ✓ | ✗ | ✗ |

## Sections

### Overview
Live counts: published sermons, upcoming events, live announcements, gallery items, unread messages, new prayer requests, **changes awaiting approval**, **sections needing confirmation**, and recent activity (super admin).

### Church Identity & Settings (`/admin/identity`)
- **Church content:** About New Life Global, Our Story, Mission, Vision, Core Values, What We Believe, Plan Your Visit (introduction, what to expect, kids), Giving introduction.
  - Workflow: *Save draft* → *Submit for approval* (editor) → *Approve & publish* or *Send back with note* (super admin). Sections that don't need approval have a direct *Publish*.
  - *Preview* shows the draft as the website will display it. Editing a published section never changes the live site until it is published again.
  - **Version history** for every section: saved, submitted, published, sent back, restored. *Restore to draft* brings back any earlier version.
  - Statuses: Draft · Awaiting approval · Published · Needs confirmation. "Needs confirmation" marks sections waiting for Pastor Charles; they are never public.
- **Church info & contact:** name, short name, tagline, short statement, logo (from the media library), anchor verse, address, public email and phone, service times, social links. A settings history lists earlier values with one-click *Restore*.
- **Giving:** show or hide the Give page; approved giving methods (name, description, https link, note).
- **Plan Your Visit FAQ:** questions and answers, reorderable.
- **Navigation & pages:** main menu items and dropdown sub-items (label, link, description, visible, order); page visibility switches. A hidden page returns 404 and leaves the menus. Menu links to unpublished About sections are hidden automatically.

### Homepage (`/admin/homepage`)
Hero slides (headline, text, image, buttons), the three chapters (text, points, image, hover video), section order and visibility, and advanced settings for the other sections. Featured messages, events and ministries use the "Featured" switch on each item.

### Content lists
Ministries, Sermons, Events, Announcements, Gallery, Leadership, Sermon categories and Gallery albums all share the same screens: search, status filter, create, edit, preview, publish/unpublish, schedule (a future "Publish at"), archive and delete.
- **Sermons:** title, preacher, guest name, date, category, series, scripture, video and audio links, thumbnail, featured, where it was preached, "preached at our Arizona church", "preacher verified", "location verified". The database refuses to publish a sermon that breaks the rules; the editor explains why.
- **Events:** name, dates and times (Arizona time), venue, address, registration link, image, ministry, featured.
- **Ministries:** description, photo, schedule, location, activities, leaders, join link, featured on homepage, order.
- **Gallery albums:** name, description, cover photo, visible on the website.
- **Leadership:** name, title, group, bio, photo, order, "bio needs review", and "sermons may be published wherever this person preached" (Pastor Charles).

### Media library (`/admin/media`)
Upload photos, video, audio and PDF (15 MB each; type checked in the browser and enforced by the storage bucket). Every file records a description (alt text), credit, category and permission status. Any image on the site can be replaced by picking another file.

### Inbox
- **Prayer requests:** confidential; statuses new → praying → followed up → answered → archived; assignment; internal notes. The request text never enters the audit log.
- **Messages & visits:** contact and Plan-a-Visit enquiries; statuses, notes, reply by email.
- **Subscribers:** list, unsubscribe, CSV export (spreadsheet-injection safe).

### Users & roles (super admin)
Invite by email (needs the service-role key on the server), add or remove roles, grant prayer-team access. The last super admin cannot be removed.

### Audit log (super admin)
Who, what, when, the previous and new values (private tables excepted) and the outcome (published, submitted for approval, archived…).
