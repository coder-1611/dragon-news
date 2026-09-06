# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Vite multi-page static site (vanilla ES modules + CSS), Firebase Auth + Firestore backend, deployed to Vercel. Confirmed by the user in the planning interview (2026-09-05): Firebase over Supabase; static multi-page over a framework was delegated and chosen for real per-page URLs and zero server.

## Users
- **Students of Round Rock High School ("Dragon Nation")**, reading on phones between classes and on laptops at home. Job: find out what is happening at school today, read one article quickly, share it.
- **Student journalists** (multiple accounts): write and submit stories from a laptop, track whether the editor accepted them.
- **The editor** (one account): approves new journalist accounts, reviews submissions, requests revisions, chooses the lead headline, composes and publishes each edition.
- Secondary: parents, staff, the journalism adviser.

## Product Purpose
Dragon News is the student newspaper of Round Rock High School, published online as a dated "Today's Paper" edition with an archive of past editions, plus a private newsroom where the staff writes and the editor publishes. Success: students actually open it, the editor can ship an edition without touching code, and the newsroom flow (pending account → approved → draft → submitted → revision → accepted → published) runs with no manual database work.

## Positioning
A real editorial pipeline, not a blog: one editor decides the front page and the lead, journalists cannot self-publish, and each published edition is an immutable dated snapshot like a printed paper. It reads like a newspaper front page while every story is tappable and readable on a phone.

## Operating Context
- School: Round Rock High School, Round Rock ISD, 201 Deep Wood Drive, Round Rock, TX 78681, 512-464-6000. Mascot: Dragons. Colors: maroon and white. Established 1913. Principal Gordon Butler. ~3,900 students, UIL 6A.
- Existing school media brands: "Dragon News" (the school's biweekly student video broadcast) and "Dragon Nation" (spirit council). The user chose "Dragon News" as this paper's name knowingly.
- Editions are dated (YYYY-MM-DD). Sections: News, Sports, Academics, Clubs, Arts, Opinion, Dragon Life.
- Story bodies are Markdown; covers are images uploaded by the writer.

## Capabilities and Constraints
- Public: home, Today's Paper, edition by date, article page, archive, about/crew. All server-less static pages reading published Firestore data; unpublished content is never readable publicly (rules-enforced).
- Newsroom: open signup, accounts pending until the editor approves; journalist desk, story editor with live preview, editor staff/queue views, edition composer with lead slot and per-section ordering, publish/republish/unpublish.
- Exactly one editor account, seeded once; journalists cannot escalate role (rules-enforced).
- Firebase project `dragon-news-rrhs`; billing (Blaze) is not enabled, so images default to compressed in-document data URLs; Firebase Storage is an opt-in upgrade.
- Undecided: custom domain; whether an adviser gets a second editor-class account (not built).

## Brand Commitments
- Name: **Dragon News**. School identity: Dragons, maroon and white, est. 1913. Hero line direction from the user: "Dragon Nation gets its news here."
- Aesthetic brief from the user (binding): "old school but techy", "absolutely beautiful", a newspaper front page that is still modern and tappable, with a main headline chosen by the editor and articles that show their first words before a click.
- Voice: student newsroom. Sentence case. No emoji.

## Evidence on Hand
- School facts above (rrhs.roundrockisd.org, Wikipedia). School logo exists at the district CMS but is not licensed for reuse here; the site uses its own typographic masthead and an original seal mark.
- No editorial content yet: **all article and crew content is lorem ipsum placeholder by the user's instruction**, to be replaced by the journalists through the newsroom. No real staff names, photos, or stories may be invented.
- No real photos on hand; placeholder photography is used under one consistent treatment.

## Product Principles
1. The editor decides the front page; the software never guesses the lead.
2. A published edition is a snapshot: later edits never rewrite yesterday's paper.
3. Every story is one tap from the front page and readable on a phone first.
4. The newsroom must be usable by a 16-year-old with no training: statuses are plain words, actions are few.
5. Nothing unpublished ever leaks to the public site, enforced by rules rather than UI.

## Accessibility & Inclusion
Body contrast ≥ 4.5:1, visible focus states, 44px touch targets, reduced-motion honored, phone-first reading widths, semantic headings for screen readers.
