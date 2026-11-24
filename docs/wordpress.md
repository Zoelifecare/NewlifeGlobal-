# The public website on WordPress

The public website lives on **WordPress at https://newlifeglobalaz.org**.
This app (**https://app.newlifeglobalaz.org**) now serves only:

- **`/admin`**: where staff add and edit everything;
- the **form endpoints** the WordPress pages post to (`/api/forms/*`, `/api/giving/*`);
- the **live content feed** (`/api/public/content`) and **`/embed.js`**, which put admin content on WordPress pages.

Anyone who opens one of the app's old public pages (`/`, `/about`, `/give`, …) is redirected to the same page on WordPress. This is switched on by the Vercel variable `PUBLIC_WEBSITE_URL=https://newlifeglobalaz.org`; remove the variable and redeploy to turn the redirect off.

## What is edited where

| What | Where to edit | How it reaches WordPress |
|---|---|---|
| Messages (sermons) | Admin › Sermons | Live, within about a minute |
| Events | Admin › Events | Live |
| Ministries | Admin › Ministries | Live |
| Leadership | Admin › Leadership | Live |
| Gallery photos | Admin › Gallery | Live |
| Announcements | Admin › Announcements | Live (top of the homepage) |
| Service times, phone, address, social links | Admin › Settings | Live |
| Giving methods (Zeffy card form, Zelle, Cash App, Cash Drop) | Admin › Giving › Payment methods | Live (Give page) |
| Page wording, headings, hero photos, menu, footer | WordPress › Pages / Appearance › Editor | Directly in WordPress |

Form submissions from WordPress (contact, prayer, plan a visit, newsletter, pledges, "I sent my gift") are saved into the admin exactly like before, with the same spam protection, rate limits and database rules.

## How a live section works

Each live section on a WordPress page is a **Custom HTML** block like this:

```html
<script src="https://app.newlifeglobalaz.org/embed.js" defer></script>
<div data-nlg="sermons" data-limit="6"></div>
```

Available sections (`data-nlg`):

| Value | Shows |
|---|---|
| `announcements` | Current announcements |
| `latest-sermon` | The featured (or newest) message with its video |
| `sermons` | All messages (`data-limit`, `data-category` optional) |
| `events` | Events: `data-when="upcoming"` (default), `"past"` or `"all"`; `data-limit` optional |
| `ministries` | Ministry cards |
| `leaders` | Leadership cards |
| `gallery` | Photo grid (`data-limit` optional) |
| `services` | Service times |
| `contact` | Phone, address, email, social links |
| `giving` | The Zeffy card form plus Zelle, Cash App and other methods |
| `form-contact`, `form-prayer`, `form-visit`, `form-newsletter`, `form-pledge`, `form-confirmation` | Forms that save into the admin |

To add a section to any WordPress page: add a **Custom HTML** block and paste the two lines above with the section you want.

## Security

- Only `https://newlifeglobalaz.org` and `https://www.newlifeglobalaz.org` may post to the form endpoints (see `src/lib/security/cors.ts`; extra origins via `PUBLIC_FORM_ORIGINS`). Other websites are refused.
- The content feed contains published content only, read with the public key under Row Level Security. Nothing private (messages, prayer requests, donations, users) is ever included.
- The card form is Zeffy's own page in a frame; neither WordPress nor this app sees card numbers. The card link can still only be a `zeffy.com` address.
- Keep WordPress, its theme and its plugins updated, and keep the number of WordPress administrators small. The church's data is not stored in WordPress.

## Images

Hero photos on WordPress pages are in the WordPress Media Library. Photos for messages, events, ministries, leaders and the gallery come from the admin.
