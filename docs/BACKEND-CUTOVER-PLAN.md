# Backend Cutover Plan — FIC replaces the FTA dashboard

Written 2026-08-28. Goal: `app.familyinvestingclub.com` serves **family-investing-club** instead of
**fta-dashboard**, with every user, family, enrollment, course, lesson, progress row and setting
carried over intact.

## 0. Ground truth (verified against the live project, not the migration files)

| Fact | Value |
|---|---|
| Supabase project | `zvkercqohmmeyofycbgr` — **shared by both apps already** |
| Live host → app | `app.familyinvestingclub.com` → Vercel `fta-dashboard` · `familyinvestingclub.com` → `fic-marketing` · FIC → Vercel `family-investing-club` (no custom domain yet) |
| Users | 34 `auth.users` (23 parents · 6 children · 3 admins · 1 coach), 9 active in last 30 days |
| Families / billing | 23 families (`plan_tier` academy=5 · challenge=18; `door` club=5 · family=18), 16 active `enrollments`, 0 rows with a Stripe subscription id |
| Curriculum | 12 published courses (28 unpublished) · 42 modules · **103 live lessons** (13 interactive `steps` lessons) · 28 quizzes · 378 flashcards · 10 live sessions. Migration 202 ("curriculum reset") was **never applied** — the catalogue is intact |
| Progress | 57 `lesson_progress` (9 users) · 47 `quiz_attempts` · 67 `flashcard_reviews` · 201 `xp_events` · 16 badges |
| Community | 93 `feed_posts` · 7 chat rooms · 9 messages · 229 notifications · 5 push subscriptions |
| CRM | 826 `marketing_leads` · 25 email drips · 2 campaigns |
| Big/regenerable | `screener_history` 1.0M rows, `screener_metrics` 11.7k (rebuilt by `cron/refresh-screener` + `scripts/bootstrap-screener.mjs`) |
| Storage | `class-recordings` (private, 3) · `coach-audio` (public, 26) · `community-media` (public, 4) · `print-files` (0) |
| Outbound DB hook | `public.dispatch_push_notification()` → `net.http_post('https://app.familyinvestingclub.com/api/push/dispatch')`, secret from Vault `push_dispatch_secret`, **failures swallowed silently** |
| Migration ledger | 54 entries in `supabase_migrations.schema_migrations` (20260718… → 20260827120100) |
| Live-event constraint | `app_settings.challenge_start = 2026-09-01`, `challenge_end = 2026-09-09` — a paid cohort runs next week |

**Consequence:** there is no data migration between databases. The work is (a) FIC reading and
writing every FTA-owned domain, (b) porting the server-side machinery FTA runs today, (c) a DNS/env
cutover. Users log in with the same credentials the day after.

## 1. Principles

1. **Additive schema only.** FTA tables/RLS/RPCs are not altered until FTA is retired. New objects
   are `fic_*` and applied through `scripts/db-apply.mjs` with a matching `supabase/migrations` file.
2. **Signed-in users never see fixtures.** Today `data-live.ts` silently falls back to demo data on
   any `null` — an outage is invisible. After Phase 1, production renders live-or-empty; fixtures
   only on preview deploys / `FIC_DEMO=1`.
3. **Family is the tenant.** Billing, entitlement (`enrollments` → `family_tiers`), `door` and child
   accounts hang off `families`. A FIC club is a social object *inside* a family — one club is
   auto-created per family (`fic_clubs.family_id`) so every existing member lands in a club on day 1.
4. **Cut the host over once, after 9/9.** The challenge cohort runs on FTA untouched. FTA stays
   reachable at `legacy.familyinvestingclub.com` for admin/CRM until those are ported.
5. **Port infrastructure verbatim, product surfaces by design.** Webhooks, crons, push, Kai and
   admin RPC callers copy over with their tests; UI-facing reads are rewritten against FIC screens.

## 2. Phases

### Phase 0 — Safety net ✅ (done 2026-08-28)
- `~/projects/fta-dashboard-v3` rescued from an orphaned worktree into a standalone git repo
  (commit `b9f5b7e`, 2,502 files, secrets excluded).
- JSON export of every public table (except `screener_history`) + `auth.users` (no secrets) +
  functions / policies / triggers / views / columns snapshot → session scratchpad `backup/`.
- Read-only query helper (`q.mjs`) using the Supabase CLI keychain token, same auth as `db-apply`.

### Phase 1 — Identity foundation (FIC) ✅ (done 2026-08-28)
Shipped: `src/proxy.ts` + `src/lib/supabase/{proxy,jwks}.ts` · `src/lib/live/{session,mode,demo}.ts` ·
`(app)/layout.tsx` gate + `BottomNav child` prop · `/api/onboarding/{family,complete}` ·
`/api/family/{invite,join}` · `supabase/migrations/20260829000000_fic_family_clubs.sql`
(`fic_ensure_family_club`, `fic_backfill_family_clubs`, `fic_sync_family_members`, xp clubmates
policy) — applied; backfill run (Mensah → The Coffie Family, 11 clubs created). Verified: `next build`,
proxy smoke on the production server (307 → `/login?next=`, API 401, `fic_ref` cookie),
`scripts/identity-smoke.mjs` (session fields, RPC idempotency, service-role-only backfill).
Not yet: `/join/[code]` page (Phase 2), `vote_gated` enforcement (Phase 2).

Deliverables in `family-investing-club`:
- **`proxy.ts` (Next 16 middleware):** session refresh via `getClaims` + JWKS (port of FTA's
  `src/lib/supabase/middleware.ts`), protected app routes → `/login`, signed-in users bounced off
  `/login|/signup`, `?ref=` referral cookie capture.
- **Role-driven experience, server-side.** `getSession()` already loads `profiles`; child shell,
  `levelOf`, vote gating and admin gating derive from `profiles.role/age_group/family_id` and
  `families.door`, not `localStorage["fic.level"]`.
- **Onboarding writes.** `/onboarding/*` calls `onboard_create_family` (solo/family), parent
  invites → `family_invites`, child join → `redeem_invite`. Then auto-provision the family's club
  via `fic_create_club` and `fic_club_members` for every profile in the family (new RPC
  `fic_ensure_family_club(family_id)`; also run once as a backfill for the 23 existing families).
- **Live-or-empty.** `pick()` in `data-live.ts` gets a third state: `live` returns `null` →
  render empty state, log to server. Fixture fallback only when `dataMode() === "demo"`.
- **Entitlement helper.** `getEntitlement()` reads `family_tiers` + `enrollments` + `families.door`;
  a single place for "free / challenge / academy / club" gating.

### Phase 2 — Club loop end-to-end ✅ done 2026-08-28 (`npm run smoke:club` 10/10)
Shipped: live readers for club/community/notifications/watchlist; `/api/community/{post,post/like,post/comment,chat,circle,circle/note,circle/join}`, `/api/notifications{,/ack}`, `/api/club/{chat,context}`; every sheet wired to its route (local path only on 401); `vote_gated` enforced; migration `20260829010000_fic_club_rls_gaps.sql` **applied** (author update/delete on replies + asks; research UPDATE limited to assignee/founder/admin).

Wire the 12 existing `/api/club/*` routes to their sheets (only `PickSheet` calls the API today):
`AskClubSheet → api.ask`, `VoteSheet → api.vote`, `ComposeSheet → feed_posts` (new
`/api/club/post`, reusing FTA's `feed_posts` so the community feed is shared), `WatchlistView →
api.research`, notifications read/ack (`/api/notifications/ack` on FTA `notifications`), circles
(`club_circles*`), chat send (`chat_messages` + realtime). Enforce `vote_gated` in `/api/club/vote`.
Add the missing RLS UPDATE/DELETE policies flagged in the audit.

### Phase 3 — Learn on real content ✅ done 2026-08-28 (`npm run smoke:learn` 17/17)
Shipped: `src/lib/learn/{schema,types,server,legacy}.ts` (FTA step schema ported), `src/components/lesson/{steps,engine-ui}.tsx`, `/api/learn/{progress,step,quiz,flashcard,mastery,complete,rsvp,real-world}`, `/api/practice/order`, `src/lib/live/learning.ts` (403 lines) over the 12 published courses / 103 live lessons.

- Lesson player reads `lessons.steps` (FTA `src/lib/learn/schema.ts` types copied into
  `src/lib/learn/`), legacy `video_provider` (youtube/html/bunny/mux) for the 90 non-stepped
  lessons, `quizzes` + `quiz_attempts`, `lesson_resources`. **The readers and routes landed in
  Phase 3; the lesson *page* was only mounted on 2026-08-29 (Phase 7.6) — until then every lesson
  opened a fixture quiz.**
- Writes: `lesson_progress`, `lesson_step_progress` (`touch_lesson_step_progress`), `quiz_attempts`,
  `flashcard_reviews`, `skill_mastery` (`bump_skill_mastery`), `xp_events` via `awardXp`.
- Live: `live_sessions` + `live_events` + RSVP (`session_rsvps`), recordings via signed URLs from
  `class-recordings`.
- Practice: `/api/practice/order` writing `sim_portfolios/positions/trades` at Polygon price,
  respecting `family_writes_allowed()`; games → `game_scores`.

### Phase 4 — Family & parent view ✅ done 2026-08-28 (`npm run smoke:family` 8/8)
Shipped: `src/lib/live/family.ts` (482 lines), `/join/[code]` invite door, `/api/family/{invite,join,members,me,me/avatar,me/password,guardrail,activity,watchlist,watchlist/vote,mission,night,note}`, family + parent-view + profile-settings pages on real tables. Time-relative values (`activeToday`, `practiceStale`, `activityWeek`) are computed in the reader so pages stay render-pure.

`/family/*` on `families`, `family_profiles`, `family_invites`, `child_report_stats`,
`family_guardrails` (+ `set_family_guardrail`), `family_activity_days`, `family_watchlist(+votes)`,
`family_night_sessions`. Parent view per learner = `child_report_stats` + `lesson_progress`.

### Phase 5 — Membership & billing ✅ done 2026-08-28
Shipped: both Stripe webhooks with `metadata.kind` filtering (hand-rolled HMAC, no SDK), `/api/club/checkout`, `/api/checkout/confirm`, `/api/billing/portal`, `src/lib/server/{membership,club-membership,challenge-vip,checkout-sessions,payment-element,pe-session,order-bumps}.ts`, and `/profile/billing` on `families.stripe_*` + `family_tiers`. Hosted Stripe only (no embedded checkout page yet). **0 of 23 families carry a `stripe_customer_id`** — a one-time backfill is still needed before the portal is useful.

Port verbatim from FTA `src/lib/server/{membership,club-membership,challenge-vip,checkout-sessions,
payment-element,order-bumps}.ts` and routes `stripe/webhook`, `shop/webhook`, `club/checkout`,
`checkout/confirm`, `billing/portal`, `challenge/vip-checkout`. Both webhook endpoints keep their
`metadata.kind` filtering. `/profile/billing` reads `families.stripe_*` + `family_tiers`.

### Phase 6 — Platform services ✅ done 2026-08-28 (`npm run smoke:platform` 19/19)
Shipped: `/api/push/{dispatch,email-fallback,resubscribe,health}` + `public/sw.js` + `src/lib/push-client.ts`; all 20 crons in `vercel.json` with `CRON_SECRET` gating (`/api/club/refresh` → `/api/cron/club-refresh`, since `/api/club/*` is cookie-protected); Kai/coach/help; marketing + drips + auth email. 36 routes + 56 server modules. `scripts/platform-smoke.mjs` 19/19 (Stripe HMAC accept/reject/tamper/stale, push payload validation, cron auth).

- **Push:** `/api/push/dispatch` (+ `email-fallback`, `resubscribe`), `public/sw.js`, subscribe UI;
  same `PUSH_DISPATCH_SECRET` (must equal Vault `push_dispatch_secret`).
- **Crons (20 in FTA `vercel.json`):** carry `refresh-screener`, `track-performance`,
  `news-market-wrap`, `news-ticker-events`, `kai-feed-seed`, `evaluate-alerts(+intraday)`,
  `alerts-digest`, `drip-welcome`, `fic-week-rollover`, `live-events`, `club/refresh`,
  `expire-challenge-passes`, `club-clock`, `challenge-*`. Decide per cron: port / retire.
- **Kai:** `kai/chat`, `kai/deep-mode`, `kai-watch/parse`, `coach`, `help/chat` (Anthropic +
  OpenAI Whisper), tables `kai_chat_threads/messages`, `kai_user_memory`.
- **Marketing/CRM:** `marketing/fb-leads` webhook, `campaigns/send` (Resend + Twilio),
  `unsubscribe`, drips. Admin pages stay on FTA at `legacy.` until Phase 7.
- **Auth email:** `auth/reset`, `auth/password-status` (Resend).

### Phase 7 — Admin ✅ done 2026-08-28 (`npm run smoke:admin`)
`src/lib/live/admin-crm.ts`, 20 `/api/admin/*` routes, 11 components and **17 pages** under `src/app/(admin)/admin/**`:
overview · members (+detail, view-as) · families (+detail, tier, invite) · leads · pipeline · campaigns ·
drips · support · announcements (+push broadcast) · courses (+editor, drafts) · live sessions · funnel ·
challenge. Desktop shell (no phone chrome), every page gated on `isAdmin(getSession())` → `/home`.
Smoke reads live: 853 contacts · 826 leads · 23 families · 103 lessons · 45 step lessons (36 with unpublished drafts).
Not ported: shop orders/products admin (FTA's `/admin/shop`), coach-demos, community-watchlist, picks.

Port `/admin/*` (CRM overview, contacts, marketing, funnels, help desk, families, challenge cohort,
push broadcast, announcements, shop orders/products, view-as) against the ~30 `admin_*` RPCs.
This is the last thing keeping FTA alive.

### Phase 7.5 — Make it real ✅ done 2026-08-29
Every member-facing surface reads live rows; the fixture seam survives only as the signed-out demo.
Shipped: `IdentityProvider` + `lib/belts.ts` (belts resolve against real club members) ·
`lib/live/club-performance.ts` (model portfolio priced from Polygon bars: since-add, weighted YTD, SPY
benchmark, decision markers, allocation; budget-aware, degrades to "N of M priced") ·
`getOfficialPicks` / `getDecisionRecord` (proposals → votes → decisions → holdings) ·
`lib/live/me-performance.ts` (own picks, measured from the day of each) ·
`lib/live/discover.ts` (cards from holdings/research/picks/watchlist; theme baskets priced) ·
`lib/live/screener.ts` (the ~11.7k-row `screener_metrics` universe, filtered in Postgres) ·
`lib/live/newsfeed.ts` (Polygon stories for what you hold and watch + the desk wrap) ·
`KaiSheet` → `/api/kai/chat` (streamed, markdown rendered) · Learn hub → `getLearnHub()` (the real
curriculum, live sessions, review deck, weakest skills) · circles end-to-end (`club_circles`) ·
Search over real circles, club-mates and courses. Deleted five dead prototype components.
Decisions #56–64. Known data gaps surfaced honestly rather than filled: `screener_metrics.mcap`/`sector`
are populated for only ~20 of 11.7k rows until the nightly round-robin catches up.

### Phase 7.6 — The LMS actually plays ✅ done 2026-08-29
Phase 3 built the whole learning layer — `getLessonData()`, the ported step engine
(`components/lesson/{steps,engine-ui}.tsx`), `/api/learn/*` — but nothing imported it: `/lesson/[id]`
rendered a fixture quiz for all 103 lessons, and `/live/[id]` showed a placeholder saying the live
engine wasn't wired. Both are now mounted:
- `components/lesson/LessonView.tsx` runs the step engine for the 13 stepped lessons (resuming from
  `lesson_step_progress`, mastery per graded step), the legacy viewer for the ~90 video lessons
  (including the FTA html bundles over the postMessage bridge), then the lesson's real quiz, then
  `/api/learn/complete` to bank XP once. Resources and prev/next come from the same reader.
- `components/live/SessionView.tsx` plays recordings for real: YouTube embeds, and uploaded classes
  through a signed URL from the private `class-recordings` bucket (verified: 206 `video/mp4`).
  RSVP writes `session_rsvps`; worksheet, assignment and tickers render from the row.
Verified: a stepped lesson (Kids Corner, step 3/12, real authored question), a video lesson
(Introduction to Financial Markets → the real FTA bundle iframe), a recording streaming from
storage, and `smoke:learn` 17/17.
**Games ported 2026-08-29 (Phase 7.7):** Candle Battle and Trend or Trap now run in FIC at
`/learn/games/{candle-battle,trend-or-trap}`, reading their 24 authored rounds each from `game_items`.
XP moved server-side (`/api/learn/game` writes `game_scores` and pays only on a pass) — FTA awarded it
from the client. FTA's `club-b-*` card classes are re-expressed in FIC tokens in `globals.css`; its
icon, `f0/parts` and entitlement dependencies were replaced with local equivalents, and `framer-motion`
is the one new dependency (code-split behind `MotionProvider`, mounted only on the game routes).

### Phase 8 — Cutover: REHEARSED AND ROLLED BACK 2026-09-03
**Status: NOT cut over. `app.familyinvestingclub.com` serves `fta-dashboard` (the old app), as before.**

The 9/9 freeze was lifted (the challenge cohort was cancelled), so the full cutover was executed —
and reversed the same day on the owner's call: **the new app is not ready to face members.** Its
blockers are product, not infrastructure:
- placeholder copy still on member-facing screens;
- the LMS does not show all course content accurately.

Both are tracked in `docs/GO-LIVE-BLOCKERS.md`. The infrastructure below is proven and can be re-run
in minutes when the product is ready — treat this section as the rehearsal record, not history.

**Reverted:** domain moved back to `fta-dashboard`; FTA's crons re-enabled and FIC's disabled (one
owner only — see below); `NEXT_PUBLIC_SITE_URL` back to `https://family-investing-club.vercel.app`
and FIC redeployed. Verified after: the old app answers on the domain and its lesson bundles serve
from it again; the new app answers on its own Vercel URL.

**Kept, because each was a fix rather than a cutover step:** the `MARKETING_FROM_EMAIL` correction,
the `NEXT_PUBLIC_LEGACY_LESSON_ORIGIN` value (correct in both directions), and the two additions to
Supabase's redirect allowlist.

#### What the rehearsal proved (all of it verified against the live host while it was cut over)
The sequence that worked, in order:
1. **Pre-flight** — `next build` green, all 6 API smoke suites green (identity · platform 19 ·
   admin · learn 17 · family 8 · club 10) against the live DB.
2. **Env** — parity was already in place (23 production vars, copied 2026-08-29). Three corrections:
   - `MARKETING_FROM_EMAIL` held **literal double quotes inside the value** (`""Family Investing
     Club <hello@…>""` on pull, vs FTA's clean value) — every Resend send would have carried a
     malformed From header. Re-set without them.
   - `NEXT_PUBLIC_SITE_URL` was still `https://family-investing-club.vercel.app` → the app host.
   - `NEXT_PUBLIC_LEGACY_LESSON_ORIGIN` **set for the first time** (see step 5).
   Then redeployed production, because `NEXT_PUBLIC_*` is inlined at build time — an env edit alone
   would not have reached the client bundle.
3. **Supabase Auth** — Site URL was already correct. Added `https://app.familyinvestingclub.com/**`
   and `https://family-investing-club-*-kways-clawds-projects.vercel.app/**` to the redirect allowlist.
4. **Domain move** — `app.familyinvestingclub.com` DELETEd from `fta-dashboard` and POSTed to
   `family-investing-club` via the Vercel API, back to back (3.3 s gap, verified: true).
5. **The one real landmine: the 41 `video_provider='html'` lessons.** Their bundles live in FTA's
   `public/lessons` (113 MB) and were served *only* by whatever project held the app domain — the
   default origin in `src/lib/learn/legacy.ts` is the app host itself. Moving the domain would have
   404'd all 41 (confirmed: that path now 404s on the new host). `legacy.familyinvestingclub.com` was
   not available — DNS is at GoDaddy (`ns61/ns62.domaincontrol.com`), not Vercel, and no registrar
   credentials exist here. Used `https://fta-dashboard-kways-clawds-projects.vercel.app` instead: a
   stable project alias that serves the bundles 200 and is *not* caught by FTA's canonical redirect.
6. **FTA crons disabled** — not in the original plan and the most dangerous omission in it. FIC's
   `vercel.json` mirrors FTA's 20 cron definitions 1:1, and both projects point at the same database,
   so from the moment FIC deployed, every job (drip emails, alert digests, challenge pushes,
   `club-refresh` every 15 min) had two runners. Disabled on `fta-dashboard` via
   `PATCH /v1/projects/{id}/crons {enabled:false}` (`disabledAt` set); FIC's 20 remain enabled.
7. **Verified on the live host** — 28/28 screens rendered in Chromium under a real magic-link session
   (`BASE=https://app.familyinvestingclub.com npm run smoke:render`, member + admin, 0 failed); an
   html lesson's iframe resolving to the legacy origin and fetching 200; signed-out `/home` → `/login`
   and `/admin` → `/login?next=/admin`; API 401; both Stripe webhooks rejecting a bad signature (400);
   cron and push refusing without their secrets (401); the Meta lead-ads handshake echoing
   `hub.challenge` with the right token and 403 with a wrong one; and a full push round-trip —
   `notifications` insert → DB trigger → FIC → `{"ok":true,"sent":1}` → `dispatched_at` stamped
   (test row removed).

**Plan corrections found during execution:**
- Steps 3, 4 and 5 of the original plan (repoint Stripe, repoint Meta, re-verify push) were **no-ops**:
  the hostname did not change, only the project behind it, so every external callback URL still
  resolves. Verified rather than edited. Nothing in any third-party dashboard was touched.
- Step 6's "set `NEXT_PUBLIC_CANONICAL_HOST` on FTA so its middleware 308s to the new host for
  non-admin paths" **describes behaviour FTA does not have**: `src/middleware.ts` only redirects when
  `host === "fta-dashboard-ruddy.vercel.app"`. FTA was therefore left completely untouched — no env
  change, no redeploy — which is also why the lesson bundles kept serving.

**Left for the owner (neither blocks anything):**
- Add a GoDaddy CNAME `legacy.familyinvestingclub.com → cname.vercel-dns.com`, attach it to
  `fta-dashboard`, and repoint `NEXT_PUBLIC_LEGACY_LESSON_ORIGIN` at it, so the lesson bundles do not
  depend on a Vercel-generated alias. Cosmetic and durability, not correctness.
- `stripe_customer_id` backfill (still null on all 23 families) before the billing portal is used.

9. Retire FTA when the un-ported admin pages (shop orders/products, coach-demos, community-watchlist,
   picks) are either ported or abandoned; the 113 MB of lesson bundles must move first. Then delete
   `backend/`, `docker-compose.yml` (dead FastAPI).

## 3. Explicit non-goals
- No second Supabase project, no table copies, no `auth.users` re-import.
- No FTA schema edits (`202_curriculum_reset` stays unapplied).
- Brokerage aggregator, coordinated investing: unchanged (roadmap Phase 2+).

## 4. Env vars FIC needs by cutover

**Vercel state (checked 2026-08-28):** `fta-dashboard` has 41 production vars; `family-investing-club`
has 4 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`POLYGON_API_KEY`). Copy these **20** from `fta-dashboard` → `family-investing-club` at cutover
(values already merged into FIC's local `.env.local`, which is gitignored):

`ANTHROPIC_API_KEY` `OPENAI_API_KEY` `RESEND_API_KEY` `MARKETING_FROM_EMAIL` `MARKETING_TOKEN_SECRET`
`FB_LEADS_VERIFY_TOKEN` `TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_PHONE_NUMBER`
`STRIPE_SECRET_KEY` `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` `STRIPE_WEBHOOK_SECRET`
`SHOP_STRIPE_WEBHOOK_SECRET` `PUSH_DISPATCH_SECRET` `VAPID_PRIVATE_KEY`
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` `CRON_SECRET` `LULU_API_BASE` `SHOPIFY_STORE_DOMAIN`
`NEXT_PUBLIC_SITE_URL` (retarget to the FIC origin).

**Deliberately NOT copied:** `NEXT_PUBLIC_API_URL` (dead FastAPI backend), `NEXT_PUBLIC_DESIGN_V2`
(FTA-only design flag), `POSTGRES_*` / `SUPABASE_JWT_SECRET` / `SUPABASE_SECRET_KEY` /
`SUPABASE_PUBLISHABLE_KEY` (Vercel–Supabase integration leftovers the code never reads),
`NEXT_PUBLIC_CANONICAL_HOST` (set on **FTA** at cutover so it 308s to the new host, not on FIC).
`PUSH_DISPATCH_SECRET` must keep matching Supabase Vault `push_dispatch_secret` — the DB trigger
sends it, and a mismatch kills push silently.

### Full reference
`NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY`
`NEXT_PUBLIC_SITE_URL` `POLYGON_API_KEY` `POLYGON_RPM` · `CRON_SECRET` · `PUSH_DISPATCH_SECRET`
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` `VAPID_PRIVATE_KEY` · `STRIPE_SECRET_KEY`
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` `STRIPE_WEBHOOK_SECRET` `SHOP_STRIPE_WEBHOOK_SECRET` ·
`ANTHROPIC_API_KEY` `OPENAI_API_KEY` · `RESEND_API_KEY` `MARKETING_FROM_EMAIL`
`MARKETING_TOKEN_SECRET` `TWILIO_*` `FB_LEADS_VERIFY_TOKEN` · `LULU_*` `SHOPIFY_*` (shop only).

## 5. Verification (all green, 2026-08-28) — `npm run smoke`
| Suite | Checks | Covers |
|---|---|---|
| `smoke:identity` | session, RPC idempotency, service-role-only backfill | Phase 1 |
| `smoke:platform` | 19 — Stripe HMAC accept/reject/tamper/stale, push payload, cron auth | Phases 5–6 |
| `smoke:admin` | every admin RPC + signed-out denial | Phase 7 |
| `smoke:learn` | 17 — curriculum reads, stepped + legacy lessons, 6 write paths, practice order buy→sell | Phase 3 |
| `smoke:family` | 8 — household, learner report, guardrails, invites, profile writes | Phase 4 |
| `smoke:club` | 10 — club objects, ask/reply/reaction, community post+like+comment, notifications, research RLS | Phase 2 |
| `smoke:render` | 28 — every member + admin screen loaded in Chromium under a real magic-link session | all |

Every suite runs as a real magic-link session (RLS enforced), writes only rows it created, and restores
them — the ground-truth counts in §0 are unchanged after a run. `smoke:render` needs a built server
(`npm run build && npx next start -p 3103`) and writes `proof/live/*.png`.

Runtime checks on the built server: signed-out `/home` → `/login`, `/admin` → `/login?next=/admin`,
`/join/CODE` → `/signup?next=…`; every member/admin API answers 401; `/api/stripe/webhook` rejects a
bad signature; `/api/cron/*` refuses without `CRON_SECRET`; `/api/push/dispatch` refuses without the
secret and, with it, delivered a real push (`{ok:true,sent:1}`).

## 6. Risk register
| Risk | Mitigation |
|---|---|
| Push dies silently after host move | Manual insert test in cutover step 5; add a `/api/push/health` that counts `notifications` vs `push_subscriptions` deliveries |
| Stripe events provision the wrong lane | Both endpoints ported with `metadata.kind` filter + unit test on the HMAC check |
| Child accounts lose protection | Phase 1 makes role/guardrails server-side before any community write path exists |
| Fixture data shown to real users | Phase 1 live-or-empty; `scripts/live-smoke.mjs` run in CI against a magic-link session |
| Two repos applying migrations | Only FIC applies from now; FTA repo is frozen at `b9f5b7e` |
| Challenge cohort 9/1–9/9 | No host or schema change during the window |

## 7. Known gaps carried into cutover
- **`stripe_customer_id` is null on all 23 families** — the billing portal needs a one-time Stripe backfill.
- **`child_report_stats` refuses `role='admin'`** (it demands exactly `parent`); FIC's computed fallback now
  mirrors the RPC's denominator (`program='fic'` lessons on the learner's track, not all 103), but a real
  parent account gets the richer report. Fixing it means altering an FTA function — deferred until FTA retires.
- **Zero open circles** — every `club_circles` row has expired, so circle surfaces render empty. Data, not code.
- **Not yet exercised by smoke:** `/api/club/{vote,propose,pick}`, chat sends, family-night XP fan-out — each
  mutates a real club object; they need a throwaway club to test safely.
- **Admin pages not ported:** shop orders/products, coach-demos, community-watchlist, picks (FTA keeps
  serving those at `legacy.` until someone needs them in FIC).
- **No embedded checkout page** — hosted Stripe only; VIP success still points at FTA while the cohort runs.
