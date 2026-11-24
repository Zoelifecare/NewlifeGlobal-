# Two repositories: admin and public website

| | Repository | Hosted on | Address |
|---|---|---|---|
| **Admin** (dashboard, forms, database rules) | `paroteen/anlmglobal` (this one) | Vercel | https://app.newlifeglobalaz.org |
| **Public website** (Home, About, Messages, Events, Give, …) | `paroteen/newlifeglobal-website` (private) | The church's WordPress, served by the plugin "New Life Global Website" | https://newlifeglobalaz.org |

There are no redirects between them. On `app.newlifeglobalaz.org`, any non-admin address simply shows the admin (`src/proxy.ts`).

## How content flows

```
staff save in /admin ─▶ admin asks GitHub to rebuild (src/lib/website-rebuild.ts)
                     ─▶ GitHub Actions builds the website from the published content
                     ─▶ sends it to WordPress (POST /wp-json/nlg/v1/deploy, with the deploy key)
                     ─▶ the plugin serves it on newlifeglobalaz.org
```

Changes appear in about 2–4 minutes. WordPress admin (`/wp-admin`) keeps working. Forms on the website post to this app (`/api/forms/*`, `/api/giving/*`); only newlifeglobalaz.org and www may do so (`src/lib/security/cors.ts`).

The plugin's page, **WordPress › Settings › New Life Website**, shows the current version, creates the deploy key, and can turn the website off in an emergency (WordPress pages show again). Its code is in the website repository under `wordpress-plugin/`.

## Setup checklist

1. **WordPress › Settings › New Life Website › Create deploy key.** Add it to the website repository's GitHub secrets as `WP_DEPLOY_KEY`.
2. **Website repository secrets:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as in Vercel). The workflow refuses to publish without them, so sample content never goes live.
3. **Vercel (this project) variables:** `WEBSITE_REPO=paroteen/newlifeglobal-website` and `WEBSITE_DEPLOY_TOKEN` (a fine-grained GitHub token for that repository only, permission "Contents: read and write").

## Optional: embedding admin content elsewhere

`/embed.js` and `/api/public/content` can show admin content (messages, events, giving, forms) on any other website:

```html
<script src="https://app.newlifeglobalaz.org/embed.js" defer></script>
<div data-nlg="sermons" data-limit="6"></div>
```
