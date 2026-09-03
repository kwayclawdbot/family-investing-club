# Go-live blockers — what stands between FIC and the domain

Opened 2026-09-03, after the cutover was rehearsed end-to-end and rolled back the same day. The
infrastructure is proven (`docs/BACKEND-CUTOVER-PLAN.md` Phase 8); what is not ready is the product.
`app.familyinvestingclub.com` serves the old app until every P1 below is closed.

The owner named two: **placeholder text on member screens** and **the LMS not showing course content
accurately**. Both are real and are measured here rather than described.

---

## P1-A — 49 of 103 published lessons are empty shells

Counted against the live database on 2026-09-03. Twelve courses are published; between them they hold
42 modules and 103 lessons, but **only 54 lessons have anything to play** (`video_id` or `steps`).
The other 49 carry a title and a description and nothing else.

| course | lessons | with content | empty |
|---|---:|---:|---:|
| `fic-teens-foundations` | 19 | 19 | 0 |
| `fic-adult-foundations` | 13 | 13 | 0 |
| `fic-kids-corner` | 12 | 12 | 0 |
| `investing-explained-simply` | 1 | 1 | 0 |
| `tf-100` | 11 | 7 | **4** |
| `inv-101` | 8 | 1 | **7** |
| `tf-101` | 8 | 1 | **7** |
| `tf-102` | 5 | 0 | **5** |
| `sw-101` | 4 | 0 | **4** |
| `tf-103` | 4 | 0 | **4** |
| `dt-101` | 6 | 0 | **6** |
| `fta-trade-ready` | 12 | 0 | **12** |

Five published courses are **100 % empty** — `fta-trade-ready` (the academy's flagship, 12 lessons),
`dt-101`, `tf-102`, `sw-101`, `tf-103`. A member can open any of them, walk the module list, tap a
lesson and reach "This lesson has no content attached yet."

`scripts/probe-fta-content.mjs` already answered the obvious question: the missing decks **do not
exist** on the FTA content host under any of the four naming patterns in use, and every bundle in the
frozen repo's `public/lessons` is already linked. So this is not a wiring bug — the content was never
authored, or lives somewhere nobody has pointed at yet.

Three ways forward, and the choice is the owner's:
1. **Unpublish** the five empty courses and hide empty lessons inside the seven partial ones. Honest,
   costs nothing, shrinks the catalogue to 54 real lessons. The Learn shelf already filters at course
   level (`fix(learn): the shelf shows only courses that have content`) — the filter needs to reach
   lesson level too.
2. **Author the missing 49.** The real fix, and the expensive one.
3. **Point them at content that exists elsewhere** — only if such a source is known; the probe says
   the FTA host is not it.

Until one is done, "the LMS shows all course content" is not a claim the app can make.

## P1-B — every company page but three shows placeholder copy

`src/components/markets/dossier-data.ts` hard-codes the plain-language company story for exactly
**three symbols**: `AAPL`, `COST`, `NVDA`. Every other company falls through to:

> "*{Name}* is a business we're still writing the plain-language story for. Tap the numbers to learn
> what they mean, and ask Kai how it makes money."

That sentence is shipped placeholder text, and a member reaches it from Discover, search, the
screener, a club pick and a watchlist row — the company page is one of the most-travelled screens in
the app.

Two further problems sit underneath it:
- **The three covered symbols carry frozen numbers as if they were live.** `AAPL` states P/E 34.8,
  market cap $3.4T, dividend yield 0.4 %, 52-week range $164–231 — typed into a source file, never
  refreshed. Stale numbers presented as current are worse than a dash.
- **The fallback's numbers are mostly dashes anyway**: they read `screener_metrics`, where `mcap` and
  `sector` are populated for roughly 20 of 11,700 rows until the nightly round-robin catches up
  (already logged in Phase 7.5).

The fix is a real fundamentals source feeding all four numbers, and either generated or authored
copy for the companies members actually reach — not a longer hard-coded list.

## P2 — smaller, known, not yet closed
- **`stripe_customer_id` is null on all 23 families** — the billing portal cannot open until a
  one-time Stripe backfill runs.
- **Zero open circles** — every `club_circles` row has expired, so circle surfaces render empty. Data,
  not code.
- **Not covered by any smoke suite:** `/api/club/{vote,propose,pick}`, chat sends, family-night XP
  fan-out. Each mutates a real club object and needs a throwaway club to test against.
- **`child_report_stats` refuses `role='admin'`** (demands exactly `parent`); FIC's computed fallback
  mirrors the RPC's denominator, but a real parent account gets the richer report. Fixing it means
  altering an FTA function — deferred until FTA retires.
- **Admin pages never ported:** shop orders/products, coach-demos, community-watchlist, picks. The old
  app keeps serving them.
- **No embedded checkout** — hosted Stripe only.

## Not a blocker, worth knowing
- A full screen-by-screen copy review has **not** been done. This document lists what a code and
  database audit can prove; the owner is reading the running app and may be seeing invented counts or
  provisional wording the audit cannot detect. `proof/live/*.png` holds 28 current screenshots taken
  under a real session — that is the place to start a visual pass.
- A grep for the usual markers (`lorem`, `TODO`, `coming soon`, `placeholder`) across every member
  screen returns one hit, in an admin table. The placeholder problem is written in plausible English,
  not left in obvious scaffolding — which is why it needs eyes, not a regex.

## When these are closed
Re-running the cutover takes minutes and is fully rehearsed — the sequence, the two settings that
must change, and the cron ownership rule are all in `docs/BACKEND-CUTOVER-PLAN.md` Phase 8.
