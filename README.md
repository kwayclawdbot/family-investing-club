# Family Investing Club

Standalone member app for **Family Investing Club** — the beginner-first, family-first investing
education product. Built from the Claude Design canvas (`design/Family Investing Club.dc.html`) and
the product docs in `docs/`. Separate codebase from `cheatcode-ai`; runs on the existing FTA Supabase
project (keep the engine, rebuild the experience).

```bash
cp .env.local.example .env.local   # Supabase URL + anon key
npm install
npm run dev                        # http://localhost:3100
npm run proof                      # screenshots of every screen → proof/
```

## Map (68 routes) — Product Shift v3: club-first
- `src/app/(onboarding)` — Welcome + 5-step onboarding
- `src/app/(app)` — tabbed shell: Home · Discover · **Club** · Learn · Profile (child accounts: Home · Learn · Practice · Family · Me)
  - Club (My Club): feed with Picks/Ideas/Votes, research list, members, create club, pick composer + thread, proposal composer, vote, club portfolio + decision journal; `/community` = the public network
  - Learn: path map, library, path detail, review (flashcards), games (+ Term Match), chart practice, scenarios; `/live` classes + recordings
  - Discover: search, curated categories, company page (club social layer + dossier) (tap-to-learn metrics, news, community), watchlist, news, discover; `/practice` + simulated order flow; `/search`
  - Club: structured feed, idea composer, idea detail + discussion, model portfolio (proposals/votes), groups, challenges, member profiles
  - Family: dashboard, parent view per learner, invite, weekly challenge + investing night, research list
  - Profile: settings, notifications inbox, billing, referrals, help, badges, progress
- `src/app/(auth)` — login, signup, forgot/reset password (real Supabase auth)
- `src/app/(full)` — lesson player, Kai sheet (no tab bar)
- `src/components/shell` — Screen, BottomNav, TopBar, KaiFab
- `src/components/ui` — tokens-driven primitives + icon set
- `src/lib/data.ts` — data seam (fixtures today; Supabase next)
- `design/artboards/*.html` — one reference file per canvas artboard; `docs/BUILD-BRIEF-round-2.md` — the system rules for screens without artboards
