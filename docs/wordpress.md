# Domains, the public website and WordPress

## How it is set up

| Address | What it shows |
|---|---|
| **https://newlifeglobalaz.org** | The public website: this app's own design (Home, About, Messages, Events, Give, …) |
| **https://app.newlifeglobalaz.org/admin** | The church admin. This domain serves **only** the admin; any other page on it is sent to newlifeglobalaz.org |
| https://newlifeglobal.vercel.app | Same public website (Vercel's own address) |

Staff add and edit everything in the admin, and it appears on the public website automatically.

The routing lives in `src/proxy.ts` and is driven by two Vercel variables:

- `NEXT_PUBLIC_SITE_URL=https://app.newlifeglobalaz.org`: the admin address (sign-in links, staff emails). `ADMIN_URL` can override it.
- `PUBLIC_WEBSITE_URL=https://newlifeglobalaz.org`: the public address (canonical links, sitemap). `/admin` on any other address redirects to the admin address.

## DNS (Namecheap)

For newlifeglobalaz.org to show this website, these records are needed (from Vercel › Domains):

| Type | Host | Value |
|---|---|---|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `e486c589cb752c63.vercel-dns-017.com.` |
| CNAME | `app` | `e486c589cb752c63.vercel-dns-017.com.` (already in place, pointing to `newlifeglobal.vercel.app`, which also works) |

Email (MX) records are not affected; leave them exactly as they are.

## WordPress, until the DNS change

Until the `@` and `www` records above point to Vercel, newlifeglobalaz.org still reaches the WordPress server. In the meantime, a small script in the WordPress header (Appearance › Editor › Header, a Custom HTML block with `id="nlg-forward"`) sends every visitor to the same page on https://newlifeglobal.vercel.app. Once DNS points to Vercel, WordPress is no longer used for the website; the script can then be removed.

## Embedding admin content elsewhere (optional)

`/embed.js` and `/api/public/content` can show admin content (messages, events, giving, forms) on any other website:

```html
<script src="https://app.newlifeglobalaz.org/embed.js" defer></script>
<div data-nlg="sermons" data-limit="6"></div>
```

Sections: `announcements`, `latest-sermon`, `sermons`, `events` (`data-when="upcoming|past|all"`), `ministries`, `leaders`, `gallery`, `services`, `contact`, `giving`, and the forms `form-contact`, `form-prayer`, `form-visit`, `form-newsletter`, `form-pledge`, `form-confirmation` (submissions go to the admin). Only newlifeglobalaz.org and www may post forms (`src/lib/security/cors.ts`; more via `PUBLIC_FORM_ORIGINS`).
