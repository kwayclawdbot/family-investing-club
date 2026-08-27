# Design decisions taken during the round-1 build (2026-08-26)

Source of truth: `design/Family Investing Club.dc.html` (canvas), `docs/Family_Investing_Club_Product_Rebuild_Plan.docx`,
`docs/FIC_Keep_and_Rebuild_UX_Spec.docx` (text copy in `KEEP-AND-REBUILD.md`).

| # | Question raised by the canvas | Decision |
|---|---|---|
| 1 | Two Home variants (canvas lean vs. reference mockup with Market Lesson of the Day + Happening Now) | Ship the canvas Home. Market lesson / live sessions land when the FTA live + news engines are wired (spec §3.1, §3.5). |
| 2 | Two onboarding entry designs (6-step vs. merged Welcome) | 6-step flow is canonical; artboard `09-onboarding.html` kept for reference only. |
| 3 | Experience vs. age for explanation level | Adult "brand new" → **Investor**; "already invest" → **Trader**. Explorer/Builder are youth levels (plan §5.4) and are chosen per child profile, not by the adult onboarding. |
| 4 | Learn tab root: node map vs. course library | `/learn` = progression map (plan §4.2 "not a directory"); `/learn/library` = secondary browse. |
| 5 | Idea lifecycle | Full plan lifecycle DRAFT → RESEARCHING → DISCUSSING → WATCHING → ACTIVE shown in the stepper (the artboard omitted DISCUSSING). |
| 6 | Three portfolio surfaces | Personal practice (`/practice`) · household (Family dashboard card) · club model portfolios (Club). Same engine, different scope. |
| 7 | Number consistency | Daily goal default = 10 min / 20 XP (matches "10 minutes a day" copy). Home league = all-time XP; Family dashboard = this week. |
| 8 | Per-tab accent colours in the mockup | Not adopted — one semantic system: green = active/learning, orange = primary action, purple = Kai/Club. |
| 9 | Missing lesson states | Built: correct, wrong, celebration. Explorer-level Home variant deferred to child profiles. |
| 10 | Illustrations | `ArtPlaceholder` everywhere the v2 vector set will drop in. |

Stack: Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript, per plan §14. Mobile-first PWA-style shell
(402px column on desktop). Auth talks to the existing FTA Supabase project; all content is fixture-backed behind
`src/lib/data.ts` until the FTA engines are mapped to the FIC domain model (plan §13).
