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

## Round 3 — Product Shift v3 (club-first), 2026-08-27
| # | Decision |
|---|---|
| 11 | **Family ≠ Club.** Household = account relationship (guardian/child, permissions). Investing Club = the social object. `/family/**` is the parent view; `/club` is My Club. A household auto-creates its family club. |
| 12 | Nav v2 shipped: Home · Discover · **Club (raised centre)** · Learn · Profile. Markets → Discover with permanent redirects. Child accounts get Home · Learn · Practice · Family · Me. |
| 13 | Club tab is two layers: `🔒 My Club` (`/club`) and `🌍 Community` (`/community`). Old public feed objects live under Community → "Latest from the network". |
| 14 | Object flow implemented: Pick → Idea → Club Proposal → Club Portfolio → Decision Journal. Every holding links to its proposal. |
| 15 | Dad is a co-admin on Mom's seat: counted in tallies, not in the 4-avatar row (artboards say 4 members but show Dad proposing). |
| 16 | Vote page never pre-votes for the user: tally starts at 2 of 4 and reaches the artboard's "3 of 4 · waiting on Arielle" when you tap For. |
| 17 | Artboard 24's key numbers (P/E 34.8) win on the dossier; tap-to-learn definitions still come from the metrics fixture. |
| 18 | Where two artboards show one screen (05/11 My Club, 07/12 Community) the lower-numbered v4/v5 board is canonical. |

## Rounds 4–5 — Verified collective investing (v7) + XP & belts (v8), 2026-08-27
| # | Decision |
|---|---|
| 19 | Brokerage connect is **never in onboarding**; it triggers contextually after the first Pick (sheet) and from Profile. Everything works without it. |
| 20 | Badge language is locked: "Brokerage Connected ✓" / "Verified Owner ✓" / "Verified Holding ✓". "Verified Investor" is banned (sounds like vetted competence). |
| 21 | Sharing defaults to the most private level; the preview card shows exactly what a club member would see for each level. Disconnect removes verification instantly. |
| 22 | Club Portfolio has two views: **Club Model** (what we agreed) and **Verified Exposure ✓** (what consenting adults actually hold, percentages only, with completeness: "based on 3 of 4 members"). Mismatch → concentration lesson, never advice. |
| 23 | Consensus = "what members think — opinions, not advice or a recommendation". Club consensus (with verified-owner count and model-vs-exposure) sits above the dossier; FIC consensus below it. |
| 24 | Leaderboards: many boards, each states window / rules / data basis (practice, pick-based, brokerage-verified); adults are never ranked by dollars or account size. |
| 25 | Five identity systems, kept separate: Belt (lifetime XP & participation) · Reputation (resolved pick accuracy) · Specialist badges · Verification (ownership, not skill) · Achievements. XP never comes from trade count, account size, risk or returns. |
| 26 | Belt ladder: 7 levels, 5 colours, no rank names — White I/II, Yellow I/II, Blue, Purple, Black. Belt colours are identity-only, never UI accents. Ring on avatar + chip beside name everywhere; promotion is a ceremonial screen, feeds get only the chip. |
| 27 | Sample brokerage link: "Connect securely" creates a labelled sample read-only link until a licensed aggregator is wired — never presented as a real connection. |

## Round 6 — v9 one workflow + v10 collective-performance workspace, 2026-08-27
| # | Decision |
|---|---|
| 28 | Nav v3: Home · Club · Discover · Learn · **Community** (flat). Profile behind the header avatar. Child nav unchanged. |
| 29 | Sheets over routes: Pick, Ask the Club, Vote, Invite, Ask Kai open as sheets from the universal orange ＋ quarter-wheel; routes remain for deep links. |
| 30 | Club default view is performance-first; tabs reduce to Overview · Portfolio · Members. Research/picks/votes live inside Overview and company/decision objects. `/club/portfolio` and `/club/members` redirect into the tabs. |
| 31 | Home v3 is a pulse: identity → Me/My Club hero with event markers → 3 tiles → club snapshot with ONE decision → short stream → one continue card. KaiFab removed (Kai is in the ＋). |
| 32 | Three visual levels per screen: one hero, borderless stream rows, utility chips. XP/belts ambient (rings, chips, ephemeral +XP toast). Kway = Purple Belt · 2,640 XP; club = 5 members · 2 households. |
| 33 | Dad renders Yellow II from data (910 XP) even though artboard 03 prints "Yellow I" — the same canvas says he "earned Yellow Belt II". |

## Live data, 2026-08-27
| # | Decision |
|---|---|
| 34 | **Two data modes.** Signed-in users read the FTA Supabase project (RLS) through `src/lib/data-live.ts`; signed-out visitors keep the fixture demo. Server pages import `@/lib/data-live`; client components keep the client-safe `@/lib/data`. |
| 35 | **Additive schema only.** Club objects live in `fic_club_*` tables beside the FTA schema (`supabase/migrations/20260827…`). Applied via the Management API (`scripts/db-apply.mjs`) because two repos share the project and `supabase db push` refuses on history mismatch — never repair/revert FTA's migration history. |
| 36 | **Polygon on the free tier**: grouped-daily bars (1 call = every ticker) power quotes; freshness is "End of day". Upgrade to Starter + `POLYGON_RPM=300` for 15-min delayed intraday with no code change. |
| 37 | Mutations go through `src/app/api/club/*` (session-gated, validated); sheets still write localStorage until switched to `src/lib/live/client.ts`. |
| 38 | Placeholder Mensah members are `auth.users` rows with no login; they become real when invited. Their XP shows 0 under Kway's RLS until a club-mates policy is added. |

## Round 7 — v11 conversation-first + v12 one page · one question · one action, 2026-08-27
| # | Decision |
|---|---|
| 39 | Nav v4: Home · Discover · Learn · Practice · **Me**. Club and Community are no longer tabs — private clubs live inside Home's Main | Private switch; circles and club pages are drill-ins. `/community` redirects to `/home` (Clubs/Live tabs kept). |
| 40 | Three social layers on one conversation engine: Main Feed (Home) · Circles (30-day rooms with countdown rings, archive to the company page) · Private Club (chat-default: Chat · Performance · Decisions · Members). |
| 41 | The universal ＋ wheel is replaced by the ✎ **Share** FAB → Compose modal with an audience picker and artifact chips (Pick, Chart, Poll, Research, Ask Kai, $Ticker). Kai is embedded (`@Kai`), not a destination. |
| 42 | Every page answers one question; modules that don't answer it were moved (Discover lost portfolio/lesson strips; Learn's games moved to Practice; the practice portfolio lives at `/practice/portfolio`). |
| 43 | Company page = understand + sticky Make a Pick; chart/metrics/news sit behind "More". Key numbers other than market cap are dossier copy until live fundamentals are added to the seam. |

## Round 8 — Clickable Prototype v2 (the reconciled IA), 2026-08-27
| # | Decision |
|---|---|
| 44 | Nav v5 per the prototype: Home · Discover · Club · Learn · **More**. Home = performance pulse + My Performance Center + Active trade ideas; Club = chat with the circles rail inside; Discover = signals with 🔬 Screener and Theme pages behind it; Learn = LMS hub (Path · Courses · Live · Practice · Review; `/practice` redirects); More = Me. |
| 45 | The ＋ wheel is back (Pick · Research · Ask the Club · Proposal · Ask Kai); ✎ compose lives in the Club composer. Pick and Kai are contextual sheets with live prices. |
| 46 | Every `data-go` in the prototype maps to a real route or sheet (map in `docs/BUILD-BRIEF-round-8.md`). |

## Prototype v3, 2026-08-28
| # | Decision |
|---|---|
| 47 | Home is conversation-first again (circles rail · Main Feed | 🔒 Private · composer with attach); performance lives only in My Performance and Club → Performance. Private = the club chat inline. |
| 48 | Club → Performance v1 tracks **official club picks** (voted in) — 12 picks · positive rate · vs benchmark · avg horizon — not holdings; the model portfolio collapses under "Model portfolio ▾". Individual member tracking comes later. |
| 49 | Decision record rows show "aged well" (outcome moved with your vote 90+ days later) as a learning metric, never a score. Discover is one ticker per card. |

## Backend cutover — Phase 1 identity foundation, 2026-08-28
| # | Decision |
|---|---|
| 50 | **FIC replaces fta-dashboard on the same Supabase project.** No second project, no table copies, no auth re-import. Cutover = FIC owns every FTA domain + the platform services + a DNS move (`docs/BACKEND-CUTOVER-PLAN.md`). FTA source is frozen at `~/projects/fta-dashboard-v3` commit `b9f5b7e`. |
| 51 | **Family is the tenant; one club per family.** `fic_ensure_family_club()` creates the family via FTA's `onboard_create_family` when missing, the club when missing, and syncs every family profile into `fic_club_members` (kids → role `child`). `fic_backfill_family_clubs()` ran once on 2026-08-28: Mensah club linked to The Coffie Family, 11 clubs created. Friends/mixed clubs remain `fic_create_club` + invite code. |
| 52 | **`src/proxy.ts` (Next 16) guards member routes.** Local JWKS verification (port of FTA's middleware); signed-out → `/login?next=` in production, fixture demo only where `FIC_DEMO`/preview/local allows. `?ref=` → `fic_ref` cookie (90 days). |
| 53 | **Role comes from the profile, never localStorage.** `(app)/layout` reads `getSession()` (profile + family + `family_tiers`): child shell via `isChild()`, unfinished parents redirected to `/onboarding/who`. `useIsChild()` only serves the signed-out demo. |
| 54 | **Live misses are loud.** `pick()` logs `[live-miss] <getter>` in every environment when a live reader returns null; `FIC_STRICT_LIVE=1` (`npm run smoke:live`) makes it throw. Fixtures keep rendering for unported domains until their phase lands. |
| 55 | Onboarding persists: `create` → `POST /api/onboarding/family`; `ready` → `POST /api/onboarding/complete` (comprehension_level, notification_prefs, onboarding_complete) and gives solo members a one-person family. Household invites: `POST /api/family/invite` (FTA `family_invites`) and `POST /api/family/join` (FTA `redeem_invite`, falls back to a club code). |

## Make it real — every member surface on live rows, 2026-08-29
| # | Decision |
|---|---|
| 56 | **A `@/lib/fixtures` import now means fake data.** The belt ladder (`lib/belts.ts`), themes, scenarios, the game catalog, drill rounds and brand colours are *content/config* and moved to `lib/belts.ts` / `lib/content/*`. The only fixture imports left in `src/components` are the signed-out demo feeds (`HomeV4`, `ChatPane`) — decision #54's fixture path. |
| 57 | **Belts resolve from real identities.** `IdentityProvider` (app layout) seeds the club's `MemberIdentity[]`; `useBeltOf()` replaces the old `beltOf()` fixture lookup keyed on "kway"/"mom". Unresolvable member → no chip, never a wrong one. |
| 58 | **A club holds weights, not dollars.** There is no cash ledger, so the dollar figure is an explicit practice stake (`fic_clubs.rules.startingValue`, default $10,000) grown by the club's own weighted return, and the UI says "practice stake". |
| 59 | **Returns are measured from the day of the event.** A holding's "since add" runs from `added_at`, a pick's from `created_at`. Too little history → "—". Never fall back to a longer window and relabel it. |
| 60 | **Polygon budget: cache first, degrade visibly.** `barsFor()` reads cache, then spends at most the remaining minute-budget (`spend: 0` for secondary widgets). A partly-priced club shows "3 of 6 priced" rather than a number that changes between renders. |
| 61 | **The screener is the real universe** (`screener_metrics`, ~11.7k listings, nightly cron) with Postgres-side filters in the URL. Filters map to columns that exist — the fixture's "P/E < 40" and "60%+ Buy" did not; "picked by FIC clubs" is now a real count. Default view excludes sub-$1 / thin-volume listings and 21-day moves over ±300% (splits and days-old listings), with a chip to include them. |
| 62 | **Kai answers for real.** `KaiSheet` streams `/api/kai/chat` (Phase 6) instead of seeding a scripted exchange and replying with a placeholder; markdown is rendered, not printed. |
| 63 | **"Why this matters" states a position, never an opinion.** News decorates a story with the reader's own holding or watchlist entry; where there is none it uses the market layer's honest framing template. |
| 64 | **The club's case for a company is its members' picks.** The company page renders bull/bear from real `fic_club_picks` reasons with attribution, and an empty state when nobody has argued a side. |

## LMS integration, 2026-08-29
| # | Decision |
|---|---|
| 65 | **One player, two paths.** `/lesson/[id]` runs the stepped engine when `lessons.steps` parses, else the legacy `video_provider` viewer; both end in the lesson's real quiz and a single `/api/learn/complete` that banks XP once. A lesson the member may not open renders its entitlement reason, not a 404. |
| 66 | **Recordings play from their real source.** YouTube recordings embed; uploaded classes stream from the private `class-recordings` bucket through a per-request signed URL (1h). No recording → say so; never a decorative play button. |
| 67 | **FTA's html lesson bundles stay where they are** for now (113 MB in FTA's `public/lessons`), loaded over the legacy origin and talking back through FTA's postMessage bridge (`isBridgeMessage`). They move with the host at cutover via `NEXT_PUBLIC_LEGACY_LESSON_ORIGIN`. |
| 68 | **The arcade lists what is playable.** Candle Battle and Trend or Trap (ported from FTA, real rounds in `game_items`), Term Match and the valuation drill. The invented catalogue of six mostly-unbuildable games is gone. |
| 69 | **Games pay XP server-side.** `/api/learn/game` records the session and awards XP only at ≥70% — the client no longer calls `awardXp` itself, matching lessons and quizzes. |
| 70 | **A tap always answers within a frame.** Every route group has a `loading.tsx`; without one Next holds the previous screen while the server renders, which reads as a dead button. Market waits are capped for render paths (`RENDER_WAIT` 2.5s / `SHORT_WAIT` 1.2s) and bar fetches to one per render — a page warms one new symbol per visit rather than stalling on six. |
| 71 | **Logos are the real company marks**, proxied through `/api/market/logo/[symbol]` because Polygon's branding URLs only resolve with the API key appended and can never reach a browser. A symbol with no logo (most ETFs) 404s and the brand-coloured ticker square shows through — the designed fallback, never a broken image. |

## Cutover — FIC is the live app, 2026-09-03
| # | Decision |
|---|---|
| 72 | **The cutover is a project swap behind one unchanged hostname.** `app.familyinvestingclub.com` moved from `fta-dashboard` to `family-investing-club`; the URL every third party already holds (both Stripe webhooks, Meta lead ads, the `dispatch_push_notification()` trigger, Supabase's Site URL) still resolves, so none of them were edited — each was verified against the new host instead. The plan's steps 3–5 were no-ops. |
| 73 | **FTA is kept running, not retired or redirected.** It holds the 113 MB of html lesson bundles and the un-ported admin pages, and it is now reached at `fta-dashboard-kways-clawds-projects.vercel.app`. Nothing on it was changed — no env edit, no redeploy — because the plan's "canonical host 308" step described middleware behaviour that does not exist (`src/middleware.ts` only redirects the `fta-dashboard-ruddy` host). |
| 74 | **`NEXT_PUBLIC_LEGACY_LESSON_ORIGIN` is load-bearing and must never be unset.** It defaults to the app host, which after the swap is FIC — where `/lessons/**` 404s. The 41 `video_provider='html'` lessons resolve against the FTA project alias until the bundles move. A `legacy.familyinvestingclub.com` CNAME (DNS lives at GoDaddy, not Vercel) would be the tidier home for it. |
| 75 | **Two projects on one database means one cron owner.** FIC's `vercel.json` mirrors FTA's 20 jobs exactly, so the deploy alone gave every job two runners against the same rows — duplicate drip emails, digests and pushes. FTA's crons are disabled at the project level (`disabledAt`); re-enabling them is only correct if FIC's are disabled in the same move. |
