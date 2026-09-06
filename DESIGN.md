---
name: Dragon News
description: A 1913 broadsheet printed by a 2026 machine. Student newspaper of Round Rock High School.
colors:
  maroon: "#6B0F1A"
  maroon-deep: "#3F0A12"
  maroon-ink: "#521018"
  maroon-tint: "#EBD9D9"
  press: "#17110F"
  ink: "#1A1412"
  ink-2: "#4B403B"
  ink-3: "#7A6C65"
  newsprint: "#F3EDE2"
  newsprint-2: "#EAE2D3"
  newsprint-3: "#E4DCCB"
  sheet: "#F8F4EB"
  hairline: "#CFC5B2"
  hairline-2: "#B9AD97"
  registration-cyan: "#0FA3B1"
  phosphor-gold: "#D4A72C"
  danger: "#A32D2D"
typography:
  nameplate:
    fontFamily: "Grenze Gotisch, UnifrakturCook, serif"
    fontSize: "clamp(3.4rem, 10vw, 8.6rem)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  display:
    fontFamily: "Bodoni Moda, Didot, serif"
    fontSize: "clamp(2.4rem, 1.8rem + 3vw, 4.4rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Bodoni Moda, Didot, serif"
    fontSize: "clamp(1.3rem, 1.15rem + 0.7vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.012em"
  dek:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.3rem, 1.15rem + 0.7vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.08rem, 1rem + 0.35vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  wire:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  hair: "2px"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "3rem"
  xl: "4.5rem"
  xxl: "7rem"
  gutter: "clamp(16px, 4vw, 48px)"
components:
  button-primary:
    backgroundColor: "{colors.maroon}"
    textColor: "{colors.newsprint}"
    typography: "{typography.wire}"
    rounded: "{rounded.hair}"
    padding: "0 1.25rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.maroon-ink}"
  button-paper:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.press}"
    typography: "{typography.wire}"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.maroon}"
    typography: "{typography.wire}"
    height: "44px"
  rail:
    backgroundColor: "{colors.press}"
    textColor: "{colors.newsprint}"
    typography: "{typography.wire}"
    height: "46px"
  section-head:
    backgroundColor: "{colors.maroon}"
    textColor: "{colors.newsprint}"
    typography: "{typography.wire}"
    padding: "0.45rem 0.7rem"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "clamp(20px, 4vw, 56px)"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.hair}"
    padding: "0.7rem 0.8rem"
    height: "44px"
---

# Dragon News design system

## Overview

Dragon News is a 1913 broadsheet printed by a 2026 machine. The bones are hot-metal newspaper: a blackletter nameplate, Didone headlines, a serif text face, double rules, column rules, drop caps, halftone photographs on newsprint. The machine layer is monospace and cyan: a wire strip with a live press clock, a headline crawl built as a broadcast lower-third, registration crop marks, and a halftone that is computed live on a canvas. Every "tech" element is something a newsroom really has. Persuade mode on the home page, Read mode on the paper and article pages, Operate mode in the newsroom.

## Colors

- **Newsprint** (`#F3EDE2`) is the ground of every public page; **sheet** (`#F8F4EB`) is the printed page lifted off it with a soft offset shadow. **Newsprint-2/3** are secondary grounds and rules.
- **Dragon maroon** (`#6B0F1A`) is the brand ink and commits at region scale: section bars, the sections strip, the archive year bars, primary buttons, links, the lead rules. **Maroon-deep** is the dark end of the halftone; **maroon-ink** is hover.
- **Press black** (`#17110F`) owns the dark surfaces: the hero, the nav rail, the newsroom rail, the footer, the editor's crew card. Body text is **ink**, secondary **ink-2**, metadata **ink-3**.
- **Registration cyan** (`#0FA3B1`) is the machine accent and stays under 2% of any screen: crop marks, the live dot, focus rings, the rail's active underline, footer column labels.
- **Phosphor gold** (`#D4A72C`) is reserved for the seal, the italic "news" in the hero, the editor card avatar and the "needs revision" status.
- Contrast: body ink on newsprint 14:1; ink-3 on newsprint 4.6:1; newsprint on maroon 8.7:1; cyan is never used for running text.

## Typography

- **Grenze Gotisch** is the nameplate and nothing else (masthead, rail brand, footer, newsroom rail). Blackletter is the American newspaper nameplate vernacular; it never sets running text or headlines.
- **Bodoni Moda** sets every headline, deck-level title and large numeral at optical size 96, weight 600, tight negative tracking, leading 0.9–1.1. Italic weight 500 for pull quotes.
- **Source Serif 4** sets body copy (1.65 leading, 68ch measure, `text-wrap: pretty`), deks in italic at a larger optical size, and form inputs.
- **Martian Mono** is the wire layer: folio line, datelines, bylines, kickers-as-section-heads, the crawl, the clock, statuses, tables, labels and the whole newsroom UI. Uppercase with 0.10–0.18em tracking at 0.66–0.74rem; tabular lining numerals.
- Oldstyle numerals in serif body text; lining tabular numerals anywhere mono or in dates and volumes.

## Layout

- Page wrap 1320px with a fluid gutter `clamp(16px, 4vw, 48px)`.
- Public masthead stack: wire strip → nameplate → sticky black rail (46px, brand fades in once the nameplate scrolls away) → crawl. Compact size on inner pages.
- The front page is one **sheet**: nameplate, folio between a 3px rule and a 1px rule, the lead split 6/6 (copy left, photograph right), then a `repeat(auto-fit, minmax(280px, 1fr))` grid of section columns separated by 1px column rules. Under 640px the rules turn horizontal.
- The article is a 920px sheet with a 68ch measure, breadcrumb, headline capped at 14em, dek at 40ch, cover, drop-cap body, seal end mark, then "More in this edition" as a numbered ledger.
- Home: full-bleed press-black hero (min 92dvh) with the halftone canvas behind a left-weighted headline block and a lead-story slip bottom right; then Today's Paper (7/5 split), the maroon sections strip, and the crew grid of bordered cells.
- Newsroom: 250px press-black rail + fluid main; the rail becomes a top bar under 900px. Two-pane editor (form left, live preview right in the public article styles) collapses to one column under 1100px.
- Spacing scale 0.5 / 1 / 1.5 / 3 / 4.5 / 7rem; more space above a heading than below it.

## Elevation & Depth

- Flat by default. Only the sheet and newsroom panels lift: `0 1px 0 rgba(23,17,15,.06), 0 12px 32px -18px rgba(23,17,15,.35), 0 40px 80px -48px rgba(63,10,18,.25)`.
- Toasts use the pop shadow `0 2px 6px -2px rgba(23,17,15,.2), 0 18px 40px -20px rgba(23,17,15,.35)`.
- A fixed fractal-noise grain at 5.5% multiply sits over every page. No glass, no glows; the hero's lead slip uses a 6px backdrop blur over the canvas only.

## Shapes

- Square. Radius is 0 everywhere except a 2px hair on buttons and inputs.
- Rules carry structure: 3px press-black top rule + 1px under rule for folios and section heads; 1px hairline column rules; a 2px maroon rule drawn in from the left on stub hover.
- Circles are reserved for the seal, monogram avatars and the halftone loupe.

## Components

- **Buttons**: mono uppercase, 44px tall, square. Primary maroon; paper (newsprint on dark); ghost (outlined maroon); ink (press-black); danger (outlined red); `btn-sm` at 34px. Press scale 0.97.
- **Status words**: the status is typeset as a word in mono caps with a small square marker; never a colored pill alone. Draft ink-3, Submitted maroon outline, Needs revision gold, Accepted maroon, Published newsprint on maroon.
- **Stub**: headline (Bodoni 1.3–1.75rem), first ~28 words with a mono "Continue", mono byline with read time; first stub in a section carries the thumbnail.
- **Ledger**: numbered headline list (mono 01, 02…) with the section in maroon mono on the right.
- **Section head**: maroon bar, mono caps, story count right-aligned.
- **Crew card**: bordered grid cell, monogram avatar circle, Bodoni name, mono maroon title, one-line blurb; the editor cell inverts to press-black with gold.
- **Halftone hero**: canvas dot screen of the lead cover, cell 13px coarse, 4.5px inside a 230px loupe that follows the pointer (or drifts when idle); dots run maroon-deep → maroon → newsprint by luminance; falls back to a duotone image when the cover blocks canvas reads; static under reduced motion.
- **Crawl**: 34px lower-third; maroon LATEST tag with live dot, mono headlines on a linear track, paused on hover, static when reduced motion.
- **Forms**: white fields with hairline borders, maroon focus ring (3px tint), mono labels; the headline field is a bare Bodoni input with only a bottom rule.
- **Toast**: press-black, mono, cyan left rule (red for errors, gold for success), bottom right.

## Do's and Don'ts

- Do keep the blackletter to the nameplate; a blackletter headline is a costume.
- Do commit maroon at region scale (bars, strips, buttons) rather than sprinkling it.
- Do typeset status as words; colored dots alone are not a status system.
- Do keep cyan under 2% and never for body text.
- Don't use eyebrows above headlines; the section lives in the section head, the byline line or the breadcrumb.
- Don't add card grids with icons, gradient text, glass panels, or hard offset shadows.
- Don't render photos untreated next to the halftone; keep the mild desaturate/contrast grade or the halftone.
- Don't invent editorial content: placeholder copy is lorem ipsum and says so.
