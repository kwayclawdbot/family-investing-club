# Round 6 — v9 "one workflow" + v10 "collective-performance workspace"

Sources: `design/artboards-v5/01–06`, `docs/COLLECTIVE-PERFORMANCE.md`, canvas v9 notes. Rounds 2–5 rules still bind.

## Locked in v9/v10
- **Nav v3 (shipped in shell):** Home · Club · Discover · Learn · **Community** — flat, five equal tabs. Profile lives behind the header avatar (top-left on Home). Child nav unchanged.
- **Sheets over routes:** Pick, Vote, Invite, Ask Kai open as sheets from one universal orange ＋ (bottom-right, `PlusFab`) whose quarter-wheel has five compartments: MAKE A PICK ▲ · RESEARCH 🔍 · ASK THE CLUB 💬 · PROPOSAL 🗳 · SHARE IDEA 💡. Existing routes stay for deep links.
- **Visual hierarchy has 3 levels:** one hero per screen · borderless stream rows · utility chips. No more equal-weight card stacks.
- **XP/belts are ambient:** rings, chips, ephemeral "+N XP". Kway is now **Purple Belt · 2,640 XP** (560 to Black); club = **5 members · 2 households**.
- **Club answers six questions in order:** How are we doing? → Who is contributing? → What do we own/model? → What are we researching? → What decisions are open? → What have we learned? Tabs reduce to **Overview · Portfolio · Members**; research/picks/votes live inside Overview and company/decision objects.
- Performance is pick-based, never dollars; child performance is **practice only** and labelled; verified ✓ = data trust, not skill.
- Data via `@/lib/data.ts`: `getClubOverview`, `getPortfolioTab`, `getMemberCards`, `getHomePulse`, `getCommunityPosts/Chats/Clubs/Live`, plus everything earlier (`getClub`, `getProposal`, `getPicks`, `identityOf`, `beltFor`, …). Chart: `@/components/markets/LineChart` (extend locally for benchmark overlay + markers).

## Lanes
| Lane | Artboards | Owns |
|---|---|---|
| CLUB | 01 Overview · 02 Portfolio tab · 03 Members tab | `src/app/(app)/club/page.tsx`, `src/app/(app)/club/{research,members,portfolio}/page.tsx`, `src/components/club/{MyClub,ClubPortfolioView,CommunityView,club-shared,cards}.tsx`, new `src/components/club/workspace/**` |
| HOME+COMMUNITY | 04 Home v3 · 05 Community | `src/app/(app)/home/**`, `src/app/(app)/community/**`, `src/components/home/**`, new `src/components/community/**` |
| SHELL | 06 Universal ＋ wheel + sheets | `src/components/shell/PlusWheel.tsx`, `src/components/shell/PlusFab.tsx`, new `src/components/sheets/**`, and (for sheet-ification only) `src/components/club/{PickComposer,VoteScreen}.tsx`, `src/components/kai/KaiSheet.tsx` |
