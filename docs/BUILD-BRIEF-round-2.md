# Round 2 — the rest of the member surface (spec §3)

Same app, same system. There are NO artboards for these screens: design them from the 19 built screens
(`proof/*.png`, `design/artboards/*.html`) and the primitives. A screen should look like it came off the same canvas.

## Rules
- Palette meaning: **green** = learning / active / confirm · **orange** = the one primary action · **purple** = Kai and Club
  objects · gold = achievements · coral/red = loss / destructive. Cream paper background, white cards, `border-line`.
- Type: Nunito. Titles 21–24px black (900); card titles 14–15px 900; body 13–14px bold; meta 11–12px extrabold `text-ink-3`;
  section eyebrows 11px extrabold uppercase orange/green.
- Layout: 18px gutters (Content already pads), 12px between cards, 16px radius cards, 52px primary buttons pinned bottom
  where a flow has one action. Sub-pages use `TopBar` with `backHref`.
- Primitives: `@/components/ui` (Card, Button, ButtonLink, ProgressBar, SectionHeader, Avatar, Tag, Segmented, ArtPlaceholder,
  Row) · `@/components/ui/extras` (EmptyState, Toggle, LinkRow, Sheet, ConceptChip, StatTile) · icons in `@/components/ui/icons`
  · chart: `@/components/markets/LineChart` (LineChart, Sparkline). Do not edit these; add lane-local components instead.
- Data ONLY from `@/lib/data.ts`. Client-side mutations (watchlist adds, orders, votes, saves, prefs) persist to
  `localStorage` under `fic.*` keys inside try/catch and hydrate after mount (add
  `// eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount` on that setState).
- Honest states: no fake AI, no fake money, no fake live video. Simulated = say "practice" / "virtual". Empty tabs use `EmptyState`.
- Every new page must be reachable: add its entry point (link/row/card) on the existing page in your lane.
- Explanation levels: Explorer/Builder copy is simpler and warmer; Investor is default; Trader is denser. Where it matters,
  read `fic.level` from localStorage.
- Next 16: `params` is a Promise (`PageProps<'/route/[id]'>`), `notFound()` on unknown ids. Client components need "use client".
- Accessibility: buttons are `<button>`, toggles `role=switch`, tabs `role=tab`, respect `prefers-reduced-motion`.
- Verify: `npx tsc --noEmit` + `npx eslint <your files>` clean; screenshot every route you built at 390×844 (dev server on
  http://localhost:3100 — do not restart it, do not run `next build`), LOOK at the PNGs, fix, iterate. No git commits.
