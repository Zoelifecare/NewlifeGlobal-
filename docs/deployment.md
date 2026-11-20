# Deployment Guide — Vercel + Supabase

## 1. Supabase
1. Create a project at supabase.com (region close to Arizona, e.g. `us-west-1`).
2. **SQL Editor** — run, in order:
   1. `supabase/migrations/20261119000100_schema.sql`
   2. `supabase/migrations/20261119000200_security.sql`
   3. `supabase/migrations/20261119000300_storage.sql`
   4. `supabase/migrations/20261120000100_cms.sql`
   5. `supabase/seed.sql` (verified starter content) for a NEW database, **or** `supabase/identity-correction.sql` if the database was already seeded before 2026-11-20
   6. `notify pgrst, 'reload schema';`
   *(Or with the Supabase CLI: `supabase link` then `supabase db push`, then run the seed.)*
3. **Authentication → Providers:** keep Email enabled. **Disable “Allow new users to sign up”**: staff are invited only.
4. **Authentication → URL configuration:** Site URL = `https://YOUR-DOMAIN`; add `https://YOUR-DOMAIN/admin/auth/callback` to Redirect URLs (plus the Vercel preview domain if you want to test previews).
5. **Authentication → Email templates:** for *Invite* and *Reset password*, the link must go to `{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=invite` (or `type=recovery`).
6. **Settings → API:** copy the Project URL, the `anon` key and the `service_role` key.

### First super admin
1. **Authentication → Users → Add user** (or Invite) with the pastor's/administrator's email.
2. In the SQL editor:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'super_admin' from auth.users where email = 'ADMIN@EXAMPLE.ORG';
   update public.profiles set full_name = 'Full Name', is_prayer_team = true
   where email = 'ADMIN@EXAMPLE.ORG';
   ```
3. Sign in at `/admin/login`. Invite everyone else from **Admin → Users & roles**.

## 2. Media
The seed references the owner-approved photos stored in `public/media/` (deployed with the site).
New uploads go to the Supabase Storage bucket `media`. To move the seeded photos into Storage later, upload them in **Admin → Media library** and pick them in each section.

## 3. Vercel
1. Import the Git repository into Vercel (framework preset: Next.js).
2. Environment variables (Production + Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**server only**) |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-DOMAIN` |
| `RATE_LIMIT_SALT` | a long random string |

3. Deploy. Then **Settings → Domains**: add the church domain; Vercel issues HTTPS automatically. Point DNS as Vercel instructs (A / CNAME).
4. Create the church email on the same domain (owner decision OD-5), then set it in **Admin → Site settings → Public contact details**.

## 4. Pre-launch checklist
- [ ] Migrations + seed applied; first super admin can sign in
- [ ] Sign-ups disabled in Supabase Auth
- [ ] Redirect URL and email templates updated
- [ ] All five env vars set in Vercel; `SUPABASE_SERVICE_ROLE_KEY` is **not** prefixed `NEXT_PUBLIC_`
- [ ] Custom domain + HTTPS active; `NEXT_PUBLIC_SITE_URL` matches it
- [ ] Submit a test prayer request, contact message, visit form and newsletter signup; confirm each appears in the admin
- [ ] Upload a photo in the media library and use it on the homepage
- [ ] Service times, address and contact details reviewed in **Site settings**
- [ ] Bios/portraits for Augustine Ndemezo and Pastor Enock added (flagged “needs review”)
- [ ] `npm run test` passes (database RLS + validation tests)

## 5. Local development
```bash
npm install
cp .env.example .env.local   # optional — without it the site runs read-only on the seed
npm run dev
```
Without Supabase credentials, the public site renders the verified seed content, forms reply “database not connected”, and `/admin` shows setup instructions. Nothing pretends to save.

## 6. Operations
- **Backups:** Supabase daily backups (Pro plan) or a scheduled `pg_dump`.
- **Prayer data retention:** archive or delete answered requests periodically (Admin → Prayer requests; deletion is super-admin only).
- **Dependencies:** `npm outdated` monthly; redeploy after updates.
