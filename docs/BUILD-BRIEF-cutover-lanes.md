# Build brief — cutover lanes (Phases 2 · 3 · 4 · 7), 2026-08-28

Goal: bring the FTA dashboard's surfaces INTO this app so it can replace `app.familyinvestingclub.com`.
Plan + ground truth: `docs/BACKEND-CUTOVER-PLAN.md`. Decisions: `docs/DECISIONS.md` (#50–55 are the
Phase-1 rules every lane inherits). FTA source (read-only reference): `/Users/kwaysclawd/projects/fta-dashboard-v3`.

## Rules every lane follows
1. **Read `AGENTS.md` first** — this Next.js (16.3) differs from training data; the docs are in
   `node_modules/next/dist/docs/`. `proxy.ts` not middleware; `PageProps<"/route">` for params; params/searchParams are Promises.
2. **Same Supabase project as FTA.** Read FTA tables directly (profiles, families, lessons, …). Schema is
   **additive only**: new objects are `fic_*`. If you need a migration, write it to
   `supabase/migrations/2026MMDDHHMMSS_fic_<name>.sql` but **do not apply it** — report it; the lead applies.
3. **Live readers** live in `src/lib/live/<domain>.ts`: `import "server-only"`, use `userClient()` /
   `safe(label, fn)` / `must(res)` from `src/lib/live/supa.ts`, `getSession()` from `src/lib/live/session.ts`
   (it carries `profile`, `family`, `tier`; helpers `isChild/isAdmin/isParent`). Return `null` only when the
   domain genuinely has nothing; screens render an `EmptyState`, never a fixture, for signed-in members.
   Service role (`adminClient()`) ONLY for cross-tenant admin aggregates and only behind `isAdmin(session)`.
4. **Mutations** are route handlers under `src/app/api/<domain>/…/route.ts` using `requireSession()` /
   `bad/ok/dbError/readJson/awardXp` from `src/lib/live/route-utils.ts`. Browser wrappers go in a NEW file
   `src/lib/live/client-<domain>.ts` (same shape as `src/lib/live/client.ts`). Never write to localStorage for
   anything a signed-in member does.
5. **UI**: FIC's design system — Tailwind tokens `bg-card text-ink text-ink-2/3/4 border-line bg-paper
   bg-green-tint text-green bg-orange text-cream-text bg-gold-tint text-purple bg-coral …` (see
   `src/app/globals.css`), primitives from `src/components/ui` (`Card, Row, SectionHeader, Segmented, Sheet,
   StatTile, Tag, Toggle, EmptyState, ProgressBar, Avatar, BeltChip, Button, ButtonLink, LinkRow`), shell from
   `src/components/shell` (`TopBar`, `Screen`/`Content` in Phone.tsx). Match the look of an existing screen in
   the same tab (e.g. `src/app/(app)/learn/library/page.tsx`, `src/app/(app)/profile/settings/page.tsx`).
   Copy: warm, beginner-first, never "verified investor", XP never from money.
6. **File ownership is strict** (below). Do NOT edit files outside your lane — especially the shared seams
   `src/lib/data-live.ts`, `src/lib/live/index.ts`, `src/lib/live/client.ts`, `src/lib/types.ts`,
   `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `(app)/layout.tsx`, `BottomNav.tsx`, `package.json`.
   If you need a change there, put the exact patch in your report under "Integration needed".
7. **Verify**: `npm run typecheck` and `npx eslint <your files>` must pass. Do NOT run `next build` or a dev
   server (shared `.next`). Verify readers with a node script against the live DB using the pattern in
   `scripts/identity-smoke.mjs` (magic-link session as `kcoffie90@gmail.com`; a child test account can be
   minted the same way with `SMOKE_EMAIL`). Read-only SQL helper: copy `scripts/db-apply.mjs`'s auth and POST
   `{query, read_only: true}`. Never delete or update FTA rows except through the app's own routes as the test user.
8. **Report** (final message): files created/changed · tables/RPCs used · what's verified (paste the smoke
   output) · Integration needed (exact edits for shared seams) · gaps left.

## Lanes

### Lane LEARN — Phase 3, course content on real data
Owns: `src/lib/live/learning.ts`, `src/lib/learn/**` (new), `src/components/learn/**`, `src/components/lesson/**` (new),
`src/app/(full)/lesson/**`, `src/app/(app)/learn/**`, `src/app/(app)/live/**`, `src/app/api/learn/**` (new),
`src/lib/live/client-learn.ts`, `src/lib/live/practice.ts`, `src/app/(app)/practice/**`, `src/app/api/practice/**` (new).
- Lesson player for the 13 `lessons.steps` lessons (port the step schema from FTA `src/lib/learn/schema.ts` and the
  behaviour of `src/components/learn/LessonEngine/**`, restyled) and the 90 legacy lessons (`video_provider`
  youtube | html | bunny | mux → FTA `src/components/dashboard/VideoPlayer.tsx`), `lesson_resources`, `quizzes`.
- Writes: `lesson_progress`, `lesson_step_progress` (RPC `touch_lesson_step_progress`), `quiz_attempts`,
  `flashcard_reviews`, `skill_mastery` (RPC `bump_skill_mastery`), XP via `awardXp`.
- Learn hub/library/path pages on `courses → modules → lessons` with real progress; `/learn/review` on
  `flashcards` + `flashcard_reviews`; `/live` on `live_sessions` + `live_events` + `session_rsvps`, recordings via
  signed URLs from bucket `class-recordings`.
- Practice: `/api/practice/order` writing `sim_portfolios/positions/trades` at the Polygon price
  (`src/lib/live/market-bridge.ts`), respecting FTA's `family_writes_allowed()` (RLS will refuse — surface the message).

### Lane FAMILY — Phase 4, parent & kid profiles
Owns: `src/lib/live/family.ts` (new), `src/components/family/**`, `src/app/(app)/family/**`, `src/app/join/**` (new),
`src/app/api/family/**` (extend `invite`/`join`, add more), `src/lib/live/client-family.ts`, `src/app/(app)/profile/**`
(only the member-facing profile pages: settings, badges, progress, notifications — NOT billing/brokerage).
- Household on `families`, `family_profiles`, `profiles` (kids = `role='child'`, `age_group kids|teens`),
  `family_invites` (parents create; kids sign up then redeem — build `/join/[code]`: signed-out → signup with
  `?next=/join/CODE`, signed-in → `POST /api/family/join`).
- Parent view per learner: `child_report_stats(p_child)`, `lesson_progress`, `xp_events`, `badge_awards`;
  guardrails on `family_guardrails` (RPC `set_family_guardrail`) + `family_activity_days`; `family_watchlist`
  (+ `family_watchlist_votes`), `family_night_sessions`, `report_notes`. Study FTA `src/app/(dashboard)/family/**`.
- Kid experience: the child shell already switches via `isChild()`; make `/home` for a child, `/family` for a kid
  (read-only), and profile settings (display name, avatar to bucket `community-media` own-prefix) real.
- Profile settings: real `profiles` writes (display_name, username via `ensure_username` trigger, avatar_url,
  notification_prefs) and password change via Supabase auth.

### Lane CLUB — Phase 2, close the club loop
Owns: `src/components/sheets/**`, `src/components/home/**`, `src/components/club/**`, `src/components/community/**`,
`src/components/circles/**`, `src/components/markets/WatchlistView.tsx`, `src/components/profile/NotificationsV3.tsx`,
`src/app/api/club/**`, `src/app/api/notifications/**` (new), `src/app/api/community/**` (new), `src/lib/live/club.ts`,
`src/lib/live/community.ts`, `src/lib/live/notifications.ts`, `src/lib/live/watchlist.ts`, `src/app/(app)/club/**`,
`src/app/(app)/community/**`, `src/app/(app)/circle/**`, `src/app/(app)/home/**`.
- Wire every sheet to the existing routes (`AskClubSheet → ask`, `VoteSheet → vote`, `WatchlistView → research`,
  brokerage UI → `brokerage`), replacing `localStorage` writes for signed-in members (keep the local path only when
  the API answers 401 = demo visitor).
- Community posts: `POST /api/community/post` onto FTA `feed_posts` (+ `post_likes`, `post_comments`) so the feed is
  shared with FTA until cutover; ComposeSheet uses it. Circles on `club_circles*`; chat send on `chat_messages`.
- Notifications: `/profile/notifications` renders live `notifications`; `POST /api/notifications/ack`.
- Enforce `vote_gated` in `/api/club/vote`; add the missing RLS UPDATE/DELETE policies for `fic_club_pick_replies`,
  `fic_club_asks`, and restrict `fic_club_research` UPDATE to assignee/founder/admin — as a migration file (not applied).

### Lane ADMIN — Phase 7, admin & CRM inside FIC
Owns: `src/app/(admin)/**` (new route group, NO phone shell — a desktop layout with a left nav, gated by
`isAdmin(await getSession())` → `redirect("/home")`), `src/components/admin/**` (new), `src/lib/live/admin-crm.ts` (new),
`src/app/api/admin/**` (new), `src/lib/live/client-admin.ts`. Do not touch `src/lib/live/admin.ts` (consensus).
- Port FTA `src/app/(admin)/admin/**` in this priority: overview (`admin_crm_overview`, `admin_daily_activity`),
  members + member detail (`admin_contacts`, `admin_member_activity`, `admin_member_timeline`, view-as →
  `src/lib/server/view-as.ts` pattern), families + family detail (`admin_family_detail`, `admin_set_family_tier`,
  `admin/invite` route = service-role membership provisioning), leads/pipeline/campaigns/drips
  (`admin_marketing_*`, `marketing_leads`, `email_drips`), funnel (`admin_funnel_analytics`), support/help desk
  (`admin_help_tickets*`, `help_messages`), challenge cohort (`admin_challenge_*`), announcements + push broadcast
  (`admin_post_announcement`, `admin_push_broadcast`), courses (list/edit `courses/modules/lessons`, publish
  drafts via `publish_lesson_draft`), live sessions, users. Read each FTA page + the RPC it calls; keep the RPC,
  rebuild the page. Sends (Resend/Twilio) may be stubbed behind `RESEND_API_KEY`-present checks — port FTA
  `src/lib/server/marketing.ts` only if time allows; report what's stubbed.
- Register `/admin` and `/api/admin` as protected in your Integration-needed notes (proxy) — don't edit proxy.
