# Media Inventory

**Rule:** no media is copied into the site until permission is recorded here. Until then, Instagram content is shown only through **official embeds**, and every image slot uses a labelled, admin-replaceable placeholder.

Status legend: 🟢 cleared for use · 🟡 embed-only (platform embed, no re-hosting) · 🔴 needs permission / originals · ⚪ reference only (never published)

## 1. New Life Global (USA) — Instagram @newlifeglobalaz

| ID | Type | Date | Content | URL | Suggested placement | Status |
|---|---|---|---|---|---|---|
| NLG-01 | Carousel (≥8 photos) | 11 Jun 2026 | Refresh Women 2026 conference | https://www.instagram.com/p/DZdhdFGklcE/ | Gallery › Conferences; Women's ministry; homepage 02 | 🟡 / 🔴 originals requested |
| NLG-02 | Flyer | 31 Oct 2026 | 1st Anniversary — Charles & Florence Mugisha | https://www.instagram.com/p/DfKlx2vOXFA/ | Events (Dec 12–13) | 🟡 |
| NLG-03 | Flyer | 15 Jul 2026 | Church Program (weekly schedule) | https://www.instagram.com/p/Da07hfnSJe-/ | Reference for Plan Your Visit | ⚪ (data only) |
| NLG-04 | Reel | 23 Aug 2026 | Sunday worship and fellowship | https://www.instagram.com/reel/DcaCLRBOIIi/ | Hero video candidate (needs original file) | 🔴 |
| NLG-05 | Photo | 12 Aug 2026 | Serving the Lord | https://www.instagram.com/p/Db9jqlBlA-2/ | Serve / community | 🟡 |
| NLG-06 | Reel | 2 Jul 2026 | Sunday School | https://www.instagram.com/reel/DaTGyC9uiwW/ | Children's ministry | 🔴 (minors — explicit parental consent needed) |
| NLG-07 | Flyer | 1 Jul 2026 | Night of Prayer, Pastor Edmond Kivuye | https://www.instagram.com/p/DaQzfhKS0UQ/ | Past events | 🟡 |
| NLG-08 | Reel | 16 Jun 2026 | "Sundays with us in Chandler" | https://www.instagram.com/reel/DZqcJlTS2u-/ | Plan Your Visit | 🟡 |
| NLG-09 | Reel | 28/29 May 2026 | Refresh Women promo | https://www.instagram.com/reel/DY6dF-BuxuT/ | Past events | 🟡 |
| NLG-10 | Reel | 24 May 2026 | Refresh Women save the date | https://www.instagram.com/reel/DYvv9hAuI2b/ | Past events | 🟡 |
| NLG-11 | Photo | 5 Sep 2026 | "Seat saved for you" | https://www.instagram.com/p/Dc7f_W0u-5_/ | Invitation section | 🟡 |
| NLG-12 | Photo | 26 Jun 2026 | Church family invitation | https://www.instagram.com/p/DaD-cxNEpRS/ | Invitation section | 🟡 |
| NLG-13 | Photo | 15 Jul 2026 | (pinned, "🙏🙏") | https://www.instagram.com/p/Da07hfnSJe-/ | — | ⚪ |

The account has 37 posts; logged-out viewing showed the 12 most recent. Ask the owner for the full archive and original files.

## 2. New Life Bible Church Rwanda — newlifekigali.org (© ANLM)

| ID | Content | URL | Suggested placement | Status |
|---|---|---|---|---|
| RW-01 | Welcome/hero worship photo | https://newlifekigali.org/wp-content/uploads/2026/09/55453738580_b133ab8a78_o-1024x683.jpg | Homepage 03 Global Mission | 🔴 ask ANLM |
| RW-02–05 | About Us photos | https://newlifekigali.org/wp-content/uploads/2022/04/64WZ23201-683x1024.jpg · /2022/04/64WZ14841-683x1024.jpg · /2022/07/64WZ9937.jpg · /2022/07/64WZ1655-2.jpg | Rwanda connection | 🔴 |
| RW-06–09 | Our Story photos | https://newlifekigali.org/wp-content/uploads/2025/08/2COVERIMG_8957-Edit-683x1024.jpg · /2025/08/DM4T1762-683x1024.jpg · /2025/08/BEN04675-683x1024.jpg · /2025/08/DM4T3884-1024x639.jpg | Rwanda connection | 🔴 |
| RW-10 | Pastor Charles Mugisha portrait | https://newlifekigali.org/wp-content/uploads/2022/07/64WZ4087yy.jpg | Leadership | 🔴 |
| RW-11 | Flickr albums | https://www.flickr.com/photos/197782765@N05/albums | Gallery › Rwanda ministry | 🔴 check per-album license |
| RW-12 | YouTube sermons | https://www.youtube.com/channel/UCqGo37aKTm1ooG2t1xEaiiQ | Messages (YouTube embeds) | 🟡 embeds allowed by platform |

## 3. Africa New Life Ministries — africanewlife.org

| ID | Content | URL | Status |
|---|---|---|---|
| AN-01 | Charles Mugisha portrait | https://www.africanewlife.org/wp-content/uploads/2023/02/1-scaled.jpg | 🔴 |
| AN-02 | Charles Mugisha (staff page) | https://www.africanewlife.org/wp-content/uploads/2020/02/F14A9423-e1581201520717.jpg | 🔴 |
| AN-03 | Florence Mugisha portrait | https://www.africanewlife.org/wp-content/uploads/2021/01/Florence.jpg | 🔴 |
| AN-04 | Rwanda map illustration (SVG) | https://www.africanewlife.org/wp-content/themes/africanewlife/pivot-blocks/rwanda_map/images/Map_child-lines.svg | 🔴 (useful for Global Mission) |
| AN-05 | 2026 Annual report infographic | https://www.africanewlife.org/wp-content/uploads/2026/03/ANLM_2026_AnnualReport_Infographic_v3-scaled.png | ⚪ data source |

## 4. Logos (stored locally for brand reference only)

| File | Source | Status |
|---|---|---|
| `docs/research/assets/logos/nlc-logo-color.png` | R9 | ⚪ reference — official files requested |
| `docs/research/assets/logos/nlc-logo-white.png` | R9b | ⚪ reference |
| `docs/research/assets/logos/anlm-logo.svg` | R9c | ⚪ reference |

## 5. Planned production media structure
In Supabase Storage. Every asset gets a `media_assets` row with `source_url`, `credit`, `license`, `permission_status`, `permission_note` and `uploaded_by`.

```
media/
  brand/        logos, favicons, og images
  hero/         homepage hero photos/videos
  worship/  services/  conferences/  youth/  children/
  community/  rwanda-ministry/  celebrations/
  leadership/   portraits
  sermons/      thumbnails, audio
  events/       flyers, photos
```

## 6. Permission requests to send (owner action)
1. New Life Global: original photos and videos (especially Sunday worship, Refresh Women, the Anniversary); photographer credits; consent policy for images of children.
2. ANLM / New Life Rwanda: permission to use selected Kigali and ANLM photos and the Rwanda map, with the required credit line.
3. Personal accounts of Pastors Charles & Florence Mugisha: approved portraits.

---

## 7. Update — 2026-11-19: media now in use (owner decision OD-6)

The owner approved using the photos on @newlifeglobalaz and videos from New Life Bible Church Rwanda. Status for the items below is now **🟢 owner approved**.

**Downloaded to `public/media/instagram/`** by `scripts/download-media.mjs` from `scripts/media-manifest.json`:

| File | Source post | Used on |
|---|---|---|
| refresh-women-2026-01 … -11.jpg | DZdhdFGklcE (11-photo carousel) | Hero slides 01–02, chapter 01, women's ministry, invitation, gallery, auth screen |
| sunday-seat-saved.jpg | Dc7f_W0u-5_ (Pastor Fred Katagwa preaching in Chandler) | Plan Your Visit hero |
| church-family.jpg | DaD-cxNEpRS | Chapter 02 |
| serving-team.jpg | Db9jqlBlA-2 | Serve Team ministry |
| sunday-school-reel.jpg | DaTGyC9uiwW (reel cover) | Children ministry — **cover frame only; confirm parents are comfortable with children appearing (G3)** |
| night-of-prayer-flyer.jpg | DaQzfhKS0UQ | Prayer ministry, Night of Prayer event |
| anniversary-2026-flyer.jpg | DfKlx2vOXFA | 1st Anniversary event, homepage pathway |
| church-program-flyer.jpg | Da07hfnSJe- | Reference only |
| *-reel.jpg (fellowship, Chandler, promo, save-date) | various reels | Gallery |

**Brand:** `public/media/brand/nlc-logo-color.png`, `nlc-logo-white.png` (OD-2).

**Video (YouTube embeds and thumbnails, New Life Rwanda channel):**

| Video | ID | Used on |
|---|---|---|
| The Courage To Care — Dr. Nathan Chiroma | 8mEJiF-7SU8 | **Hover-play clip** in chapter 01 (OD-8); featured message |
| 25 Years of Transforming Lives — Thanksgiving Service | 9-581YAL-Ys | Hero slide 03, Global section (hover-play), About › Rwanda |
| 10 further sermons | see `src/lib/content/seed.ts` | Messages library |

All embeds use `youtube-nocookie.com` and load only after the visitor hovers or clicks.
