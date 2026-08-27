# Round 8 — Clickable Prototype v2 (30 wired screens) — the reconciled IA

Source: `design/FIC Clickable Prototype.dc.html`. Each screen is a `<div data-screen="ID">` block; links are `data-go="ID"`.
Extract your screens with a quick script (find `data-screen="ID"`, walk balanced `<div>`s) and pixel-match them. Rounds 2–7 rules bind.

## Locked by the prototype
- **Nav v5 (shipped in shell):** Home · Discover · Club · Learn · **More**. Screen → route map: home→`/home` · clubchat→`/club` · clubperf→`/club?tab=performance` · clubdec→`/club?tab=decisions` · clubmem→`/club?tab=members` · circle→`/circle/[id]` · discover→`/discover` · screener→`/screener` · theme→`/theme/[id]` · news→`/discover/news` · company→`/discover/[symbol]` · pick→Pick sheet · kai→Kai sheet (contextual) · wheel→＋ FAB · attach→attach sheet (club composer) · learn→`/learn` (Path) · courses→`/learn?tab=courses` · live→`/learn?tab=live` · practice→`/learn?tab=practice` (also `/practice`) · review→`/learn?tab=review` · lesson→`/lesson/valuation` · chartdrill→`/learn/chart-practice` · scenario→`/learn/scenarios/market-crash` · me/mehub→`/profile` · myperf→`/profile/performance` · notifs→`/profile/notifications` · beltpromo→`/profile/belt` · onboard1→`/welcome` · onboard2→`/onboarding/who` · signup→`/signup`. Targets `homeclub`→`/club`, `pickcard`→`/club/pick/[id]`, `ask`→Kai sheet, `video`→`/live/[id]`.
- The ＋ FAB is back (wheel: Pick · Ask Kai · Club chat · Decisions · Performance). ✎ compose stays available from the Club composer / Main feed only.
- Every `data-go` in a screen must be a real link/action in the app. Data via `@/lib/data-live` (server) / lane fixtures `src/lib/fixtures/v13-<lane>.ts`; live prices via `getCompany`.

## Lanes
| Lane | Screens | Owns |
|---|---|---|
| HOME+CLUB | home · clubchat (circles rail inside) · clubperf (holdings w/ price · weight · since add) · clubdec (Open/In research/Decided chips, needs-your-vote, public polls, MY DECISION RECORD) · clubmem · attach · wheel · pick · kai | `src/app/(app)/home/**`, `src/app/(app)/club/**`, `src/components/home/**`, `src/components/club/**`, `src/components/shell/PlusFab.tsx`, new `src/components/shell/PlusWheel.tsx`, `src/components/sheets/**`, `src/components/kai/**` |
| DISCOVER | discover · screener · theme · news · company | `src/app/(app)/discover/**`, new `src/app/(app)/screener/**`, new `src/app/(app)/theme/**`, `src/app/(app)/search/**`, `src/components/markets/**` |
| LEARN+ME | learn (hub tabs Path · Courses · Live · Practice · Review) · courses · live · practice · lesson · chartdrill · scenario · me · myperf · notifs · beltpromo · onboard1 · onboard2 · signup | `src/app/(app)/learn/**`, `src/app/(app)/live/**`, `src/app/(app)/practice/**`, `src/app/(full)/lesson/**`, `src/app/(app)/profile/**`, `src/app/(onboarding)/**`, `src/app/(auth)/**`, `src/components/{learn,live,practice,profile,belts,onboarding,auth}/**` |
