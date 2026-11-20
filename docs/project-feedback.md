# Project Feedback: Round 2 (2026-11-20)

Source: owner feedback following review with Pastor Charles. This file records what was asked, what was found, and what was done.

## 1. Organizational identity correction

**Instruction:** New Life Global is a completely independent organization in the United States, with its own identity. It must not be presented as a branch of New Life Bible Church Kigali, a subsidiary of Africa New Life Ministries, or an extension of a Rwanda-based organization. No Rwanda comparisons, no imported Rwanda history, ministries or leadership stories, and no "25 years" narrative.

This **supersedes owner decision OD-1** ("branch in the US of Africa New Life").

### Conflicts found and corrected

| Where | Conflicting content | Action |
|---|---|---|
| Homepage hero slide 03 | "Global Mission: from Rwanda to the nations", Kigali founding story, 25-year thanksgiving video | Replaced with "Go & Make Disciples", using Matthew 28:19 (the church's Instagram bio verse) |
| Homepage stats | 2001 founding, "25 yrs of transforming lives", "19,000 students sponsored by Africa New Life" | Replaced with New Life Global's own facts: Sundays 3 PM, 4 weekly gatherings, Morning Glory 5 AM, 1st anniversary Dec 2026 |
| Homepage chapter 03 | New Life Bible Church Kigali vision, Rwanda history | Replaced with Matthew 28:19 |
| Homepage "One family, two continents" section | Chandler and Kigali comparison, ANLM timeline, Africa New Life link | Section removed (data and renderer) |
| About page | Rwanda story, NLBC Kigali mission/vision, ANLM statement of faith and values, "Our Rwanda Connection" | Rebuilt from the CMS: only approved New Life Global content is shown. Unconfirmed sections are hidden |
| Leadership bios | ANLM founder and Kigali lead-pastor biographies | Removed. Names and titles from the owner only; bios await confirmation |
| Footer | "Part of the Africa New Life family"; links to New Life Rwanda YouTube and Africa New Life | Removed |
| Structured data (SEO) | `parentOrganization: Africa New Life Ministries` | Removed |
| Visit page | "deep roots in Rwanda" | Removed; text now from the CMS |
| Gallery | Rwanda ministry album and thumbnails | Removed |
| Sermons | 7 Rwanda sermons by other preachers, plus the ANLM 25-years service | Removed (sermon rules below) |
| Hover worship clip | "The Courage To Care" (another preacher, Rwanda) | Replaced with a sermon by Pastor Charles |

Databases seeded before this correction are fixed with `supabase/identity-correction.sql` (tested, re-runnable).

### Kept, with reasons
- **The logo** (green cross and "New Life" wordmark): the church's own avatar and flyers use it. Replaceable in Church Identity & Settings › Church info.
- **Pastor Charles' sermons** from YouTube: allowed by sermon rule 1 ("wherever he preaches"). The preaching location is recorded internally but not shown publicly.
- **"Kinyarwanda" category label:** a language label on one of Pastor Charles' sermons, not an organizational claim.

## 2. Sermon publication rules (enforced in the database)
1. Pastor Charles' sermons may be published wherever he preached (leaders flagged `publish_sermons_anywhere`).
2. Other pastors and guests only when preached at the Arizona church (`preached_in_arizona`).
3. Rwanda sermons and unrelated sermons by other preachers are not published.
4. The preacher and the location must both be verified (`preacher_verified`, `location_verified`).
5. Unverified sermons can only be saved as drafts.

A trigger rejects any insert or update that breaks these rules, whatever the caller. Covered by 4 tests.

## 3. Design feedback
- **ai.gov.rw (primary):** reinforced its numbered dropdown panel ("Opportunity Portfolio" mega menu) as the main navigation, with numbered items, descriptions and hover spotlight. The numbered section heads, chapter slider, hairline grids and sticky numbered table of contents remain.
- **Bethel (secondary, not giving):** grouped navigation (About ▸ Story, Mission & Vision, Beliefs, Leadership; Media ▸ Messages, Gallery; Connect ▸ Visit, Prayer, Contact); Leadership with a featured lead pastor followed by a grid; Plan Your Visit as a numbered checklist with an FAQ, which fills the logistics gap found on Bethel's own page.
- The Give button is in the header, the mobile drawer and the footer. The Give page is New Life Global's own design (see §5).

## 4. Admin as a complete CMS
See [admin-dashboard.md](admin-dashboard.md). New: Church Identity & Settings (approval workflow, versions, restore), giving, navigation and page visibility, visit FAQ, logo, featured ministries, ministry-manager events, album descriptions and visibility, sermon verification fields, audit before/after values.

## 5. Giving
The Give page and Give buttons exist. No payment provider has been chosen, so the page states that online giving is coming soon and offers the contact form. Administrators add approved giving methods (https links only) in Church Identity & Settings › Giving. No payment processing, no fake success screens.

## 6. Items requiring Pastor Charles' information or approval
| Item | Where it goes |
|---|---|
| Official church name (the website uses **New Life Global**, as on the church's Instagram and flyers; the feedback calls it "ANLM Global") | Identity › Church info |
| Our Story | Identity › Church content (approval) |
| Mission, Vision | Identity › Church content (approval) |
| Core Values (a draft "Worship, Grow, Serve" from the church program is waiting) | Identity › Church content (approval) |
| What We Believe | Identity › Church content (approval) |
| Leader bios, photos and exact titles (Augustine Ndemezo's title in particular) | Admin › Leadership |
| Giving provider and approved links | Identity › Giving |
| Public email and phone | Identity › Church info |
| Night of Worship location policy (Gilbert, currently "contact us") | Identity › Church info › Service times |
| Morning Glory format (in person or online) | Identity › Church info › Service times |
| Whether the New Life cross logo stays, or a New Life Global specific logo is used | Identity › Church info › Logo |
| Verification of preaching locations for any non-Charles sermon before it is published | Admin › Sermons |
