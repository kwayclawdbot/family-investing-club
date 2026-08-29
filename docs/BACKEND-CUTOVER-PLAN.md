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

### Phase 2 — Club loop end-to-end
Wire the 12 existing `/api/club/*` routes to their sheets (only `PickSheet` calls the API today):
`AskClubSheet → api.ask`, `VoteSheet → api.vote`, `ComposeSheet → feed_posts` (new
`/api/club/post`, reusing FTA's `feed_posts` so the community feed is shared), `WatchlistView →
api.research`, notifications read/ack (`/api/notifications/ack` on FTA `notifications`), circles
(`club_circles*`), chat send (`chat_messages` + realtime). Enforce `vote_gated` in `/api/club/vote`.
Add the missing RLS UPDATE/DELETE policies flagged in the audit.

### Phase 3 — Learn on real content
- Lesson player reads `lessons.steps` (FTA `src/lib/learn/schema.ts` types copied into
  `src/lib/learn/`), legacy `video_provider` (youtube/html/bunny/mux) for the 90 non-stepped
  lessons, `quizzes` + `quiz_attempts`, `lesson_resources`.
- Writes: `lesson_progress`, `lesson_step_progress` (`touch_lesson_step_progress`), `quiz_attempts`,
  `flashcard_reviews`, `skill_mastery` (`bump_skill_mastery`), `xp_events` via `awardXp`.
- Live: `live_sessions` + `live_events` + RSVP (`session_rsvps`), recordings via signed URLs from
  `class-recordings`.
- Practice: `/api/practice/order` writing `sim_portfolios/positions/trades` at Polygon price,
  respecting `family_writes_allowed()`; games → `game_scores`.

### Phase 4 — Family & parent view
`/family/*` on `families`, `family_profiles`, `family_invites`, `child_report_stats`,
`family_guardrails` (+ `set_family_guardrail`), `family_activity_days`, `family_watchlist(+votes)`,
`family_night_sessions`. Parent view per learner = `child_report_stats` + `lesson_progress`.

### Phase 5 — Membership & billing
Port verbatim from FTA `src/lib/server/{membership,club-membership,challenge-vip,checkout-sessions,
payment-element,order-bumps}.ts` and routes `stripe/webhook`, `shop/webhook`, `club/checkout`,
`checkout/confirm`, `billing/portal`, `challenge/vip-checkout`. Both webhook endpoints keep their
`metadata.kind` filtering. `/profile/billing` reads `families.stripe_*` + `family_tiers`.

### Phase 6 — Platform services
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

### Phase 7 — Admin
Port `/admin/*` (CRM overview, contacts, marketing, funnels, help desk, families, challenge cohort,
push broadcast, announcements, shop orders/products, view-as) against the ~30 `admin_*` RPCs.
This is the last thing keeping FTA alive.

### Phase 8 — Cutover (after 2026-09-09)
1. Vercel env parity on `family-investing-club` (full list in §4); `CRON_SECRET`, VAPID, Stripe,
   Resend, Twilio, Anthropic, OpenAI, Polygon, FB, `MARKETING_TOKEN_SECRET`.
2. Supabase Auth → Redirect URLs: add FIC preview + prod origins; Site URL stays
   `https://app.familyinvestingclub.com`.
3. Stripe dashboard: point both webhook endpoints at the new host (same paths); verify with a
   test event.
4. Meta Lead Ads: update webhook URL, same `FB_LEADS_VERIFY_TOKEN`.
5. `dispatch_push_notification()`: leave the URL (it already targets `app.familyinvestingclub.com`);
   verify with a manual `notifications` insert after DNS moves.
6. Vercel: move `app.familyinvestingclub.com` from `fta-dashboard` → `family-investing-club`;
   attach `legacy.familyinvestingclub.com` to `fta-dashboard`; set
   `NEXT_PUBLIC_CANONICAL_HOST` on FTA so its middleware 308s to the new host for non-admin paths.
7. Smoke: login as parent / child / admin, lesson progress write, pick → vote → decision, push
   round-trip, Stripe test checkout, cron hit with `CRON_SECRET`.
8. Retire FTA when Phase 7 lands; delete `backend/`, `docker-compose.yml` (dead FastAPI).

## 3. Explicit non-goals
- No second Supabase project, no table copies, no `auth.users` re-import.
- No FTA schema edits (`202_curriculum_reset` stays unapplied).
- Brokerage aggregator, coordinated investing: unchanged (roadmap Phase 2+).

## 4. Env vars FIC needs by cutover
`NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY`
`NEXT_PUBLIC_SITE_URL` `POLYGON_API_KEY` `POLYGON_RPM` · `CRON_SECRET` · `PUSH_DISPATCH_SECRET`
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` `VAPID_PRIVATE_KEY` · `STRIPE_SECRET_KEY`
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` `STRIPE_WEBHOOK_SECRET` `SHOP_STRIPE_WEBHOOK_SECRET` ·
`ANTHROPIC_API_KEY` `OPENAI_API_KEY` · `RESEND_API_KEY` `MARKETING_FROM_EMAIL`
`MARKETING_TOKEN_SECRET` `TWILIO_*` `FB_LEADS_VERIFY_TOKEN` · `LULU_*` `SHOPIFY_*` (shop only).

## 5. Risk register
| Risk | Mitigation |
|---|---|
| Push dies silently after host move | Manual insert test in cutover step 5; add a `/api/push/health` that counts `notifications` vs `push_subscriptions` deliveries |
| Stripe events provision the wrong lane | Both endpoints ported with `metadata.kind` filter + unit test on the HMAC check |
| Child accounts lose protection | Phase 1 makes role/guardrails server-side before any community write path exists |
| Fixture data shown to real users | Phase 1 live-or-empty; `scripts/live-smoke.mjs` run in CI against a magic-link session |
| Two repos applying migrations | Only FIC applies from now; FTA repo is frozen at `b9f5b7e` |
| Challenge cohort 9/1–9/9 | No host or schema change during the window |
