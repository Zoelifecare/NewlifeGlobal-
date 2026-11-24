# New Life Global: Website & Church Admin

The official website and church-management platform for **New Life Global**, a church in Chandler, Arizona.
Live site: **https://newlifeglobal.vercel.app** (moving to **newlifeglobalaz.org**).

It has two parts:

- **The public website:** Home, About, Ministries, Messages (sermons), Events, Gallery, Prayer requests, Plan Your Visit, Contact and **Give**.
- **The church admin (`/admin`):** staff manage every page and setting without code, review prayer requests and messages, track giving, and control who can do what.

---

## What it does

| Area | Highlights |
|---|---|
| **Content** | Sermons (with publication rules), events, ministries, announcements, gallery albums, leadership, media library, homepage sections, menu and page visibility, service times and contact details |
| **Church identity** | Mission, vision, beliefs and the church story go through **draft → submit → approve → publish**, with version history and one-click restore |
| **Giving** | Card / Apple Pay / Google Pay through **Zeffy** (in-page popup), Zelle, Cash App, bank transfer, Cash Drop, pledges with fulfilment tracking, a finance dashboard, CSV exports, finance email notifications |
| **People & roles** | Super Admin, Content Editor, Ministry Manager (their ministry only), Finance Manager, plus a "prayer team" permission for private prayer requests |
| **Accountability** | Every admin change is written to an **audit log** with who, when, and the old and new values |
| **Visitors** | Prayer requests, contact and visit forms, newsletter sign-up, with spam protection and rate limiting |

## Technology

| Layer | Choice | Why |
|---|---|---|
| Web framework | **Next.js 16** (App Router), **React 19**, **TypeScript** | Industry standard; fast, accessible pages; typed code |
| Styling | **Tailwind CSS 4**, Motion, Lucide icons | Consistent design system (forest green, gold, cream) |
| Database & auth | **Supabase**: PostgreSQL, Auth, Storage, Row Level Security | Security rules live *inside* the database |
| Hosting | **Vercel** | Automatic HTTPS, global CDN, a new deployment on every push |
| Card giving | **Zeffy** (Stripe) | Free for nonprofits; card data never touches this site |
| Email | **Resend** (optional) | Finance and donor notifications |

## Quick start (developers)

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL and anon key
npm run dev                  # http://localhost:3000
npm test                     # 72 automated tests (database security, giving rules, validation, notifications)
npm run lint && npm run typecheck && npm run build
```

Without Supabase settings the site still runs, read-only, on the built-in starter content.

## Documentation

| Guide | For | Contents |
|---|---|---|
| [docs/admin-dashboard.md](docs/admin-dashboard.md) | Church staff | How to use every admin section, roles and permissions |
| [docs/giving.md](docs/giving.md) | Finance team | How giving works: Zeffy, Zelle, Cash App, QR codes, pledges, reports |
| [docs/security.md](docs/security.md) | Leadership, reviewers | Security model and how it compares with a typical WordPress site |
| [docs/maintenance.md](docs/maintenance.md) | Whoever looks after the site | Accounts, ownership, updates, backups, handover checklist |
| [docs/deployment.md](docs/deployment.md) | Developers | Supabase + Vercel setup, environment variables, domain, first admin |
| [docs/architecture.md](docs/architecture.md) | Developers | How the system fits together |
| [docs/database-schema.md](docs/database-schema.md) | Developers | Tables, functions and access rules |
| [docs/testing-report.md](docs/testing-report.md) | Reviewers | What is tested and how |
| [docs/design-direction.md](docs/design-direction.md) | Designers | Layout system and visual language |
| [docs/research/](docs/research/) | Content editors | Verified church facts, sources and media permissions |

## Project layout

```
src/app/(site)/        public pages (home, about, give, messages, events, …)
src/app/admin/         admin dashboard (login, content, giving, users, audit)
src/app/api/           form and giving endpoints (validated, rate-limited)
src/components/        UI components (site and admin)
src/lib/               data access, validation, auth, notifications
supabase/migrations/   database schema and security rules (run in order)
supabase/seed.sql      starter content (generated from src/lib/content/seed.ts)
tests/                 automated tests (database + unit)
docs/                  documentation
public/media/          approved church photos, logos, giving QR codes
```

## Content rules

Only publish verified church information. New facts are recorded in `docs/research/references.md` with their source.
Mission, vision, beliefs and the church story are published only after a Super Admin approves them.

## Ownership

Built for New Life Global by Olivier Itangishaka. The code, database and hosting accounts should be owned by the church,
with at least two administrators: see [docs/maintenance.md](docs/maintenance.md).
