# Design Direction — New Life Global

**Primary reference:** https://ai.gov.rw/, inspected live on 2026-11-19 (desktop 1440 px, ~800 px tablet-width, mobile 375 px emulation; DOM and CSS analysis). Brand is New Life's own; see [brand-guidelines.md](research/brand-guidelines.md).

> **Inspection limits (stated honestly):** hero, header and section-intro screenshots were captured at desktop width. The app's browser pane was then hidden, so screenshots of later sections and of the mobile layout could not render. Those were documented from the live DOM, computed styles and stylesheet rules. Fresh visual screenshots will be taken at the start of Phase 3.

---

## 1. What ai.gov.rw actually does (observed)

| # | Pattern | How it is built (measured) |
|---|---|---|
| P1 | **Transparent → frosted header** | `position:fixed`; on scroll `.is-solid` → `rgba(255,255,255,.9)` + `backdrop-filter: saturate(1.4) blur(14px)` + hairline border; 0.45s transition. Nav: 4 links (one is a mega-dropdown of 8 numbered items) + an outlined CTA "Invest in AI in Rwanda" |
| P2 | **Hero = three numbered chapters** | A 750 px full-bleed slider with 3 slides. Bottom bar shows caption tabs "01 · AI ENABLED DEVELOPMENT / 02 · … / 03 · …" with subtitles, a segmented progress bar filling in the accent color, a `01 / 03` counter and ←/→ buttons. 1.05s slide easing; 6.5s slow zoom on media; drag/swipe; "SCROLL" cue. Headline 6.8rem/500/−0.028em; two CTAs (solid + ghost) with long arrows |
| P3 | **Stats strip** | Four hairline-divided cells with large animated counters and small captions |
| P4 | **Numbered section heads** | Kicker (uppercase 11px, tracking .2em, 28px accent rule) → H2 → lead paragraph on the left; `01 / 04` index bottom-right. Only 4 major sections are numbered on the homepage, so visitors always know where they are |
| P5 | **Hairline grid cells** | Audience (5 columns) and "Six advantages" (3×2) grids built from 1px borders, numbered 01–06, with a hover tint. No shadows |
| P6 | **Split CTA band** | Dark ink band between sections: kicker + statement on the left, action on the right |
| P7 | **Pathway cards** | Two large image cards ("PATHWAY 01 / 02"): dark gradient over the photo, index in accent color, H2, italic question, tag chips, and a footer row with an arrow that slides 8px; the image zooms 1.07 on hover |
| P8 | **Numbered rows list** | Rows of "01 Title — description →": hover indents the row and shifts the arrow |
| P9 | **Closing CTA + footer** | Image-backed final invitation; footer has a brand column (4fr) plus 4 link columns, uppercase column heads, and a slim legal row |
| P10 | **Inner-page template** | Page hero (7/5 grid: title + meta chips │ image with badge), then a **sticky numbered TOC** (01–07) beside numbered content blocks, then a "related" chip band and a CTA band |
| P11 | **Motion** | `.rw-reveal` fade + 26px rise; clip-path reveals; out-expo easing; complete `prefers-reduced-motion` overrides |
| P12 | **Responsive** | Breakpoints at 1180 / 1024 / 720 / 600 / 480. Burger + full-screen drawer ≤1024; section heads stack; all grids collapse to one column at 375; no horizontal overflow; hero headline ≈32px on mobile |

**What we deliberately do NOT take:** navy/cyan palette, geometric government logo glyphs, investment-oriented wording, the mega-menu (the church needs a flatter menu).

---

## 2. Translation to New Life Global — homepage

```
┌──────────────────────────────────────────────────────────────────────┐
│ [New Life GLOBAL logo]  Home About Ministries Messages Events   [PLAN YOUR VISIT] │  P1
├──────────────────────────────────────────────────────────────────────┤
│ HERO SLIDER (authentic worship photo/video, ink overlay)            │  P2
│  "A Place of Love. A Family of Faith."   (headline: owner-editable) │
│  Sundays · 3:00 PM · Chandler, AZ                                   │
│  [PLAN YOUR VISIT →]   [EXPLORE NEW LIFE →]                         │
│ ─────────────────────────────────────────────────────────────────── │
│ 01 · FAITH & WORSHIP │ 02 · COMMUNITY & DISCIPLESHIP │ 03 · GLOBAL MISSION   01/03 ← → │
└──────────────────────────────────────────────────────────────────────┘
│ SERVICE STRIP: Sunday 3–5 PM │ Night Prayer 1st Fri │ Chandler, AZ │ Part of the New Life family since 2001 │  P3
│                                                                       │
│ —— WELCOME                                                    01 / 04 │  P4
│ Three chapters. One story of new life.                                │
│  ┌ 01 Faith & Worship ┐ ┌ 02 Community & Discipleship ┐ ┌ 03 Global Mission ┐  editorial
│  photo + text, alternating left/right, sticky chapter indicator      │  P10-like
│                                                                       │
│ ▓▓ INK BAND: "There's a seat saved for you." [PLAN YOUR VISIT →] ▓▓   │  P6
│                                                                       │
│ —— DISCOVER NEW LIFE                                          02 / 04 │  P5 grid
│  01 About │ 02 Ministries │ 03 Messages │ 04 Events │ 05 Leadership │ 06 Prayer │ 07 Visit
│                                                                       │
│ —— MESSAGES & GATHERINGS                                      03 / 04 │  P7
│  [PATHWAY 01 Latest message — video card] [PATHWAY 02 Upcoming events]│
│  Ministry highlights row (P8 numbered rows)                           │
│                                                                       │
│ —— ONE FAMILY, TWO CONTINENTS                                 04 / 04 │
│  Chandler ⟷ Kigali: verified facts, Rwanda photography, ANLM credit   │
│  (Testimonies block appears only when approved entries exist)        │
│                                                                       │
│ FINAL INVITATION (image-backed, P9)  "Come home to New Life."         │
│ FOOTER: brand+service times │ Visit │ Ministries │ Connect │ Contact  │
└──────────────────────────────────────────────────────────────────────┘
```

### The three chapters (core storytelling)
| Chapter | Message | Verified content we can use now | Needs owner |
|---|---|---|---|
| **01 — Faith & Worship** | Bible-centered worship, prayer, teaching | Sunday service; Night Prayer; Night of Worship; Morning Glory; Matthew 28:19 | Worship photos/video; statement of faith decision |
| **02 — Community & Discipleship** | Family, growth, serving | Sunday School; Refresh Women; "Worship • Grow • Serve"; "church family" | Small groups, other ministries, photos |
| **03 — Global Mission** | Part of a story that began in Rwanda in 2001 | Founders Charles & Florence Mugisha; NLBC Kigali (2003); ANLM's 25 years; 12+ churches across Rwanda (with source) | Approved relationship wording; Rwanda photo permission |

In the hero the three chapters are slides, mirroring P2. Further down they are expanded as editorial blocks, and the bottom-bar captions jump to them.

---

## 3. Inner pages (P10 template)

| Page | Page hero | Numbered TOC sections |
|---|---|---|
| About | "Our Story" + photo | 01 Our Story · 02 Mission · 03 Vision · 04 What We Believe · 05 Our Values · 06 Leadership · 07 Our Rwanda Connection |
| Ministry detail | Ministry name + photo + meta chips (day/time) | 01 About · 02 When we meet · 03 Activities · 04 Leader · 05 Get involved |
| Plan Your Visit | "We saved you a seat" | 01 When · 02 Where (map) · 03 What to expect · 04 Kids · 05 Ask us anything (form) |
| Messages | Featured sermon player | Filters (series, speaker, scripture, category) → grid → detail with related |
| Events | Next event feature | Upcoming list (dated rows, P8) · Past events · Detail page |
| Gallery | Category tabs | Masonry grid + accessible lightbox |
| Prayer | Quiet, minimal page; confidentiality promise up front | Form only |
| Contact | Split: details │ form | Map, socials |

---

## 4. Responsive plan
- **≥1180:** full layouts as above.
- **1024–1180:** grids drop to 3 columns; footer becomes 2 columns.
- **≤1024:** burger drawer; pathway cards stack; TOC becomes a horizontal scrollable chip bar at the top of inner pages.
- **≤720:** single column; hero captions show only the active chapter with the progress bar; the stats strip becomes 2×2.
- **375:** 16px gutters, headline ≈2.1rem, sticky bottom "Plan Your Visit" bar (a church-specific addition that keeps the main action reachable).

## 5. Next design steps (Phase 3, after owner answers)
1. Re-capture ai.gov.rw screenshots (desktop/tablet/mobile) into `docs/research/screenshots/`.
2. Build the design tokens and a homepage prototype in the real Next.js codebase (no throwaway Figma), at desktop and mobile.
3. Compare it side by side with ai.gov.rw and refine.
