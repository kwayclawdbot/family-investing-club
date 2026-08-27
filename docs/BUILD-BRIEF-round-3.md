# Round 3 — Product Shift v3: club-first (UPGRADE, NOT REVAMP)

Sources: `design/artboards-v2/*.html` (28 artboards, the canvas is now this set), `docs/PRODUCT-SHIFT.md`,
`design/FIC Clickable Prototype.dc.html` (navigation graph: data-go targets). Rules from `BUILD-BRIEF-round-2.md` still bind.

## Locked architecture
- **Family ≠ Club.** A Household is an account relationship (guardian/child → permissions, safety). An **Investing Club** is the
  social object (family, friends, cousins). Nothing renders a household directly; `/family/**` is the parent/guardian view.
- **Nav v2 (already shipped in the shell):** Home · Discover · **Club (raised centre)** · Learn · Profile. Child accounts
  (`fic.level` Explorer/Builder): Home · Learn · Practice · Family · Me — public community hidden.
- **Club tab = two layers:** `🔒 My Club` (private) | `🌍 Community` (public) toggle at the top of `/club` and `/community`.
- **Object flow:** PICK → INVESTMENT IDEA → CLUB PROPOSAL → CLUB PORTFOLIO → OUTCOME / JOURNAL. Every holding links to its proposal.
- Practice money only. Copy: "No pooled money — decisions are real, dollars are practice."
- Learning bridges: when a metric/concept isn't mastered, show the ✦ "N-min lesson before you vote" card (purple Kai tint) linking into Learn.
- Data ONLY via `@/lib/data.ts` (`getClub`, `clubVisibleMembers`, `getPicks/getPick`, `getProposals/getProposal`, `getClubPortfolio`,
  `getResearch`, `getClubActivity`, `getCommunity`, `getChildHome`, `clubWatchers(symbol)`, `costcoQuote`, plus everything from rounds 1–2).
  Client mutations persist under `fic.*` (e.g. `fic.club`, `fic.picks`, `fic.votes.<id>`, `fic.rsvp`, `fic.research`).
- Pixel-match the artboard for your screen. Where two artboards show the same screen (05 vs 11 My Club, 07 vs 12 Community),
  **the lower-numbered (v4/v5) one is canonical**; take any extra content from the other only if it fits.
- Artboards still showing the old nav (Home · Learn · Markets · Club · Profile) are simply older — the shell's nav v2 wins.

## Lanes (strict file ownership)
| Lane | Artboards | Owns |
|---|---|---|
| CLUB | 01 create · 02 pick thread · 03 propose · 04 vote · 05/11 My Club · 06 new-club empty · 07/12 Community · 09 club portfolio · 13 pick composer | `src/app/(app)/club/**` EXCEPT `club/groups/**`, `club/portfolio/[id]/**`; `src/app/(app)/community/**`; `src/components/club/**` EXCEPT `Groups.tsx`, `PortfolioDetail.tsx` |
| HOME | 16 Home v2 · 14/15 onboarding v2 · 10 child home · 28 parent view | `src/app/(app)/home/**`, `src/app/(onboarding)/**`, `src/app/(app)/family/**`, `src/components/{home,onboarding,family}/**` |
| DISCOVER | 08 company social layer · 24 dossier · 23 news · 25 research lists | `src/app/(app)/discover/**`, `src/app/(app)/search/**`, `src/app/(app)/practice/**`, `src/components/markets/**` |
| LEARN | 17 games hub · 18 chart practice · 19 scenario+Simbot · 20 flashcards · 21 lesson player · 22 live · 26 groups · 27 model portfolio | `src/app/(app)/learn/**`, `src/app/(app)/live/**`, `src/app/(full)/lesson/**`, `src/components/{learn,live}/**`, PLUS `src/app/(app)/club/groups/**`, `src/app/(app)/club/portfolio/[id]/**`, `src/components/club/Groups.tsx`, `src/components/club/PortfolioDetail.tsx` |

Verify as in round 2 (tsc, eslint on your files, 390×844 screenshots, look, iterate). No `next build`, no commits.
