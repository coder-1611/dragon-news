# Dragon News

The student newspaper of Round Rock High School, with a newsroom where journalists file stories and one editor publishes dated editions.

- Public site: home (halftone hero + today's paper + crew), `/paper` (front page), `/paper/:date`, `/paper/:date/:slug`, `/archive`, `/about`.
- Newsroom: `/newsroom` (sign in / apply), `/newsroom/desk`, `/newsroom/write`, `/newsroom/editor` (staff + queue + crew list), `/newsroom/edition` (composer, publish / unpublish).
- Stack: Vite multi-page, vanilla ES modules + CSS, Firebase Auth + Firestore (project `dragon-news-rrhs`), Vercel static hosting.

## Run

```sh
npm install
npm run dev          # http://localhost:5173 (add ?demo=1 to render the placeholder edition without Firestore)
npm run build && npm run preview
```

## Backend

- `firestore.rules` is the source of truth for who can do what. Deploy with `firebase deploy --only firestore`.
- `npm run rules:test` runs 48 rules assertions in the emulator (needs Java: `brew install openjdk@21`, then `export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"`).
- `npm run bootstrap` creates the single editor account from `.env.local` (`EDITOR_EMAIL`, `EDITOR_PASSWORD`) through the one-time rules bootstrap.
- `npm run seed` writes the placeholder crew, the placeholder journalist account and the lorem-ipsum edition, then publishes it through the same code the composer uses.
- `node scripts/seed-rest.mjs` seeds the same public content as project owner through the Firestore REST API (works before Auth is switched on).
- Cover photos are compressed client-side to WebP data URLs (≤150 KB) and stored in Firestore, so the free plan is enough. `src/lib/images.js` is the single place to swap in Firebase Storage later.

## Editorial flow

`draft → submitted → (needs revision ↔ submitted) → accepted → published`. Journalists edit only drafts and stories sent back with a note. The editor accepts stories, composes an edition (lead + sections), and publishes. Publishing freezes a snapshot: `editions/{date}` holds the front page, `editions/{date}/articles/{slug}` holds the full stories, so later edits never change a printed edition. Unpublishing pulls it; republishing restores it.

## Tests

- `node scripts/shoot.mjs` screenshots every public page at 1280 and 390 (needs the dev server; `BASE=` and `Q=` env override).
- `node scripts/e2e.mjs` drives the whole newsroom flow through the real UI with the accounts in `.env.local` and cleans up after itself.

## Design

See `THESIS.md` (the concept) and `DESIGN.md` (the system as built).
