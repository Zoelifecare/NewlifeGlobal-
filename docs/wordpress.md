# Two repositories: admin and public website

| | Repository | Hosted on | Address |
|---|---|---|---|
| **Admin** (dashboard, forms, database rules) | `paroteen/anlmglobal` (this one) | Vercel | https://app.newlifeglobalaz.org |
| **Public website** (Home, About, Messages, Events, Give, …) | `paroteen/newlifeglobal-website` (private) | The church's web hosting (where WordPress is) | https://newlifeglobalaz.org |

There are no redirects between them. On `app.newlifeglobalaz.org`, any non-admin address simply shows the admin (`src/proxy.ts`).

## How content flows

```
staff save in /admin ─▶ admin asks GitHub to rebuild (src/lib/website-rebuild.ts)
                     ─▶ GitHub Actions builds the website from the published content
                     ─▶ uploads it to the hosting (newlifeglobalaz.org)
```

Changes appear in about 2–4 minutes. Forms on the website post to this app (`/api/forms/*`, `/api/giving/*`); only newlifeglobalaz.org and www may do so (`src/lib/security/cors.ts`).

## Setup checklist

1. **Website repository secrets** (GitHub › newlifeglobal-website › Settings › Secrets and variables › Actions):
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as in Vercel)
   - hosting upload: `DEPLOY_PROTOCOL` (`sftp` or `ftp`), `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_PATH` (e.g. `public_html`), optional `DEPLOY_PORT`
2. **Vercel (this project) variables:** `WEBSITE_REPO=paroteen/newlifeglobal-website` and `WEBSITE_DEPLOY_TOKEN` (a fine-grained GitHub token for that repository only, permission "Contents: read and write").
3. **Hosting, once:** add `DirectoryIndex index.html index.php` as the first line of the site folder's `.htaccess`, so the website's home page is served instead of WordPress's.

Until step 1's hosting secrets exist, each run still builds the site and keeps it as a downloadable artifact named `website`.

## Optional: embedding admin content elsewhere

`/embed.js` and `/api/public/content` can show admin content (messages, events, giving, forms) on any other website:

```html
<script src="https://app.newlifeglobalaz.org/embed.js" defer></script>
<div data-nlg="sermons" data-limit="6"></div>
```
