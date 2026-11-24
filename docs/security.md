# Security

How the New Life Global website protects the church, its members and its donors.

## The short version

- **No plugins:** the most common way church and small-business websites are hacked is an outdated WordPress plugin or theme. This site has none.
- **Security lives in the database:** even if someone found a bug in the website, the database itself refuses anything their role does not allow.
- **Card data never touches the site:** card, Apple Pay and Google Pay payments are processed by Zeffy and Stripe (PCI-DSS Level 1).
- **The giving link cannot be swapped:** the database only accepts a card giving link that points to the church's Zeffy form, even from an admin.
- **Everything is logged:** every admin change is recorded with who, when, and the old and new values.
- **Patched for us:** hosting (Vercel) and the database (Supabase) apply security updates automatically.

## Layers of protection

### 1. Database rules (Row Level Security)
Every table has rules enforced by PostgreSQL itself, not by the website code:

| Data | Public | Content Editor | Ministry Manager | Finance Manager | Super Admin |
|---|---|---|---|---|---|
| Published sermons, events, pages | read | edit | own ministry | — | edit |
| Prayer requests | submit only | — | — | — | read/manage (and "prayer team" members) |
| Messages, subscribers | submit only | read/manage | — | — | read/manage |
| Pledges, giving submissions | submit only | — | — | read/manage | read/manage |
| Donations, bank references | none | none | none | read/manage | read/manage |
| Payment methods (card link, Zelle, Cash App) | read active | — | — | edit | edit |
| Users and roles, audit log | none | none | none | none | manage |

These rules are covered by automated tests (`tests/db/`), which run the real database migrations and try to break them.

### 2. Giving safeguards
- The card giving link must start with `https://www.zeffy.com/`. This is enforced by a database constraint (`payment_methods_online_link_allowlist`) **and** by the admin form.
- A donor's "I sent it" confirmation is never counted as money until finance verifies it, and it cannot be marked verified by a simple edit.
- Pledges are never counted as revenue; only verified donations are.
- Bank account references store only the last 4 digits. Full account and routing numbers are never stored.
- Emails never contain card, bank or password details.

### 3. Accounts and sign-in
- Staff accounts are created by invitation only; public sign-up is off.
- Passwords are handled by Supabase Auth (hashed; never visible to anyone, including admins).
- The last Super Admin cannot be removed, so the church can never be locked out.
- A Ministry Manager cannot publish, rename or reorder their ministry, only edit its content.

### 4. Forms and spam
- Every public form is validated on the server, has a hidden spam trap and a minimum fill time, and is rate-limited per visitor.
- Visitor IP addresses are hashed, never stored in plain text.
- Prayer request text is never copied into logs.

### 5. Secrets
- The database service key exists only in Vercel's encrypted environment variables. It is never sent to browsers and never committed to the code.
- The public ("anon") key can only do what the database rules allow the public to do.

### 6. Web protections
- HTTPS everywhere, with security headers (no framing of the site by other websites, strict referrer policy, content-type protection).
- Every change goes through Git, so it is reviewable and reversible.

## What still depends on people

No system is secure if passwords are weak. The church should:
1. Keep the number of Super Admins small (2 or 3).
2. Use long, unique passwords, ideally from a password manager.
3. Remove staff access as soon as someone leaves a role (Admin › Users & roles).
4. Glance at **Admin › Audit log** from time to time, especially after changes to giving.
5. Keep the GitHub, Vercel, Supabase and Zeffy accounts owned by church emails with two people each (see [maintenance.md](maintenance.md)).

## Compared with a typical WordPress site

| | Typical WordPress church site | This site |
|---|---|---|
| Main attack surface | Plugins and themes, which need constant updating | No plugins |
| Updates | Manual: core, theme and plugins | Hosting and database patched automatically |
| Admin login | `/wp-admin`, attacked by bots daily | Custom admin, with data protected by database rules |
| Private data protection | Usually only the login screen | Enforced inside the database for every query |
| Giving link tampering | A compromised plugin or admin can change it | The database refuses non-Zeffy links; changes are logged |
| Audit trail | Usually needs a plugin | Built in, with old and new values |
