# Brand Guidelines — New Life Global (draft v0.1)

**Status:** Draft for owner approval. Colors marked *Official* were measured from the official logo file. Everything else is a *Proposal* and can be changed.

## 1. Logo

| Item | Finding | Source |
|---|---|---|
| Mark | Green cross set inside a green ring | NLBC logo [R9]; @newlifeglobalaz avatar [R10] |
| Wordmark | "New Life" in a bold transitional serif | [R9] |
| Global lockup | Mark + "New Life" with "GLOBAL" in spaced capitals beneath | Anniversary flyer [R12] |
| Reversed version | White logo exists for dark backgrounds | [R9b] |

**Rules**
- Never redraw, recolor, stretch or add effects to the logo. Use only files supplied by the church.
- **Blocking request:** the official "New Life GLOBAL" lockup as SVG (or high-res transparent PNG), in color and white versions.
- Until it arrives, development uses a clearly labelled placeholder slot, plus the reference NLBC PNG locally (never in production without approval).
- Clear space: at least the height of the cross on every side. Minimum size: 28 px tall for the mark only, 120 px wide for the lockup.

## 2. Color

### Official (measured from `NLC-Logo-3` PNG)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--nl-green` | **#065844** | Primary brand: wordmark green; links, primary buttons, kickers | 8.44:1 on white ✅ AAA |
| `--nl-leaf` | **#0F6B37** | Cross green; secondary accents, hover states, progress fills | 6.61:1 on white ✅ AA |

### Proposed supporting palette (derived from the brand greens, replacing ai.gov.rw's navy)

| Token | Hex | Role (ai.gov.rw equivalent) | Notes |
|---|---|---|---|
| `--nl-ink` | #032A20 | Dark sections, hero overlay, footer (= `--rw-ink`) | White on ink 15.5:1 |
| `--nl-paper` | #F6F4EE | Warm off-white alternating section background (= `--rw-paper`) | Warmer than ai.gov.rw's cool grey: welcoming, not governmental |
| `--nl-mist` | #EEF2EF | Hover backgrounds for cells | |
| `--nl-line` | #E3E6E2 | Hairline borders | |
| `--nl-body` | #3E4643 | Body text | 9.7:1 |
| `--nl-muted` | #5F6965 | Kickers, meta, captions | 5.7:1 on white, 5.2:1 on paper ✅ |
| `--nl-mint` | #9FC9B4 | Accent text and rules on dark ink | 8.5:1 on ink |
| `--nl-gold` | #D9B25C | **Optional** warm accent (appears on the anniversary flyer); only on dark backgrounds; sparing | 7.7:1 on ink. **Needs owner OK** |

**Not brand colors:** the purple of the program flyer, and the red/gold anniversary styling. These are per-event designs and will only appear inside event artwork.

## 3. Typography (proposal)

| Role | Font | Spec (desktop → mobile) | Rationale |
|---|---|---|---|
| Display / H1 | **Inter** 500 | clamp(2.9rem, 6.4vw, 6.5rem), line-height 1.0, tracking −0.028em | Mirrors the editorial confidence of ai.gov.rw |
| H2 | Inter 500 | clamp(1.9rem, 3.4vw, 3.4rem), line-height 1.06, tracking −0.022em | |
| H3 | Inter 500–600 | 1.6rem / 1.1rem | |
| Kicker label | Inter 700 | 0.6875rem, uppercase, tracking 0.2em, preceded by a 28 px rule in `--nl-leaf` | The ai.gov.rw "PARTNER WITH US" pattern |
| Index | Inter 600 tabular | 0.75rem, tracking 0.14em, `01 / 04` | |
| Body | Inter 400 | 1.0625rem / 1.7 | |
| Scripture & pull-quotes | **Newsreader** italic 400 | 1.5–2.25rem | One humane serif voice for Scripture. It echoes the serif "New Life" wordmark without imitating it |

Alternative: if the owner prefers continuity with newlifekigali.org, Poppins (headings) + Lato (body) can replace Inter. The design system tokens make this a one-line change.

## 4. Buttons
- **Primary:** solid `--nl-green`, white text, uppercase 13px/700/tracking 0.12em, 1rem × 1.75rem padding, square corners (radius 0–2px). On hover, a `--nl-leaf` fill rises from the bottom (0.5s ease-out-expo) and the arrow slides 4px.
- **Ghost on dark:** transparent with a 1px white/40% border; the border turns `--nl-mint` on hover.
- **Ink ghost on light:** transparent with a `--nl-ink`/28% border.
- **Text link:** green with an animated underline and an arrow that slides on hover.
- Focus: a 2px `--nl-leaf` outline with a 3px offset on all interactive elements.

## 5. Navigation
- Fixed header, transparent over the hero with white logo and links. After scrolling it becomes `rgba(255,255,255,.9)` with backdrop blur and a hairline bottom border, and the logo switches to color.
- Desktop: logo · Home, About, Ministries, Messages, Events, Gallery · outlined **Plan Your Visit** button (always visible).
- Active state: a 1px underline in `--nl-leaf` under the current item.
- ≤1024px: burger → full-screen drawer with large numbered links and Plan Your Visit at the bottom.

## 6. Imagery
- Real New Life people only, no stock photography. Large, single-subject or wide congregational shots.
- Treatment: slight desaturation (`saturate(.85)`), dark ink gradient overlays where text sits on images, slow 1.4s zoom on hover.
- Aspect ratios: hero 16:9 full-bleed; pathway cards ~4:5; page hero 4:3.4; gallery masonry.
- Every image needs alt text, a credit and a permission status (see [media-inventory.md](media-inventory.md)).

## 7. Spacing and layout
- Max width 1560px; side padding `clamp(1.25rem, 4vw, 4.5rem)`; section padding `clamp(5.5rem, 11vh, 9.5rem)`.
- Use hairline-bordered grids instead of shadowed cards. No gradients except image overlays.

## 8. Icons
- Lucide, 1.5px stroke, 20–24px, inheriting the text color. Arrows (→) are the main motif. No filled or colored icon sets.

## 9. Motion
- Easing: `cubic-bezier(.22,1,.36,1)` (out-expo) and `cubic-bezier(.45,0,.15,1)` (soft).
- Reveal: fade + 26px rise, 0.85s, staggered 80ms.
- Hero: 6.5s slow Ken Burns zoom per slide, progress segment fill, 1.05s slide transition.
- `prefers-reduced-motion`: all transforms off, content fully visible, autoplay paused.

## 10. Voice
Warm, invitational, scripture-anchored, international. Taken from the church's own words: "Worship • Grow • Serve", "A Place of Love • A Family of Faith • A Future of Hope", "there is a seat saved just for you" [R13][R23].

## 11. Update — 2026-11-20: hover accent (owner request)
On the owner's request, **hover and interaction states use ai.gov.rw's cyan** instead of green. The brand greens remain the base colours.

| Token | Hex | Use |
|---|---|---|
| `--nl-blue` | #00a1de | Button fill-on-hover, link and arrow hover, nav underline, focus borders on dark |
| `--nl-blue-ink` | #001b3d | Text on the cyan hover fill (white on cyan fails contrast; navy on cyan ≈ 6:1, as on ai.gov.rw) |
| `--nl-blue-mist` | #eaf4fb | Hover background of grid cells |

## 12. Update — 2026-11-20: full blue accent system (owner request)
The owner asked for the site to match ai.gov.rw consistently. **All accents are now blue**:

| Token | Hex | Use |
|---|---|---|
| `--nl-blue` | #00a1de | Kicker rules, hero progress bar, dots, hover fills, focus rings, accent text on dark sections |
| `--nl-blue-deep` | #003f82 | Solid buttons, text links, numbers and accent text on light backgrounds (10.3:1 on white) |
| `--nl-blue-ink` | #001b3d | Text on cyan fills |
| `--nl-mist` | #eef2f5 | Cool light surfaces (was green-tinted #eef2ef) |

**Green now appears only in:** the official New Life logo and "GLOBAL" lockup, and the very dark section / overlay colour `--nl-ink` #032a20. Verified by a computed-style scan of all 12 public pages.

## 13. Update — 2026-11-20: navy surfaces (owner request: "no green", footers included)
Dark surfaces and neutrals now use ai.gov.rw's values:

| Token | Was | Now |
|---|---|---|
| `--nl-ink` (hero overlay, dark bands, Rwanda section, invitation, **footer**, staff-login panel, browser theme colour) | #032a20 | **#001b3d** |
| `--nl-ink-2` | #04382b | #00275a |
| `--nl-paper` | #f6f4ee | #f6f8fa |
| `--nl-line` | #e3e6e2 | #e2e6ea |
| `--nl-body` | #3e4643 | #4c515a (8.0:1) |
| `--nl-muted` | #5f6965 | #5c636e (6.1:1) |
| Image overlay gradients | rgba(3,42,32,…) | rgba(0,27,61,…) / rgba(0,12,28,…) |

**Green remains only in the official New Life logo artwork** (header on light backgrounds; the footer logo is rendered white). A strict computed-style scan of all 13 public pages found no other green.
