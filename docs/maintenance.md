# Maintenance, ownership and handover

How the church keeps the website running long term, whoever looks after it.

## Accounts the church should own

| Service | What it holds | Recommended owners |
|---|---|---|
| **GitHub** | The code and its full history | Church organization account, 2+ admins |
| **Vercel** | Hosting, domains, environment variables | Church team, 2+ members |
| **Supabase** (project `alxsvoqbqxymibxhzujd`, ANLM organization) | Database, staff logins, uploaded media | ANLM organization, 2+ owners |
| **Zeffy** | Card giving form, payouts, tax receipts | Church email, 2+ admins |
| **Namecheap** | The domain `newlifeglobalaz.org` and church email | Church, 2+ people with access |
| **Website admin** (`/admin`) | Day-to-day content | 2–3 Super Admins |

With two people on every account, nobody's absence can lock the church out.

## Day-to-day (no code needed)

Staff change almost everything in the admin: sermons, events, ministries, photos, homepage sections, the menu, service times, contact details, giving methods and staff roles. See [admin-dashboard.md](admin-dashboard.md).

## Updates

- **Security patches:** Vercel (hosting) and Supabase (database) are patched automatically.
- **Code updates:** every change is committed to GitHub, and Vercel deploys it automatically within about a minute.
- **Dependencies:** about every 3 months, a developer runs `npm outdated`, updates packages, runs `npm test`, `npm run lint` and `npm run build`, then pushes.
- **Before any change:** run the 72 automated tests (`npm test`). They check the security rules and the giving logic.

## Backups

- **Database:** Supabase keeps daily backups (7 days on the free plan). For extra safety, export important tables monthly from Supabase › Table Editor › Export.
- **Code:** GitHub holds every version; any earlier version can be redeployed from Vercel › Deployments in one click.
- **Media:** church photos are in the code (`public/media/`) and in Supabase Storage.

## Handing over to a new developer

Any developer familiar with **Next.js, React and TypeScript** (very common skills) can maintain this site. Give them:

1. Access to the GitHub repository, the Vercel team and the Supabase project.
2. This `docs/` folder, especially [deployment.md](deployment.md), [architecture.md](architecture.md) and [database-schema.md](database-schema.md).
3. A copy of `.env.example`; they fill in the values from Vercel.

They can run the site locally with `npm install` and `npm run dev`, and check everything with `npm test`.

## Costs

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby / Pro | $0 (Pro $20/month if needed) |
| Supabase | Free | $0 (Pro $25/month for daily backups beyond 7 days) |
| Zeffy | Free for nonprofits | $0 (donors may tip Zeffy) |
| Domain | Namecheap | about $10–15/year |

## Checklist when someone leaves a role

- [ ] Remove or change their role in **Admin › Users & roles**.
- [ ] Remove them from GitHub, Vercel, Supabase, Zeffy and Namecheap if they had access.
- [ ] If they knew any shared password or key, rotate it (Supabase › API Keys can regenerate the service key; then update Vercel).
- [ ] Check **Admin › Audit log** for recent changes.
