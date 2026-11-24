# Giving

How people give to New Life Global, and how the finance team keeps track.

## Ways to give (Give page)

| Method | How it works | Where it is managed |
|---|---|---|
| **Card · Apple Pay · Google Pay** | Opens the church's **Zeffy** form in a popup on the Give page. One-time or monthly, with an automatic tax receipt by email. Zeffy pays out to the church bank account **every Monday**. | Zeffy dashboard (form); Admin › Giving › Payment methods (link) |
| **Zelle** | The page shows **602-879-9499**; "Pay with Zelle in my bank app" copies the number and opens the giver's bank. | Admin › Giving › Payment methods |
| **Cash App** | "Open Cash App" opens **$NewLifeGlobalGive** in the app (or the web), with the amount pre-filled. | Admin › Giving › Payment methods |
| **Bank transfer** | "Choose my bank" opens the giver's bank; account details are shared on request. | Admin › Giving › Payment methods |
| **Cash Drop** | Instructions for giving cash at Sunday Service. | Admin › Giving › Payment methods |
| **Pledge** | A commitment to give later or over time; never counted as money received. | Admin › Giving › Pledges |

## Links and QR codes

| Use | Link |
|---|---|
| Card form only (best for flyers, texts, WhatsApp) | https://www.zeffy.com/en-US/donation-form/give-to-new-life-global |
| Give page with the card popup already open | https://newlifeglobal.vercel.app/give#card |
| Full Give page (all methods) | https://newlifeglobal.vercel.app/give |

The QR codes in `public/media/giving/` (`give-qr.png`, `give-qr.svg`, and the flyer graphic `give-flyer-qr.png`) open the **Zeffy form directly**, so printed flyers keep working even if the website's address changes.

To make a new QR code, any QR generator works: point it at the Zeffy link above.

## The finance dashboard (Admin › Giving)

Three kinds of money are always kept separate:

1. **Confirmed donations:** money actually received. This is the only revenue figure.
2. **Pledges:** promises to give. Status moves New → Acknowledged → Partially fulfilled → Fulfilled (or Past due / Cancelled), calculated from the donations linked to the pledge.
3. **Pending confirmations:** a donor says "I sent it" (Zelle, Cash App, bank, Cash Drop). Finance checks the bank or app, then clicks **Verify received** (enter the real amount) or **Mark as not received**.

Other tabs: Cash Drop, Recurring, Payment methods, Designations, Bank accounts (last 4 digits only), Notifications, Reports and CSV exports.

**Card gifts made through Zeffy** are recorded in Zeffy (Zeffy › Payments). To include them in the church's records, export them from Zeffy, or enter totals with **Record a donation**.

## Notifications

Admin › Giving › Notifications sets who on the finance team is emailed about pledges and confirmations, and whether donors get a confirmation email. Sending email requires `RESEND_API_KEY` and `EMAIL_FROM` in Vercel; until then, notifications are logged and can be resent.

## Security

- The card link can only be a `zeffy.com` address (enforced by the database).
- This website never sees or stores card or bank numbers.
- Every change to payment methods is in the audit log.

See [security.md](security.md).
