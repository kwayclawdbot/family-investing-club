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

## Map
- `src/app/(onboarding)` — Welcome + 5-step onboarding
- `src/app/(app)` — tabbed shell: Home · Learn · Markets · Club · Profile (+ practice, family)
- `src/app/(full)` — lesson player, Kai sheet (no tab bar)
- `src/components/shell` — Screen, BottomNav, TopBar, KaiFab
- `src/components/ui` — tokens-driven primitives + icon set
- `src/lib/data.ts` — data seam (fixtures today; Supabase next)
- `design/artboards/*.html` — one reference file per canvas artboard
