# Round 7 — v11 conversation-first social model + v12 "one page · one question · one action"

Sources: `design/artboards-v6/*.html` (15 boards), canvas notes. Rules from rounds 2–6 still bind (tokens, primitives, honest states, tsc/eslint, 390×844 proofs, no build/commits).

## Locked
- **Nav v4 (shipped in shell):** Home · Discover · Learn · Practice · Me. Private clubs live inside Home's **Main | Private** switch; club pages, circles and community are drill-ins from Home. Kai is embedded (`@Kai` anywhere), not a destination.
- **Three social layers, one conversation engine:** MAIN FEED (everyone) · CIRCLES (temporary 30-day topic rooms with countdown rings, ~8–12 active, archive read-only to the company page) · PRIVATE CLUB (my people; chat-default with Chat · Performance · Decisions · Members). Rich artifacts everywhere: picks, charts, polls, research, Kai summaries.
- **One question per page:** Home=talk · Circle=this event · Club Chat=my people · Club Performance=how are we doing · Club Decisions=what are we deciding (research → propose → vote → journal) · Members=who · Discover=explore · Company=understand + sticky **Make a Pick** · Learn=progress (one Next card) · Lesson=one immersive concept, zero chrome · Practice=apply skill · Me=my record · My Performance=my results (Picks | Practice | Verified) · Notifications=needs-you first, deep links only · Search=find a known thing (Stocks/Circles/People/Content). If something doesn't answer the page's question, move it.
- **Data:** keep using `@/lib/data-live` in server pages. New shapes (circles, feed posts with artifacts, chat messages, notifications "needs you", my performance history, practice hub) → add a lane-local fixture file `src/lib/fixtures/v12-<lane>.ts` and import it directly; do NOT edit `src/lib/data.ts` / `data-live.ts` (shared). Prices via `getCompany`/`getLiveQuote` where a symbol is shown.

## Lanes
| Lane | Boards | Owns |
|---|---|---|
| SOCIAL | 12 Home v4 · 13 Compose · 14 Circle · 11 Notifications | `src/app/(app)/home/**`, new `src/app/(app)/circle/**`, `src/app/(app)/community/**`, `src/app/(app)/profile/notifications/**`, `src/components/home/**`, `src/components/community/**`, new `src/components/circles/**`, `src/components/shell/PlusFab.tsx`, `src/components/shell/PlusWheel.tsx`, `src/components/sheets/**` |
| CLUB+ME | 15 Private Club chat · 07 Performance · 08 Decisions · 09 Me · 10 My Performance | `src/app/(app)/club/**`, `src/components/club/**`, `src/app/(app)/profile/page.tsx`, new `src/app/(app)/profile/performance/**`, `src/components/profile/**`, `src/components/belts/**` |
| EXPLORE | 01 Discover · 02 Company · 03 Learn · 04 Lesson · 05 Practice · 06 Search | `src/app/(app)/discover/**`, `src/app/(app)/search/**`, `src/app/(app)/learn/**`, `src/app/(app)/practice/**`, `src/app/(full)/lesson/**`, `src/components/markets/**`, `src/components/learn/**`, new `src/components/practice/**` |
