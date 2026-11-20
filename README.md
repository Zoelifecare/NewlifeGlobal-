# New Life Global — Website & Admin

Official website and content-management platform for **New Life Global**, Chandler, Arizona: the U.S. branch of Africa New Life Ministries and New Life Bible Church, Rwanda.

- **Public site:** Home, About, Ministries, Messages, Events, Gallery, Prayer, Plan Your Visit, Contact. The UX is modelled on ai.gov.rw: numbered chapters, editorial sections, sticky numbered table of contents.
- **Admin (`/admin`):** homepage, ministries, sermons, events, announcements, gallery, leadership, media library, prayer requests, messages and visits, subscribers, settings, users and roles, audit log.
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Vercel.

## Quick start
```bash
npm install
npm run dev          # http://localhost:3000 (runs read-only on seed content without Supabase)
npm test             # database RLS tests (embedded Postgres) + validation tests
npm run build
```

## Documentation
| Doc | Contents |
|---|---|
| [docs/research/research-report.md](docs/research/research-report.md) | Verified identity, Rwanda connection, findings |
| [docs/research/owner-decisions.md](docs/research/owner-decisions.md) | Decisions from the project owner |
| [docs/research/references.md](docs/research/references.md) | Every source used (living document) |
| [docs/research/media-inventory.md](docs/research/media-inventory.md) | Media, sources and permissions |
| [docs/research/brand-guidelines.md](docs/research/brand-guidelines.md) | Colours, type, components |
| [docs/design-direction.md](docs/design-direction.md) | ai.gov.rw analysis and how it's applied |
| [docs/architecture.md](docs/architecture.md) | System design and security layers |
| [docs/database-schema.md](docs/database-schema.md) | Tables and RLS summary |
| [docs/deployment.md](docs/deployment.md) | Supabase + Vercel setup, first admin, launch checklist |

## Content rules
Do not add unverified church information. New facts go into `docs/research/references.md` with their source before they go on the site. Starter content lives in `src/lib/content/seed.ts`; `npm run seed:generate` rebuilds `supabase/seed.sql` from it.
